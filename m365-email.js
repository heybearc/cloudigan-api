/**
 * M365 Email Integration for Customer Welcome Emails
 * Uses existing M365 OAuth mailer for sending download links
 */

const M365OAuthMailer = require('./m365-oauth-mailer');

const M365_CONFIG = {
  clientId: process.env.M365_CLIENT_ID,
  tenantId: process.env.M365_TENANT_ID,
  clientSecret: process.env.M365_CLIENT_SECRET,
  fromEmail: process.env.M365_FROM_EMAIL || 'noreply@cloudigan.com',
  fromName: 'Cloudigan Support'
};

let mailer = null;

/**
 * Initialize M365 mailer if configured
 */
function getMailer() {
  if (!mailer && M365_CONFIG.clientId) {
    mailer = new M365OAuthMailer(M365_CONFIG);
  }
  return mailer;
}

/**
 * Send welcome email with download links
 */
async function sendWelcomeEmail(data) {
  const m365Mailer = getMailer();
  
  if (!m365Mailer) {
    throw new Error('M365 email not configured - missing M365_CLIENT_ID');
  }

  const htmlContent = `
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
  `;

  const textContent = `
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
  `;

  try {
    await m365Mailer.sendMail({
      to: data.customerEmail,
      subject: 'Welcome to Cloudigan - Download Your RMM Agent',
      html: htmlContent,
      text: textContent
    });
    
    console.log('Welcome email sent to:', data.customerEmail);
    return true;
  } catch (error) {
    console.error('M365 email failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendWelcomeEmail
};
