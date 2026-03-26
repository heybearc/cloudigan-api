#!/usr/bin/env node
/**
 * Automatic token renewal with alerting
 * Uses refresh_token if available, falls back to Playwright if needed
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { refreshToken, getNewToken } = require('./datto-auth');
const { updateTokenRefreshStatus } = require('./lib/metrics');

const TOKEN_FILE = path.join(__dirname, '.datto-token.json');

/**
 * Send alert email
 */
async function sendAlert(subject, message, isSuccess) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.M365_SMTP_HOST,
      port: parseInt(process.env.M365_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.M365_SMTP_USER,
        pass: process.env.M365_SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.M365_SMTP_USER,
      to: process.env.ALERT_EMAIL || 'cory@cloudigan.com',
      subject: subject,
      text: message,
    });

    console.log(`[Auto-Renew] Alert sent: ${subject}`);
  } catch (error) {
    console.error('[Auto-Renew] Failed to send alert:', error.message);
  }
}

/**
 * Automatic token renewal with fallback
 */
async function autoRenewToken() {
  console.log('[Auto-Renew] Starting automatic token renewal...');
  
  try {
    // Check if token file exists
    let tokenInfo;
    try {
      const tokenData = await fs.readFile(TOKEN_FILE, 'utf8');
      tokenInfo = JSON.parse(tokenData);
    } catch (error) {
      throw new Error('No token file found. Run manual token generation first.');
    }

    // Calculate current expiration
    const expiresIn = tokenInfo.expires_at - Date.now();
    const hoursRemaining = expiresIn / (1000 * 60 * 60);
    
    console.log(`[Auto-Renew] Current token: ${Math.round(hoursRemaining)} hours remaining`);

    let newTokenInfo;
    let method;

    // Try refresh_token first (preferred method)
    if (tokenInfo.refresh_token) {
      console.log('[Auto-Renew] Attempting refresh using refresh_token...');
      try {
        newTokenInfo = await refreshToken();
        method = 'OAuth refresh_token';
        console.log('[Auto-Renew] ✅ Token refreshed using refresh_token');
      } catch (error) {
        console.log('[Auto-Renew] ⚠️  refresh_token failed:', error.message);
        console.log('[Auto-Renew] Falling back to Playwright...');
        newTokenInfo = await getNewToken();
        method = 'Playwright OAuth flow';
        console.log('[Auto-Renew] ✅ Token refreshed using Playwright');
      }
    } else {
      // No refresh_token - use Playwright
      console.log('[Auto-Renew] No refresh_token found, using Playwright...');
      newTokenInfo = await getNewToken();
      method = 'Playwright OAuth flow';
      console.log('[Auto-Renew] ✅ Token refreshed using Playwright');
    }

    // Calculate new expiration
    const newExpiresIn = newTokenInfo.expires_at - Date.now();
    const newHoursRemaining = newExpiresIn / (1000 * 60 * 60);

    // Update Prometheus metric
    updateTokenRefreshStatus('datto', true);

    // Send success alert
    const subject = '✅ Datto Token Renewal Successful';
    const message = `
Datto OAuth Token Renewal - SUCCESS

Method: ${method}
Previous Token: ${Math.round(hoursRemaining)} hours remaining
New Token: ${Math.round(newHoursRemaining)} hours remaining
Expires: ${new Date(newTokenInfo.expires_at).toISOString()}
Has refresh_token: ${!!newTokenInfo.refresh_token}

Server: cloudigan-api-blue (CT181)
Token File: /opt/cloudigan-api/.datto-token.json

${!newTokenInfo.refresh_token ? '\n⚠️  WARNING: New token does NOT have refresh_token. Next renewal will require Playwright.\n' : '✅ Token has refresh_token - future renewals will be automatic.\n'}

No action required. System is operational.
`;

    await sendAlert(subject, message, true);

    console.log('[Auto-Renew] ✅ Token renewal completed successfully');
    console.log(`[Auto-Renew] New token expires in ${Math.round(newHoursRemaining)} hours`);
    console.log(`[Auto-Renew] Has refresh_token: ${!!newTokenInfo.refresh_token}`);

    return {
      success: true,
      method,
      hoursRemaining: newHoursRemaining,
      hasRefreshToken: !!newTokenInfo.refresh_token
    };

  } catch (error) {
    console.error('[Auto-Renew] ❌ Token renewal failed:', error.message);

    // Update Prometheus metric
    updateTokenRefreshStatus('datto', false);

    // Send failure alert
    const subject = '🚨 CRITICAL: Datto Token Renewal FAILED';
    const message = `
Datto OAuth Token Renewal - FAILED

Error: ${error.message}

IMPACT: Token will expire and customer signups will fail.

Immediate Action Required:
1. SSH into CT181: ssh pve && pct enter 181
2. Check logs: tail -50 /opt/cloudigan-api/logs/token-refresh.log
3. Manual refresh: cd /opt/cloudigan-api && node datto-auth.js
4. Verify: node -e "const t = require('./.datto-token.json'); console.log('Expires:', new Date(t.expires_at))"

Server: cloudigan-api-blue (CT181)
Token File: /opt/cloudigan-api/.datto-token.json

Error Details:
${error.stack}
`;

    await sendAlert(subject, message, false);

    throw error;
  }
}

// CLI usage
if (require.main === module) {
  autoRenewToken()
    .then((result) => {
      console.log('\n✅ Auto-renewal completed');
      console.log(`   Method: ${result.method}`);
      console.log(`   Hours remaining: ${Math.round(result.hoursRemaining)}`);
      console.log(`   Has refresh_token: ${result.hasRefreshToken}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Auto-renewal failed:', error.message);
      process.exit(1);
    });
}

module.exports = { autoRenewToken };
