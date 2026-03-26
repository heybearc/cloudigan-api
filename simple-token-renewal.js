#!/usr/bin/env node
/**
 * Simple Datto token renewal using API Key/Secret (Basic Auth)
 * No OAuth flow, no browser automation, no refresh_token needed
 * Based on Datto API v2 documentation
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { updateTokenRefreshStatus } = require('./lib/metrics');

const TOKEN_FILE = path.join(__dirname, '.datto-token.json');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL || 'https://vidal-api.centrastage.net',
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY
};

/**
 * Request new token using API Key/Secret (Basic Auth)
 */
function requestToken() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`).toString('base64');
    const postData = 'grant_type=client_credentials';
    
    const options = {
      hostname: 'vidal-api.centrastage.net',
      port: 443,
      path: '/auth/oauth/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('[Token Renewal] Requesting new token from Datto API...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const tokenData = JSON.parse(data);
            resolve(tokenData);
          } catch (error) {
            reject(new Error(`Failed to parse token response: ${error.message}`));
          }
        } else {
          reject(new Error(`Token request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Token request error: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send alert email
 */
async function sendAlert(subject, message) {
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

    console.log('[Token Renewal] Alert sent:', subject);
  } catch (error) {
    console.error('[Token Renewal] Failed to send alert:', error.message);
  }
}

/**
 * Save token to file
 */
async function saveToken(tokenData) {
  const tokenInfo = {
    access_token: tokenData.access_token,
    token_type: tokenData.token_type || 'bearer',
    expires_in: tokenData.expires_in,
    obtained_at: Date.now(),
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  };

  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
  console.log('[Token Renewal] Token saved to:', TOKEN_FILE);
  
  return tokenInfo;
}

/**
 * Main renewal function
 */
async function renewToken() {
  console.log('[Token Renewal] Starting token renewal...');
  console.log('[Token Renewal] Method: Direct API request (Basic Auth)');
  
  try {
    // Check current token status
    let currentHoursRemaining = 0;
    try {
      const currentTokenData = await fs.readFile(TOKEN_FILE, 'utf8');
      const currentToken = JSON.parse(currentTokenData);
      const expiresIn = currentToken.expires_at - Date.now();
      currentHoursRemaining = expiresIn / (1000 * 60 * 60);
      console.log(`[Token Renewal] Current token: ${Math.round(currentHoursRemaining)} hours remaining`);
    } catch (error) {
      console.log('[Token Renewal] No existing token found');
    }

    // Request new token
    const tokenData = await requestToken();
    console.log('[Token Renewal] ✅ Token received from Datto API');

    // Save token
    const tokenInfo = await saveToken(tokenData);
    
    const newHoursRemaining = tokenInfo.expires_in / 3600;
    console.log(`[Token Renewal] ✅ New token expires in ${Math.round(newHoursRemaining)} hours`);

    // Update Prometheus metric
    updateTokenRefreshStatus('datto', true);

    // Send success alert
    const subject = '✅ Datto Token Renewal Successful';
    const message = `
Datto OAuth Token Renewal - SUCCESS

Method: Direct API Request (Basic Auth)
Previous Token: ${Math.round(currentHoursRemaining)} hours remaining
New Token: ${Math.round(newHoursRemaining)} hours remaining (${tokenInfo.expires_in} seconds)
Expires: ${new Date(tokenInfo.expires_at).toISOString()}

Server: cloudigan-api-blue (CT181)
Token File: /opt/cloudigan-api/.datto-token.json

✅ No OAuth flow required
✅ No browser automation needed
✅ No refresh_token needed
✅ Simple API Key/Secret authentication

Next renewal: Automatic in 4 days
No action required. System is operational.
`;

    await sendAlert(subject, message);

    console.log('[Token Renewal] ✅ Token renewal completed successfully');
    
    return {
      success: true,
      hoursRemaining: newHoursRemaining,
      expiresAt: new Date(tokenInfo.expires_at).toISOString()
    };

  } catch (error) {
    console.error('[Token Renewal] ❌ Token renewal failed:', error.message);

    // Update Prometheus metric
    updateTokenRefreshStatus('datto', false);

    // Send failure alert
    const subject = '🚨 CRITICAL: Datto Token Renewal FAILED';
    const message = `
Datto OAuth Token Renewal - FAILED

Method: Direct API Request (Basic Auth)
Error: ${error.message}

IMPACT: Token will expire and customer signups will fail.

Immediate Action Required:
1. SSH into CT181: ssh pve && pct enter 181
2. Check logs: tail -50 /opt/cloudigan-api/logs/token-refresh.log
3. Verify API credentials in .env file
4. Manual test: cd /opt/cloudigan-api && node simple-token-renewal.js

Server: cloudigan-api-blue (CT181)
Token File: /opt/cloudigan-api/.datto-token.json

API Configuration:
- API URL: ${DATTO_CONFIG.apiUrl}
- API Key: ${DATTO_CONFIG.apiKey ? DATTO_CONFIG.apiKey.substring(0, 10) + '...' : 'NOT SET'}
- API Secret: ${DATTO_CONFIG.apiSecretKey ? '***SET***' : 'NOT SET'}

Error Details:
${error.stack}
`;

    await sendAlert(subject, message);

    throw error;
  }
}

// CLI usage
if (require.main === module) {
  renewToken()
    .then((result) => {
      console.log('\n✅ Token renewal completed');
      console.log(`   Hours remaining: ${Math.round(result.hoursRemaining)}`);
      console.log(`   Expires: ${result.expiresAt}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Token renewal failed:', error.message);
      process.exit(1);
    });
}

module.exports = { renewToken };
