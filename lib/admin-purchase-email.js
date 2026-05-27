/**
 * Admin purchase notification HTML/text builders (profile-driven).
 */

const { getProfile } = require('./product-profiles');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  return String(html).replace(/<[^>]+>/g, '').trim();
}

function rowBg(index) {
  return index % 2 === 0 ? '#f9fafb' : '#ffffff';
}

function buildDetailRows(data, profile) {
  const rows = [];
  let i = 0;

  const add = (label, valueHtml) => {
    rows.push({ label, valueHtml, bg: rowBg(i++) });
  };

  const productLine = profile.formatProductLine(data.productName, data.deviceQuantity);

  for (const field of profile.adminFields) {
    switch (field) {
      case 'product':
        add('Product', escapeHtml(productLine));
        break;
      case 'customer':
        add('Customer', escapeHtml(data.customerName));
        break;
      case 'company':
        if (data.companyName) add('Company', escapeHtml(data.companyName));
        break;
      case 'email':
        add(
          'Email',
          `<a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a>`
        );
        break;
      case 'devices':
      case 'quantity':
        add(profile.quantityLabel, escapeHtml(String(data.deviceQuantity ?? 1)));
        break;
      case 'amount': {
        const amount = ((data.amountTotal || 0) / 100).toFixed(2);
        const currency = (data.currency || 'usd').toUpperCase();
        add(
          'Amount',
          `<span style="color: #059669; font-weight: bold; font-size: 18px;">${currency} $${amount}</span>`
        );
        break;
      }
      case 'dattoSiteUid':
        if (data.siteUid) {
          add(
            'Datto site UID',
            `<span style="font-family: monospace; font-size: 12px;">${escapeHtml(data.siteUid)}</span>`
          );
        }
        break;
      case 'stripeSession':
        add(
          'Stripe session',
          `<span style="font-family: monospace; font-size: 12px;">${escapeHtml(data.sessionId)}</span>`
        );
        break;
      default:
        break;
    }
  }

  return rows;
}

function buildActionsBlock(profile, actions, profileId) {
  if (!actions.length) return '';

  const bullets = actions.map((a) => `• ${escapeHtml(a.label)}`).join('<br>');

  const notApplicable = profile.notApplicableNote
    ? `<p style="margin: 12px 0 0 0; color: #4b5563; font-size: 13px;">${escapeHtml(profile.notApplicableNote)}</p>`
    : '';

  return `
              <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  ✅ <strong>${escapeHtml(profile.actionsSectionTitle)}:</strong><br>
                  ${bullets}
                </p>${notApplicable}
              </div>`;
}

function buildAdminPurchaseEmail(data) {
  const profile = getProfile(data.profileId);
  const productName = data.productName || (data.isBusinessProduct ? 'Business Protect' : 'Home Protect');
  const subject = `🎉 New purchase (${profile.categoryLabel}): ${productName} — ${data.customerName}`;
  const rows = buildDetailRows({ ...data, productName }, profile);
  const actionsBlock = buildActionsBlock(profile, data.actions || [], data.profileId);
  const serverLabel = data.serverLabel || process.env.NOTIFICATION_SERVER_LABEL || 'cloudigan-api';

  const rowsHtml = rows
    .map(
      (r) => `
                <tr>
                  <td style="padding: 8px; background-color: ${r.bg}; border-bottom: 1px solid #e5e7eb;"><strong>${escapeHtml(r.label)}:</strong></td>
                  <td style="padding: 8px; background-color: ${r.bg}; border-bottom: 1px solid #e5e7eb;">${r.valueHtml}</td>
                </tr>`
    )
    .join('');

  const textRows = rows.map((r) => `${r.label}: ${stripHtml(r.valueHtml)}`).join('\n');
  const textActions = (data.actions || []).map((a) => `• ${a.label}`).join('\n');

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
        <table cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);">
              <h1 style="margin: 0; color: white; font-size: 24px;">🎉 New purchase</h1>
              <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 13px;">${escapeHtml(profile.categoryLabel)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #ffffff;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Purchase details</h2>
              <table width="100%" cellpadding="8" cellspacing="0" border="0" style="margin-bottom: 20px;">
                ${rowsHtml}
              </table>
              ${actionsBlock}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Cloudigan API — automated purchase notification<br>
                ${escapeHtml(serverLabel)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `🎉 NEW PURCHASE NOTIFICATION (${profile.categoryLabel})

${textRows}

${textActions ? `✅ ${profile.actionsSectionTitle.toUpperCase()}:\n${textActions}` : ''}${profile.notApplicableNote ? `\n\n${profile.notApplicableNote}` : ''}

---
Cloudigan API — ${serverLabel}
`;

  return { subject, htmlContent, textContent };
}

module.exports = {
  buildAdminPurchaseEmail,
  buildDetailRows,
};
