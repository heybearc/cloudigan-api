/**
 * Error alerting module
 * Sends critical error notifications via M365 email
 */

const M365OAuthMailer = require('../m365-oauth-mailer');
const { logger } = require('./logger');

class ErrorAlerter {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.alertEmail = config.alertEmail || process.env.ALERT_EMAIL || 'cory@cloudigan.com';
    this.fromEmail = config.fromEmail || process.env.M365_FROM_EMAIL;
    this.minSeverity = config.minSeverity || 'error'; // error, critical
    this.cooldownMs = config.cooldownMs || 300000; // 5 minutes
    this.lastAlertTime = {};
    
    // Initialize M365 mailer if configured
    if (process.env.M365_CLIENT_ID) {
      this.mailer = new M365OAuthMailer({
        clientId: process.env.M365_CLIENT_ID,
        tenantId: process.env.M365_TENANT_ID,
        clientSecret: process.env.M365_CLIENT_SECRET,
        fromEmail: this.fromEmail,
        fromName: 'Cloudigan API Alerts'
      });
    }
  }
  
  /**
   * Check if alert should be sent (cooldown logic)
   */
  shouldSendAlert(errorType) {
    if (!this.enabled || !this.mailer) {
      return false;
    }
    
    const lastAlert = this.lastAlertTime[errorType];
    if (!lastAlert) {
      return true;
    }
    
    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert >= this.cooldownMs;
  }
  
  /**
   * Send error alert email
   */
  async sendAlert(error, context = {}) {
    const errorType = error.code || error.name || 'UNKNOWN_ERROR';
    
    if (!this.shouldSendAlert(errorType)) {
      logger.debug('Alert suppressed due to cooldown', { errorType });
      return;
    }
    
    try {
      const subject = `🚨 Cloudigan API Error: ${errorType}`;
      const html = this.formatAlertEmail(error, context);
      
      await this.mailer.sendMail({
        to: this.alertEmail,
        subject,
        html
      });
      
      this.lastAlertTime[errorType] = Date.now();
      
      logger.info('Error alert sent', {
        errorType,
        recipient: this.alertEmail
      });
      
    } catch (emailError) {
      logger.error('Failed to send error alert', {
        error: emailError.message,
        originalError: error.message
      });
    }
  }
  
  /**
   * Format error alert email
   */
  formatAlertEmail(error, context) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      message: error.message,
      code: error.code || 'N/A',
      name: error.name,
      stack: error.stack
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #495057; }
          .value { background: white; padding: 10px; border-radius: 3px; margin-top: 5px; }
          .stack { font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Cloudigan API Error Alert</h2>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">Timestamp:</div>
              <div class="value">${timestamp}</div>
            </div>
            
            <div class="section">
              <div class="label">Error Type:</div>
              <div class="value">${errorDetails.name} (${errorDetails.code})</div>
            </div>
            
            <div class="section">
              <div class="label">Error Message:</div>
              <div class="value">${errorDetails.message}</div>
            </div>
            
            ${context.correlationId ? `
            <div class="section">
              <div class="label">Correlation ID:</div>
              <div class="value">${context.correlationId}</div>
            </div>
            ` : ''}
            
            ${context.operation ? `
            <div class="section">
              <div class="label">Operation:</div>
              <div class="value">${context.operation}</div>
            </div>
            ` : ''}
            
            ${Object.keys(context).length > 0 ? `
            <div class="section">
              <div class="label">Context:</div>
              <div class="value"><pre>${JSON.stringify(context, null, 2)}</pre></div>
            </div>
            ` : ''}
            
            <div class="section">
              <div class="label">Stack Trace:</div>
              <div class="value stack">${errorDetails.stack}</div>
            </div>
            
            <div class="footer">
              <p><strong>Action Required:</strong> Review the error and take appropriate action.</p>
              <p>This alert was sent from: ${process.env.NODE_ENV || 'development'} environment</p>
              <p>Container: ${context.hostname || 'unknown'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Alert for critical errors only
   */
  async alertCritical(error, context = {}) {
    await this.sendAlert(error, { ...context, severity: 'critical' });
  }
  
  /**
   * Get alerter status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      mailerConfigured: !!this.mailer,
      alertEmail: this.alertEmail,
      cooldownMs: this.cooldownMs,
      activeAlerts: Object.keys(this.lastAlertTime).length
    };
  }
}

// Singleton instance
let alerterInstance = null;

function getAlerter() {
  if (!alerterInstance) {
    alerterInstance = new ErrorAlerter();
  }
  return alerterInstance;
}

module.exports = {
  ErrorAlerter,
  getAlerter
};
