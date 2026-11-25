/**
 * Outbound mail goes through Cloudigan Mail.
 * The gateway is the only caller of Microsoft Graph.
 */

const https = require('https');

class M365OAuthMailer {
  constructor(config) {
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || 'Cloudigan IT Solutions';
    this.replyTo = config.replyTo;
  }

  /**
   * Send email via Cloudigan Mail POST /v1/send
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML email body
   * @param {string} options.text - Plain text email body (optional)
   */
  async sendMail(options) {
    const apiKey = process.env.MAIL_GATEWAY_API_KEY;
    const base = (process.env.MAIL_GATEWAY_URL || 'https://mail.cloudigan.net').replace(/\/$/, '');
    if (!apiKey) {
      throw new Error('MAIL_GATEWAY_API_KEY is not set');
    }

    const payload = {
      to: options.to,
      subject: options.subject,
      fromEmail: options.fromEmail || this.fromEmail,
      fromName: options.fromName || this.fromName,
    };
    if (options.html) payload.html = options.html;
    if (options.text) payload.text = options.text;
    const replyTo = options.replyTo || this.replyTo;
    if (replyTo) payload.replyTo = replyTo;

    const body = JSON.stringify(payload);
    const endpoint = new URL(`${base}/v1/send`);

    return new Promise((resolve, reject) => {
      const req = https.request(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(data); } catch (_) { parsed = {}; }
          if (res.statusCode === 200 && parsed.success) {
            resolve({ success: true, messageId: parsed.messageId });
          } else {
            reject(new Error(`Mail gateway failed: ${res.statusCode} ${parsed.error || data}`));
          }
        });
      });
      req.on('error', (error) => reject(new Error(`Mail gateway failed: ${error.message}`)));
      req.write(body);
      req.end();
    });
  }
}

module.exports = M365OAuthMailer;
