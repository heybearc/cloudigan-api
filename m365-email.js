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
 * Generate business customer email template
 */
function getBusinessEmailTemplate(data) {
  const firstName = data.customerName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { 
          background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
        }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 14px; font-style: italic; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #0066cc; 
          margin-top: 25px;
          margin-bottom: 15px;
        }
        .download-section {
          background: #f5f8fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .download-link {
          display: block;
          margin: 10px 0;
          padding: 12px 20px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
        }
        .download-link:hover { background: #0052a3; }
        .tips { 
          background: #fff9e6;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .tips ul { margin: 10px 0; padding-left: 20px; }
        .footer { 
          background: #f5f5f5;
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          color: #666;
          border-top: 1px solid #ddd;
        }
        .signature { margin-top: 30px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CLOUDIGAN</div>
          <div class="tagline">We do IT so you don't have to.</div>
        </div>
        
        <div class="content">
          <p>Hi ${firstName},</p>
          
          <p>First off, thank you for trusting us with your IT. We are really happy to have <strong>${data.companyName}</strong> as part of the Cloudigan Family.</p>
          
          <p>We've got everything on our end moving already, and we're excited to get you fully set up and covered.</p>
          
          <div class="section-title">Let's get your devices connected</div>
          
          <p>You'll want to install the agent on <strong>each of the devices included in your plan</strong>.</p>
          
          <p>Each device you're covering should have the software installed so we can begin monitoring and protecting it.</p>
          
          <p>If you haven't downloaded the installer yet, you can do so here:</p>
          
          <div class="download-section">
            <strong>Windows Download:</strong><br>
            <a href="${data.downloadLinks.windows}" class="download-link">Download for Windows</a>
            
            <strong>Mac Download:</strong><br>
            <a href="${data.downloadLinks.mac}" class="download-link">Download for Mac</a>
            
            <strong>Linux Download:</strong><br>
            <a href="${data.downloadLinks.linux}" class="download-link">Download for Linux</a>
          </div>
          
          <p>Once it is downloaded, click on the file and install will happen automatically.</p>
          
          <p>You can forward these links to your team or install them directly on each device—it's totally fine either way.</p>
          
          <div class="tips">
            <strong>A couple quick tips</strong>
            <ul>
              <li>Make sure the software is installed on the correct number of devices included in your plan</li>
              <li>If you're unsure which devices to prioritize, no problem—we'll go through that together</li>
              <li>Installation only takes a few seconds per device</li>
            </ul>
          </div>
          
          <div class="section-title">Need to adjust your device count?</div>
          
          <p>If you need to add or remove devices, you can manage your subscription in your Stripe customer portal.</p>
          
          <p>Or just let us know—we're happy to help you make the right adjustments.</p>
          
          <div class="section-title">What happens next</div>
          
          <p>Your Cloudigan Rep will be reaching out within 24 hours to give you the official welcome. We'll walk through everything together and make sure your setup fits your business the way it should.</p>
          
          <p>Once your devices are installed, we'll take it from there—monitoring, updates, protection, all of it.</p>
          
          <p>If anything comes up in the meantime, send an email to <a href="mailto:hello@cloudigan.com">hello@cloudigan.com</a></p>
          
          <div class="signature">
            <p>Looking forward to working with you,</p>
            <p><strong>Cory Allen</strong><br>
            Cloudigan IT Solutions<br>
            <em>We do IT so you don't have to.</em></p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
          <p>This email was sent to ${data.customerEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate home protect customer email template
 */
function getHomeProtectEmailTemplate(data) {
  const firstName = data.customerName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { 
          background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
        }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 14px; font-style: italic; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #0066cc; 
          margin-top: 25px;
          margin-bottom: 15px;
        }
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          background: #0066cc;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 30px;
          font-weight: bold;
          margin-right: 10px;
        }
        .step {
          margin: 20px 0;
          padding-left: 40px;
        }
        .download-section {
          background: #f5f8fa;
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .download-link {
          display: block;
          margin: 10px 0;
          padding: 12px 20px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
        }
        .download-link:hover { background: #0052a3; }
        .benefits {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          margin: 20px 0;
        }
        .benefits ul { margin: 10px 0; padding-left: 20px; }
        .reminder {
          background: #fff9e6;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer { 
          background: #f5f5f5;
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          color: #666;
          border-top: 1px solid #ddd;
        }
        .signature { margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CLOUDIGAN</div>
          <div class="tagline">We do IT so you don't have to.</div>
        </div>
        
        <div class="content">
          <p>Hi ${firstName},</p>
          
          <p>Welcome to our Cloudigan Family! We are so glad you're here.</p>
          
          <p>Your subscription is active, and your download links are ready below.</p>
          
          <div class="section-title">Let's get you set up:</div>
          
          <div class="step">
            <span class="step-number">1</span>
            <strong>Download Home Protect</strong>
            <p>Use the link that matches your device:</p>
            <div class="download-section">
              <a href="${data.downloadLinks.windows}" class="download-link">Windows Download</a>
              <a href="${data.downloadLinks.mac}" class="download-link">Mac Download</a>
              <a href="${data.downloadLinks.linux}" class="download-link">Linux Download</a>
            </div>
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <strong>Install on your device(s)</strong>
            <p>Open the file and installation will begin automatically.</p>
            
            <div class="benefits">
              <p><strong>Once installed, your device will begin receiving:</strong></p>
              <ul>
                <li>security protection</li>
                <li>automatic updates</li>
                <li>system monitoring</li>
              </ul>
            </div>
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <strong>That's it—you're covered</strong>
            <p>After installation, everything runs quietly in the background. If something needs your attention, we'll send you a simple email with next steps.</p>
          </div>
          
          <div class="reminder">
            <strong>A quick reminder</strong>
            <p>Your plan covers your devices. If you'd like to protect more devices later, you can upgrade anytime.</p>
          </div>
          
          <div class="section-title">Need help?</div>
          
          <p>Home Protect is designed to be simple and hands-off, but if you have questions, send a message to <a href="mailto:hello@cloudigan.com">hello@cloudigan.com</a> and we'll point you in the right direction.</p>
          
          <div class="signature">
            <p>Thanks again for trusting Cloudigan.</p>
            <p><strong>– The Cloudigan Team</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
          <p>This email was sent to ${data.customerEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send welcome email with download links
 */
async function sendWelcomeEmail(data) {
  const m365Mailer = getMailer();
  
  if (!m365Mailer) {
    throw new Error('M365 email not configured - missing M365_CLIENT_ID');
  }

  // Choose template based on product type
  const htmlContent = data.isBusinessProduct 
    ? getBusinessEmailTemplate(data)
    : getHomeProtectEmailTemplate(data);

  // Generate plain text version
  const firstName = data.customerName.split(' ')[0];
  const textContent = data.isBusinessProduct ? `
Hi ${firstName},

First off, thank you for trusting us with your IT. We are really happy to have ${data.companyName} as part of the Cloudigan Family.

We've got everything on our end moving already, and we're excited to get you fully set up and covered.

LET'S GET YOUR DEVICES CONNECTED

You'll want to install the agent on each of the devices included in your plan.

Download Links:
- Windows: ${data.downloadLinks.windows}
- Mac: ${data.downloadLinks.mac}
- Linux: ${data.downloadLinks.linux}

Once it is downloaded, click on the file and install will happen automatically.

A COUPLE QUICK TIPS
• Make sure the software is installed on the correct number of devices included in your plan
• If you're unsure which devices to prioritize, no problem—we'll go through that together
• Installation only takes a few seconds per device

WHAT HAPPENS NEXT

Your Cloudigan Rep will be reaching out within 24 hours to give you the official welcome.

If anything comes up in the meantime, send an email to hello@cloudigan.com

Looking forward to working with you,
Cory Allen
Cloudigan IT Solutions
We do IT so you don't have to.
  ` : `
Hi ${firstName},

Welcome to our Cloudigan Family! We are so glad you're here.

Your subscription is active, and your download links are ready below.

LET'S GET YOU SET UP:

1. Download Home Protect
   - Windows: ${data.downloadLinks.windows}
   - Mac: ${data.downloadLinks.mac}
   - Linux: ${data.downloadLinks.linux}

2. Install on your device(s)
   Open the file and installation will begin automatically.

3. That's it—you're covered
   After installation, everything runs quietly in the background.

NEED HELP?

Home Protect is designed to be simple and hands-off, but if you have questions, send a message to hello@cloudigan.com

Thanks again for trusting Cloudigan.
– The Cloudigan Team
  `;

  const subject = data.isBusinessProduct
    ? `Welcome to Cloudigan - ${data.companyName}`
    : 'Welcome to Cloudigan Home Protect';

  try {
    await m365Mailer.sendMail({
      to: data.customerEmail,
      subject: subject,
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
