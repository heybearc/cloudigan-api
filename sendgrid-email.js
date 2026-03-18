/**
 * SendGrid Email Integration
 * Sends welcome emails with download links to customers
 */

const sgMail = require('@sendgrid/mail');

const SENDGRID_CONFIG = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@cloudigan.com',
  fromName: 'Cloudigan Support'
};

// Initialize SendGrid
if (SENDGRID_CONFIG.apiKey) {
  sgMail.setApiKey(SENDGRID_CONFIG.apiKey);
}

/**
 * Send welcome email with download links
 */
async function sendWelcomeEmail(data) {
  if (!SENDGRID_CONFIG.apiKey) {
    throw new Error('SendGrid not configured - missing SENDGRID_API_KEY');
  }

  const msg = {
    to: data.customerEmail,
    from: {
      email: SENDGRID_CONFIG.fromEmail,
      name: SENDGRID_CONFIG.fromName
    },
    subject: 'Welcome to Cloudigan - Download Your RMM Agent',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Cloudigan!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for subscribing to Cloudigan's RMM services!</p>
            <p>Your Datto RMM site has been created successfully. Download the agent for your platform:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.downloadLinks.windows}" class="button">Download for Windows</a>
              <a href="${data.downloadLinks.mac}" class="button">Download for macOS</a>
              <a href="${data.downloadLinks.linux}" class="button">Download for Linux</a>
            </div>
            
            <p><strong>Your Site UID:</strong> ${data.siteUid}</p>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Download the agent for your operating system</li>
              <li>Run the installer on your device</li>
              <li>The agent will automatically connect to your RMM site</li>
              <li>You'll see your device appear in the Datto RMM dashboard</li>
            </ol>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Cloudigan. All rights reserved.</p>
            <p>This email was sent to ${data.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Cloudigan!

Hello ${data.customerName},

Thank you for subscribing to Cloudigan's RMM services!

Your Datto RMM site has been created successfully.

Download Links:
- Windows: ${data.downloadLinks.windows}
- macOS: ${data.downloadLinks.mac}
- Linux: ${data.downloadLinks.linux}

Your Site UID: ${data.siteUid}

Next Steps:
1. Download the agent for your operating system
2. Run the installer on your device
3. The agent will automatically connect to your RMM site
4. You'll see your device appear in the Datto RMM dashboard

If you have any questions or need assistance, please contact our support team.

© ${new Date().getFullYear()} Cloudigan. All rights reserved.
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent to:', data.customerEmail);
    return true;
  } catch (error) {
    console.error('SendGrid email failed:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendWelcomeEmail
};
