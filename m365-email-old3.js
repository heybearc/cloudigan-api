/**
 * M365 Email Integration for Customer Welcome Emails
 * Fixed: Responsive width, visible logo, reduced white space
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

function getMailer() {
  if (!mailer && M365_CONFIG.clientId) {
    mailer = new M365OAuthMailer(M365_CONFIG);
  }
  return mailer;
}

function getBusinessEmailTemplate(data) {
  const firstName = data.customerName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.7; 
          color: #2c3e50;
          margin: 0;
          padding: 0;
          background-color: #f4f7f9;
          width: 100% !important;
        }
        table { border-collapse: collapse; width: 100%; }
        .outer-table { width: 100%; background-color: #f4f7f9; }
        .container { 
          width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white; 
          padding: 35px 30px 30px 30px; 
          text-align: center;
        }
        .logo-text {
          font-size: 48px;
          font-weight: 700;
          letter-spacing: 3px;
          margin: 0 0 8px 0;
          padding: 0;
          color: white;
          line-height: 1;
        }
        .logo-subtext {
          font-size: 18px;
          letter-spacing: 10px;
          color: white;
          margin: 0 0 15px 0;
          padding: 0;
          line-height: 1;
        }
        .tagline { 
          font-size: 16px; 
          font-style: italic; 
          font-weight: 300;
          margin: 0;
          padding: 0;
          color: white;
        }
        .content { 
          padding: 35px 35px;
          background: #ffffff;
        }
        .greeting {
          font-size: 20px;
          color: #1e3a8a;
          margin: 0 0 20px 0;
          font-weight: 600;
        }
        .section-title { 
          font-size: 22px; 
          font-weight: 700; 
          color: #1e3a8a; 
          margin: 35px 0 15px 0;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        .download-section {
          background: #f8fafc;
          padding: 25px;
          border-radius: 10px;
          margin: 25px 0;
          border: 2px solid #cbd5e1;
        }
        .download-item {
          margin: 18px 0;
        }
        .download-label {
          font-weight: 700;
          color: #475569;
          display: block;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background-color: #3b82f6;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
        }
        .tips-box { 
          background: #fef3c7;
          border-left: 6px solid #f59e0b;
          padding: 22px 28px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .tips-box strong {
          color: #92400e;
          font-size: 17px;
          display: block;
          margin-bottom: 12px;
        }
        .tips-box ul { 
          margin: 10px 0; 
          padding-left: 20px;
          color: #78350f;
        }
        .tips-box li { margin: 10px 0; }
        .info-box {
          background: #f0f9ff;
          border-left: 6px solid #0ea5e9;
          padding: 22px 28px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .footer { 
          background: #1e293b;
          color: #cbd5e1;
          padding: 35px; 
          text-align: center; 
          font-size: 14px;
        }
        .footer a { color: #60a5fa; text-decoration: none; }
        .signature { 
          margin-top: 40px;
          padding-top: 25px;
          border-top: 3px solid #e2e8f0;
        }
        .signature-name {
          font-weight: 700;
          color: #1e3a8a;
          font-size: 18px;
          margin: 0 0 5px 0;
        }
        .signature-title {
          color: #64748b;
          font-size: 15px;
          margin: 5px 0;
        }
        .signature-tagline {
          color: #3b82f6;
          font-style: italic;
          font-size: 15px;
          margin: 8px 0 0 0;
        }
        a { color: #3b82f6; }
        p { margin: 15px 0; }
        @media only screen and (max-width: 620px) {
          .container { width: 100% !important; border-radius: 0 !important; }
          .content { padding: 25px 20px !important; }
          .header { padding: 30px 20px 25px 20px !important; }
          .logo-text { font-size: 36px !important; }
          .logo-subtext { font-size: 14px !important; letter-spacing: 6px !important; }
        }
      </style>
    </head>
    <body>
      <table class="outer-table" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table class="container" cellpadding="0" cellspacing="0">
              <tr>
                <td class="header">
                  <div class="logo-text">Cloudigan</div>
                  <div class="logo-subtext">IT SOLUTIONS</div>
                  <div class="tagline">We do IT so you don't have to.</div>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <div class="greeting">Hi ${firstName},</div>
                  
                  <p>First off, thank you for trusting us with your IT. We are really happy to have <strong>${data.companyName}</strong> as part of the Cloudigan Family.</p>
                  
                  <p>We've got everything on our end moving already, and we're excited to get you fully set up and covered.</p>
                  
                  <div class="section-title">Let's get your devices connected</div>
                  
                  <p>You'll want to install the agent on <strong>each of the devices included in your plan</strong>.</p>
                  
                  <p>Each device you're covering should have the software installed so we can begin monitoring and protecting it.</p>
                  
                  <p>If you haven't downloaded the installer yet, you can do so here:</p>
                  
                  <div class="download-section">
                    <div class="download-item">
                      <span class="download-label">Windows Download:</span>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center" style="padding: 5px 0;">
                          <a href="${data.downloadLinks.windows}" class="btn" style="color: #ffffff; text-decoration: none;">Download for Windows</a>
                        </td></tr>
                      </table>
                    </div>
                    
                    <div class="download-item">
                      <span class="download-label">Mac Download:</span>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center" style="padding: 5px 0;">
                          <a href="${data.downloadLinks.mac}" class="btn" style="color: #ffffff; text-decoration: none;">Download for Mac</a>
                        </td></tr>
                      </table>
                    </div>
                    
                    <div class="download-item">
                      <span class="download-label">Linux Download:</span>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center" style="padding: 5px 0;">
                          <a href="${data.downloadLinks.linux}" class="btn" style="color: #ffffff; text-decoration: none;">Download for Linux</a>
                        </td></tr>
                      </table>
                    </div>
                  </div>
                  
                  <p>Once it is downloaded, click on the file and install will happen automatically.</p>
                  
                  <p>You can forward these links to your team or install them directly on each device—it's totally fine either way.</p>
                  
                  <div class="tips-box">
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
                  
                  <div class="info-box">
                    <p style="margin: 0;"><strong>Your Cloudigan Rep will be reaching out within 24 hours</strong> to give you the official welcome. We'll walk through everything together and make sure your setup fits your business the way it should.</p>
                  </div>
                  
                  <p>Once your devices are installed, we'll take it from there—monitoring, updates, protection, all of it.</p>
                  
                  <p>If anything comes up in the meantime, send an email to <a href="mailto:hello@cloudigan.com">hello@cloudigan.com</a></p>
                  
                  <div class="signature">
                    <p style="margin: 0 0 12px 0;">Looking forward to working with you,</p>
                    <p class="signature-name">Cory Allen</p>
                    <p class="signature-title">Cloudigan IT Solutions</p>
                    <p class="signature-tagline">We do IT so you don't have to.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
                  <p style="margin: 0 0 15px 0;">This email was sent to ${data.customerEmail}</p>
                  <p style="margin: 0;"><a href="https://www.cloudigan.com">www.cloudigan.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function getHomeProtectEmailTemplate(data) {
  const firstName = data.customerName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.7; 
          color: #2c3e50;
          margin: 0;
          padding: 0;
          background-color: #f4f7f9;
          width: 100% !important;
        }
        table { border-collapse: collapse; width: 100%; }
        .outer-table { width: 100%; background-color: #f4f7f9; }
        .container { 
          width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white; 
          padding: 35px 30px 30px 30px; 
          text-align: center;
        }
        .logo-text {
          font-size: 48px;
          font-weight: 700;
          letter-spacing: 3px;
          margin: 0 0 8px 0;
          padding: 0;
          color: white;
          line-height: 1;
        }
        .logo-subtext {
          font-size: 18px;
          letter-spacing: 10px;
          color: white;
          margin: 0 0 15px 0;
          padding: 0;
          line-height: 1;
        }
        .tagline { 
          font-size: 16px; 
          font-style: italic; 
          font-weight: 300;
          margin: 0;
          padding: 0;
          color: white;
        }
        .content { 
          padding: 35px 35px;
          background: #ffffff;
        }
        .greeting {
          font-size: 20px;
          color: #1e3a8a;
          margin: 0 0 20px 0;
          font-weight: 600;
        }
        .section-title { 
          font-size: 22px; 
          font-weight: 700; 
          color: #1e3a8a; 
          margin: 35px 0 20px 0;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        .step {
          margin: 30px 0;
          display: table;
          width: 100%;
        }
        .step-number {
          display: table-cell;
          width: 50px;
          height: 50px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          text-align: center;
          vertical-align: middle;
          font-weight: 700;
          font-size: 22px;
        }
        .step-content {
          display: table-cell;
          padding-left: 20px;
          vertical-align: top;
        }
        .step-title {
          font-weight: 700;
          font-size: 18px;
          color: #1e3a8a;
          margin: 0 0 10px 0;
        }
        .download-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 10px;
          margin: 15px 0;
          border: 2px solid #cbd5e1;
        }
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background-color: #3b82f6;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          margin: 8px 0;
        }
        .benefits-box {
          background: #ecfdf5;
          border-left: 6px solid #10b981;
          padding: 22px 28px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .benefits-box strong {
          color: #065f46;
          font-size: 16px;
          display: block;
          margin-bottom: 10px;
        }
        .benefits-box ul { 
          margin: 10px 0; 
          padding-left: 20px;
          color: #047857;
        }
        .benefits-box li { margin: 8px 0; }
        .reminder-box {
          background: #fef3c7;
          border-left: 6px solid #f59e0b;
          padding: 22px 28px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .reminder-box strong {
          color: #92400e;
          font-size: 17px;
          display: block;
          margin-bottom: 8px;
        }
        .reminder-box p { color: #78350f; margin: 0; }
        .help-section {
          background: #f0f9ff;
          border-left: 6px solid #0ea5e9;
          padding: 22px 28px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .footer { 
          background: #1e293b;
          color: #cbd5e1;
          padding: 35px; 
          text-align: center; 
          font-size: 14px;
        }
        .footer a { color: #60a5fa; text-decoration: none; }
        .signature { 
          margin-top: 40px;
          padding-top: 25px;
          border-top: 3px solid #e2e8f0;
          text-align: center;
        }
        .signature-team {
          font-weight: 700;
          color: #1e3a8a;
          font-size: 18px;
          margin: 8px 0 0 0;
        }
        a { color: #3b82f6; }
        p { margin: 15px 0; }
        @media only screen and (max-width: 620px) {
          .container { width: 100% !important; border-radius: 0 !important; }
          .content { padding: 25px 20px !important; }
          .header { padding: 30px 20px 25px 20px !important; }
          .logo-text { font-size: 36px !important; }
          .logo-subtext { font-size: 14px !important; letter-spacing: 6px !important; }
          .step { display: block !important; }
          .step-number { display: inline-block !important; margin-bottom: 15px !important; }
          .step-content { display: block !important; padding-left: 0 !important; }
        }
      </style>
    </head>
    <body>
      <table class="outer-table" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table class="container" cellpadding="0" cellspacing="0">
              <tr>
                <td class="header">
                  <div class="logo-text">Cloudigan</div>
                  <div class="logo-subtext">IT SOLUTIONS</div>
                  <div class="tagline">We do IT so you don't have to.</div>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <div class="greeting">Hi ${firstName},</div>
                  
                  <p>Welcome to our Cloudigan Family! We are so glad you're here.</p>
                  
                  <p>Your subscription is active, and your download links are ready below.</p>
                  
                  <div class="section-title">Let's get you set up:</div>
                  
                  <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                      <div class="step-title">Download Home Protect</div>
                      <p style="margin: 10px 0;">Use the link that matches your device:</p>
                      <div class="download-section">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr><td align="center" style="padding: 5px 0;"><a href="${data.downloadLinks.windows}" class="btn" style="color: #ffffff; text-decoration: none;">Windows Download</a></td></tr>
                          <tr><td align="center" style="padding: 5px 0;"><a href="${data.downloadLinks.mac}" class="btn" style="color: #ffffff; text-decoration: none;">Mac Download</a></td></tr>
                          <tr><td align="center" style="padding: 5px 0;"><a href="${data.downloadLinks.linux}" class="btn" style="color: #ffffff; text-decoration: none;">Linux Download</a></td></tr>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                      <div class="step-title">Install on your device(s)</div>
                      <p style="margin: 10px 0;">Open the file and installation will begin automatically.</p>
                      
                      <div class="benefits-box">
                        <strong>Once installed, your device will begin receiving:</strong>
                        <ul>
                          <li>security protection</li>
                          <li>automatic updates</li>
                          <li>system monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                      <div class="step-title">That's it—you're covered</div>
                      <p style="margin: 10px 0;">After installation, everything runs quietly in the background. If something needs your attention, we'll send you a simple email with next steps.</p>
                    </div>
                  </div>
                  
                  <div class="reminder-box">
                    <strong>A quick reminder</strong>
                    <p>Your plan covers your devices. If you'd like to protect more devices later, you can upgrade anytime.</p>
                  </div>
                  
                  <div class="section-title">Need help?</div>
                  
                  <div class="help-section">
                    <p style="margin: 0;">Home Protect is designed to be simple and hands-off, but if you have questions, send a message to <a href="mailto:hello@cloudigan.com">hello@cloudigan.com</a> and we'll point you in the right direction.</p>
                  </div>
                  
                  <div class="signature">
                    <p style="margin: 0 0 8px 0;">Thanks again for trusting Cloudigan.</p>
                    <p class="signature-team">– The Cloudigan Team</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
                  <p style="margin: 0 0 15px 0;">This email was sent to ${data.customerEmail}</p>
                  <p style="margin: 0;"><a href="https://www.cloudigan.com">www.cloudigan.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function sendWelcomeEmail(data) {
  const m365Mailer = getMailer();
  
  if (!m365Mailer) {
    throw new Error('M365 email not configured - missing M365_CLIENT_ID');
  }

  const htmlContent = data.isBusinessProduct 
    ? getBusinessEmailTemplate(data)
    : getHomeProtectEmailTemplate(data);

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
