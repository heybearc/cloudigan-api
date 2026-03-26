/**
 * Token expiration monitoring and alerting
 */

const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { updateDattoTokenExpiry, updateTokenRefreshStatus } = require('./metrics');

const TOKEN_FILE = path.join(__dirname, '..', '.datto-token.json');
const ALERT_THRESHOLD_HOURS = 24; // Alert when less than 24 hours remain

/**
 * Check token expiration and update metrics
 */
async function checkTokenExpiration() {
  try {
    const tokenData = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenInfo = JSON.parse(tokenData);
    
    const expiresIn = tokenInfo.expires_at - Date.now();
    const hoursRemaining = expiresIn / (1000 * 60 * 60);
    
    // Update Prometheus metric
    updateDattoTokenExpiry(hoursRemaining);
    
    console.log(`[Token Monitor] Datto token: ${Math.round(hoursRemaining)} hours remaining`);
    
    // Check if alert is needed
    if (hoursRemaining < ALERT_THRESHOLD_HOURS && hoursRemaining > 0) {
      await sendTokenExpirationAlert(hoursRemaining);
    } else if (hoursRemaining <= 0) {
      await sendTokenExpiredAlert(Math.abs(hoursRemaining));
    }
    
    return {
      hoursRemaining,
      needsRefresh: hoursRemaining < ALERT_THRESHOLD_HOURS,
      expired: hoursRemaining <= 0
    };
  } catch (error) {
    console.error('[Token Monitor] Error checking token expiration:', error.message);
    updateDattoTokenExpiry(-999); // Sentinel value for error
    return { error: error.message };
  }
}

/**
 * Send token expiration warning alert
 */
async function sendTokenExpirationAlert(hoursRemaining) {
  const subject = `⚠️ Datto OAuth Token Expiring Soon (${Math.round(hoursRemaining)}h remaining)`;
  const message = `
Datto OAuth Token Expiration Warning

The Datto OAuth token will expire in ${Math.round(hoursRemaining)} hours.

Action Required:
1. SSH into CT181: ssh pve && pct enter 181
2. Run token refresh: cd /opt/cloudigan-api && node datto-auth.js
3. Verify token: node -e "const t = require('./.datto-token.json'); console.log('Expires:', new Date(t.expires_at))"

Or manually generate a new token from the Datto RMM portal.

Token File: /opt/cloudigan-api/.datto-token.json
Server: cloudigan-api-blue (CT181)

This alert is sent when less than ${ALERT_THRESHOLD_HOURS} hours remain.
`;

  await sendAlert(subject, message);
}

/**
 * Send token expired alert
 */
async function sendTokenExpiredAlert(hoursExpired) {
  const subject = `🚨 CRITICAL: Datto OAuth Token EXPIRED (${Math.round(hoursExpired)}h ago)`;
  const message = `
CRITICAL: Datto OAuth Token Has Expired

The Datto OAuth token expired ${Math.round(hoursExpired)} hours ago.

IMPACT: Customer signups are FAILING. New customers cannot be onboarded.

Immediate Action Required:
1. SSH into CT181: ssh pve && pct enter 181
2. Generate new token: cd /opt/cloudigan-api && node datto-auth.js
3. Restart service: systemctl restart cloudigan-api
4. Verify: curl http://localhost:3000/health

Or manually generate a new token from the Datto RMM portal.

Token File: /opt/cloudigan-api/.datto-token.json
Server: cloudigan-api-blue (CT181)
`;

  await sendAlert(subject, message);
}

/**
 * Send alert email
 */
async function sendAlert(subject, message) {
  try {
    // Use the same M365 mailer as the application
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

    console.log('[Token Monitor] Alert sent:', subject);
  } catch (error) {
    console.error('[Token Monitor] Failed to send alert:', error.message);
  }
}

/**
 * Monitor token expiration on interval
 */
function startTokenMonitoring(intervalMinutes = 60) {
  console.log(`[Token Monitor] Starting token monitoring (check every ${intervalMinutes} minutes)`);
  
  // Check immediately on start
  checkTokenExpiration();
  
  // Then check on interval
  setInterval(() => {
    checkTokenExpiration();
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  checkTokenExpiration,
  startTokenMonitoring,
  sendTokenExpirationAlert,
  sendTokenExpiredAlert
};
