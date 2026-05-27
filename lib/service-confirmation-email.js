/**
 * Customer confirmation email for professional services / support hour purchases.
 */

const { formatServiceQuantity } = require('./product-profiles');
const { SUPPORT_EMAIL, NO_REPLY_NOTE } = require('./email-constants');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildServiceConfirmationEmail(data) {
  const firstName = (data.customerName || 'there').split(' ')[0];
  const productName = data.productName || 'Technical support';
  const quantityText = formatServiceQuantity(productName, data.deviceQuantity);
  const amount = ((data.amountTotal || 0) / 100).toFixed(2);
  const currency = (data.currency || 'usd').toUpperCase();
  const supportEmail = data.supportEmail || SUPPORT_EMAIL;
  const year = new Date().getFullYear();

  const subject = `Your Cloudigan purchase is confirmed — ${productName}`;

  const companyLine = data.companyName
    ? `<p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Company: <strong>${escapeHtml(data.companyName)}</strong></p>`
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
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">Thank you for your purchase. This email confirms your order with Cloudigan IT Solutions.</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #64748b;">You will also receive a payment receipt from Stripe — please keep that for your records.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Product:</strong> ${escapeHtml(productName)}</p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Quantity:</strong> ${escapeHtml(quantityText)}</p>
                    <p style="margin: 0; font-size: 16px; color: #059669; font-weight: bold;"><strong>Total paid:</strong> ${currency} $${amount}</p>
                  </td>
                </tr>
              </table>
              ${companyLine}
              <h2 style="margin: 28px 0 12px 0; font-size: 20px; color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 8px;">What happens next</h2>
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you have not already coordinated your support hours with our team, a member of our team will reach out within <strong>one business day</strong> to coordinate your support time and answer any questions about how to use your hours.</p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #2c3e50;">If you need to share context before we connect, please email our help desk at <a href="mailto:${escapeHtml(supportEmail)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(supportEmail)}</a>. ${escapeHtml(NO_REPLY_NOTE)}</p>
              <p style="margin: 30px 0 0 0; font-size: 15px; color: #2c3e50;">Thanks for choosing Cloudigan.</p>
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

Thank you for your purchase. This email confirms your order with Cloudigan IT Solutions.

You will also receive a payment receipt from Stripe — please keep that for your records.

ORDER SUMMARY
Product: ${productName}
Quantity: ${quantityText}
Total paid: ${currency} $${amount}
${data.companyName ? `Company: ${data.companyName}\n` : ''}
WHAT HAPPENS NEXT
If you have not already coordinated your support hours with our team, a member of our team will reach out within one business day to coordinate your support time and answer any questions about how to use your hours.

If you need to share context before we connect, please email our help desk at ${supportEmail}. ${NO_REPLY_NOTE}

Thanks for choosing Cloudigan.
– The Cloudigan Team

---
www.cloudigan.com
`;

  return { subject, htmlContent, textContent };
}

module.exports = {
  buildServiceConfirmationEmail,
};
