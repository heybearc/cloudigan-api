/**
 * Customer confirmation email for Chapter Hub subscription purchases.
 */

const { SUPPORT_EMAIL, NO_REPLY_NOTE, CHAPTER_HUB_APP_URL } = require('./email-constants');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildChapterHubConfirmationEmail(data) {
  const firstName = (data.customerName || 'there').split(' ')[0];
  const productName = data.productName || 'Chapter Hub';
  const amount = ((data.amountTotal || 0) / 100).toFixed(2);
  const currency = (data.currency || 'usd').toUpperCase();
  const supportEmail = data.supportEmail || SUPPORT_EMAIL;
  const appUrl = data.appUrl || CHAPTER_HUB_APP_URL;
  const year = new Date().getFullYear();

  const subject = `Welcome to Chapter Hub — ${productName}`;

  const companyLine = data.companyName
    ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Organization:</strong> ${escapeHtml(data.companyName)}</p>`
    : '';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 3px solid #3b82f6;">
              <img src="https://api.cloudigan.net/public/cloudigan-logo.png" alt="Cloudigan IT Solutions" width="320" style="width: 320px; max-width: 90%; height: auto; display: block; margin: 0 auto 15px auto; border: 0;" />
              <p style="margin: 0; padding: 0; color: #1e3a8a; font-size: 15px; font-style: italic;">We do IT so you don't have to.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px;">
              <p style="margin: 0 0 20px 0; font-size: 19px; color: #1e3a8a; font-weight: 600;">Hi ${escapeHtml(firstName)},</p>
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Thank you for subscribing to <strong>Chapter Hub</strong>. This email confirms your plan with Cloudigan IT Solutions.</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #64748b;">You will also receive a payment receipt from Stripe — please keep that for your records.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Plan:</strong> ${escapeHtml(productName)}</p>
                    ${companyLine}
                    <p style="margin: 0; font-size: 16px; color: #059669; font-weight: bold;"><strong>Amount:</strong> ${currency} $${amount}</p>
                  </td>
                </tr>
              </table>
              <h2 style="margin: 28px 0 12px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 8px;">What happens next</h2>
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you have not already completed onboarding, a member of our team will reach out within <strong>one business day</strong> to help you access your chapter workspace and answer any questions about your plan.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(appUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px;">Open Chapter Hub</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">For help with your account, please email <a href="mailto:${escapeHtml(supportEmail)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(supportEmail)}</a>. ${escapeHtml(NO_REPLY_NOTE)}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-left: 5px solid #0ea5e9; border-radius: 0 6px 6px 0; padding: 18px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0c4a6e;">Chapter Hub is a <strong>chapter management platform</strong>. This is not an RMM or Home Protect subscription — no agent download or Datto setup is required.</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0 0; font-size: 15px; color: #2c3e50;">Thanks for choosing Chapter Hub.</p>
              <p style="margin: 8px 0 0 0; font-size: 17px; font-weight: 700; color: #1e3a8a;">– The Cloudigan Team</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;">&copy; ${year} Cloudigan IT Solutions. All rights reserved.</p>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1;">This email was sent to ${escapeHtml(data.customerEmail)}</p>
              <p style="margin: 0; font-size: 13px;"><a href="https://www.cloudigan.com" style="color: #60a5fa; text-decoration: none;">www.cloudigan.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Hi ${firstName},

Thank you for subscribing to Chapter Hub. This email confirms your plan with Cloudigan IT Solutions.

You will also receive a payment receipt from Stripe — please keep that for your records.

PLAN SUMMARY
Plan: ${productName}
${data.companyName ? `Organization: ${data.companyName}\n` : ''}Amount: ${currency} $${amount}

WHAT HAPPENS NEXT
If you have not already completed onboarding, a member of our team will reach out within one business day to help you access your chapter workspace.

Open Chapter Hub: ${appUrl}

For help with your account, email ${supportEmail}. ${NO_REPLY_NOTE}

Chapter Hub is a chapter management platform — not an RMM or Home Protect subscription. No agent download is required.

Thanks for choosing Chapter Hub.
– The Cloudigan Team

---
www.cloudigan.com
`;

  return { subject, htmlContent, textContent };
}

module.exports = {
  buildChapterHubConfirmationEmail,
};
