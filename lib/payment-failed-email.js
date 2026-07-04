/**
 * Customer email when a subscription invoice payment fails (non–Chapter Hub products).
 */

const { getProfile } = require('./product-profiles');
const {
  SUPPORT_EMAIL,
  NO_REPLY_NOTE,
  STRIPE_CUSTOMER_PORTAL_URL,
} = require('./email-constants');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPaymentFailedEmail(data) {
  const firstName = (data.customerName || 'there').split(' ')[0];
  const productName = data.productName || 'your Cloudigan subscription';
  const profile = getProfile(data.profileId);
  const supportEmail = data.supportEmail || SUPPORT_EMAIL;
  const year = new Date().getFullYear();

  const billingTarget = data.companyName
    ? `<strong>${escapeHtml(data.companyName)}</strong> (${escapeHtml(productName)})`
    : `<strong>${escapeHtml(productName)}</strong>`;

  const subject = data.companyName
    ? `Action needed: payment failed — ${data.companyName}`
    : `Action needed: payment failed — ${productName}`;

  const categoryNote =
    data.profileId === 'service'
      ? 'your professional services subscription'
      : profile.categoryLabel.toLowerCase();

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
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">We could not process the latest payment for ${billingTarget}.</p>
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">This affects ${escapeHtml(categoryNote)}. Please update your payment method in the Cloudigan customer portal to avoid interruption.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="padding: 25px; background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px;">
                    <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; color: #1e3a8a;">Update payment method</p>
                    <a href="${escapeHtml(STRIPE_CUSTOMER_PORTAL_URL)}" style="display: inline-block; padding: 14px 32px; background-color: #c8102e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 15px;">Manage billing</a>
                  </td>
                </tr>
              </table>
              ${data.invoiceUrl ? `<p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;"><a href="${escapeHtml(data.invoiceUrl)}">View invoice</a></p>` : ''}
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you already fixed this, you can ignore this message.</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Questions? <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>. ${NO_REPLY_NOTE}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #cbd5e1;">&copy; ${year} Cloudigan IT Solutions. All rights reserved.</p>
              <p style="margin: 0; font-size: 13px; color: #cbd5e1;">This email was sent to ${escapeHtml(data.customerEmail)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Hi ${firstName},

We could not process the latest payment for ${data.companyName ? `${data.companyName} (${productName})` : productName}.

Please update your payment method in the Cloudigan customer portal:
${STRIPE_CUSTOMER_PORTAL_URL}
${data.invoiceUrl ? `\nView invoice: ${data.invoiceUrl}\n` : ''}
If you already fixed this, you can ignore this message.

Questions? ${supportEmail}
${NO_REPLY_NOTE}`;

  return { subject, htmlContent, textContent };
}

module.exports = {
  buildPaymentFailedEmail,
};
