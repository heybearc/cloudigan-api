/**
 * M365 Email Integration - Simplified for email client compatibility
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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 5px 0; padding: 0; color: #ffffff; font-size: 44px; font-weight: 700; letter-spacing: 2px;">Cloudigan</h1>
              <p style="margin: 0 0 12px 0; padding: 0; color: #ffffff; font-size: 16px; letter-spacing: 8px; font-weight: 400;">IT SOLUTIONS</p>
              <p style="margin: 0; padding: 0; color: #ffffff; font-size: 15px; font-style: italic; opacity: 0.95;">We do IT so you don't have to.</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 35px 35px;">
              
              <p style="margin: 0 0 20px 0; font-size: 19px; color: #1e3a8a; font-weight: 600;">Hi ${firstName},</p>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">First off, thank you for trusting us with your IT. We are really happy to have <strong>${data.companyName}</strong> as part of the Cloudigan Family.</p>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">We've got everything on our end moving already, and we're excited to get you fully set up and covered.</p>
              
              <h2 style="margin: 30px 0 15px 0; padding: 0 0 8px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6;">Let's get your devices connected</h2>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">You'll want to install the agent on <strong>each of the devices included in your plan</strong>.</p>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Each device you're covering should have the software installed so we can begin monitoring and protecting it.</p>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you haven't downloaded the installer yet, you can do so here:</p>
              
              <!-- Download Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #475569;">Windows Download:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${data.downloadLinks.windows}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px;">Download for Windows</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #475569;">Mac Download:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${data.downloadLinks.mac}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px;">Download for Mac</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #475569;">Linux Download:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${data.downloadLinks.linux}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px;">Download for Linux</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Once it is downloaded, click on the file and install will happen automatically.</p>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">You can forward these links to your team or install them directly on each device—it's totally fine either way.</p>
              
              <!-- Tips Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 5px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #92400e;">A couple quick tips</p>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
                      <li style="margin: 8px 0;">Make sure the software is installed on the correct number of devices included in your plan</li>
                      <li style="margin: 8px 0;">If you're unsure which devices to prioritize, no problem—we'll go through that together</li>
                      <li style="margin: 8px 0;">Installation only takes a few seconds per device</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <h2 style="margin: 30px 0 15px 0; padding: 0 0 8px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6;">Need to adjust your device count?</h2>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you need to add or remove devices, you can manage your subscription in your Stripe customer portal.</p>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Or just let us know—we're happy to help you make the right adjustments.</p>
              
              <h2 style="margin: 30px 0 15px 0; padding: 0 0 8px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6;">What happens next</h2>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-left: 5px solid #0ea5e9; border-radius: 0 6px 6px 0; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #0c4a6e;"><strong>Your Cloudigan Rep will be reaching out within 24 hours</strong> to give you the official welcome. We'll walk through everything together and make sure your setup fits your business the way it should.</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Once your devices are installed, we'll take it from there—monitoring, updates, protection, all of it.</p>
              
              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If anything comes up in the meantime, send an email to <a href="mailto:hello@cloudigan.com" style="color: #3b82f6; text-decoration: none;">hello@cloudigan.com</a></p>
              
              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; font-size: 15px; color: #2c3e50;">Looking forward to working with you,</p>
                    <p style="margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">Cory Allen</p>
                    <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748b;">Cloudigan IT Solutions</p>
                    <p style="margin: 0; font-size: 14px; font-style: italic; color: #3b82f6;">We do IT so you don't have to.</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;">&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1;">This email was sent to ${data.customerEmail}</p>
              <p style="margin: 0; font-size: 13px;"><a href="https://www.cloudigan.com" style="color: #60a5fa; text-decoration: none;">www.cloudigan.com</a></p>
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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 5px 0; padding: 0; color: #ffffff; font-size: 44px; font-weight: 700; letter-spacing: 2px;">Cloudigan</h1>
              <p style="margin: 0 0 12px 0; padding: 0; color: #ffffff; font-size: 16px; letter-spacing: 8px; font-weight: 400;">IT SOLUTIONS</p>
              <p style="margin: 0; padding: 0; color: #ffffff; font-size: 15px; font-style: italic; opacity: 0.95;">We do IT so you don't have to.</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 35px 35px;">
              
              <p style="margin: 0 0 20px 0; font-size: 19px; color: #1e3a8a; font-weight: 600;">Hi ${firstName},</p>
              
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Welcome to our Cloudigan Family! We are so glad you're here.</p>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Your subscription is active, and your download links are ready below.</p>
              
              <h2 style="margin: 30px 0 20px 0; padding: 0 0 8px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6;">Let's get you set up:</h2>
              
              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td width="50" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #3b82f6; color: #ffffff; border-radius: 50%; text-align: center; line-height: 45px; font-size: 20px; font-weight: 700;">1</div>
                  </td>
                  <td valign="top" style="padding-left: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">Download Home Protect</p>
                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #2c3e50;">Use the link that matches your device:</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 15px;">
                      <tr>
                        <td align="center" style="padding: 6px 0;">
                          <a href="${data.downloadLinks.windows}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">Windows Download</a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 6px 0;">
                          <a href="${data.downloadLinks.mac}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">Mac Download</a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 6px 0;">
                          <a href="${data.downloadLinks.linux}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">Linux Download</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td width="50" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #3b82f6; color: #ffffff; border-radius: 50%; text-align: center; line-height: 45px; font-size: 20px; font-weight: 700;">2</div>
                  </td>
                  <td valign="top" style="padding-left: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">Install on your device(s)</p>
                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #2c3e50;">Open the file and installation will begin automatically.</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-left: 5px solid #10b981; border-radius: 0 6px 6px 0; padding: 18px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #065f46;">Once installed, your device will begin receiving:</p>
                          <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.6;">
                            <li style="margin: 6px 0;">security protection</li>
                            <li style="margin: 6px 0;">automatic updates</li>
                            <li style="margin: 6px 0;">system monitoring</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td width="50" valign="top">
                    <div style="width: 45px; height: 45px; background-color: #3b82f6; color: #ffffff; border-radius: 50%; text-align: center; line-height: 45px; font-size: 20px; font-weight: 700;">3</div>
                  </td>
                  <td valign="top" style="padding-left: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">That's it—you're covered</p>
                    <p style="margin: 0; font-size: 15px; color: #2c3e50;">After installation, everything runs quietly in the background. If something needs your attention, we'll send you a simple email with next steps.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Reminder Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 5px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 20px; margin: 25px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #92400e;">A quick reminder</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">Your plan covers your devices. If you'd like to protect more devices later, you can upgrade anytime.</p>
                  </td>
                </tr>
              </table>
              
              <h2 style="margin: 30px 0 15px 0; padding: 0 0 8px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6;">Need help?</h2>
              
              <!-- Help Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-left: 5px solid #0ea5e9; border-radius: 0 6px 6px 0; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #0c4a6e;">Home Protect is designed to be simple and hands-off, but if you have questions, send a message to <a href="mailto:hello@cloudigan.com" style="color: #0ea5e9; text-decoration: none;">hello@cloudigan.com</a> and we'll point you in the right direction.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #2c3e50;">Thanks again for trusting Cloudigan.</p>
                    <p style="margin: 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">– The Cloudigan Team</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;">&copy; ${new Date().getFullYear()} Cloudigan IT Solutions. All rights reserved.</p>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1;">This email was sent to ${data.customerEmail}</p>
              <p style="margin: 0; font-size: 13px;"><a href="https://www.cloudigan.com" style="color: #60a5fa; text-decoration: none;">www.cloudigan.com</a></p>
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

Download Links:
- Windows: ${data.downloadLinks.windows}
- Mac: ${data.downloadLinks.mac}
- Linux: ${data.downloadLinks.linux}

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
