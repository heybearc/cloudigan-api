#!/usr/bin/env node
/**
 * Send support-hour email pair: customer confirmation + admin notification.
 * Run on STANDBY (or anywhere with M365 .env): node scripts/test-support-hour-emails.js [block|hourly|both]
 */

require('dotenv').config();
const { sendServiceConfirmationEmail, sendPurchaseNotification } = require('../m365-email');
const { classifyProduct, buildAdminActionSummary } = require('../lib/product-profiles');

const TO = process.env.TEST_EMAIL_TO || 'cory@cloudigan.com';

const samples = {
  block: {
    productName: 'Technical Support - Block of Hours',
    customerName: 'Cory Allen',
    customerEmail: TO,
    deviceQuantity: 1,
    amountTotal: 50000,
    currency: 'usd',
    sessionId: 'cs_test_block_of_hours_preview',
  },
  hourly: {
    productName: 'Technical Support - Hourly',
    customerName: 'Cory Allen',
    customerEmail: TO,
    companyName: 'Cloudigan IT Solutions',
    deviceQuantity: 2,
    amountTotal: 30000,
    currency: 'usd',
    sessionId: 'cs_test_hourly_preview',
  },
};

async function sendPair(label, sample) {
  const profileId = classifyProduct(sample.productName);
  console.log(`\n--- ${label} (profile: ${profileId}) ---`);

  console.log('  Customer confirmation →', sample.customerEmail);
  await sendServiceConfirmationEmail(sample);

  const actions = buildAdminActionSummary(profileId, {
    serviceConfirmationSent: true,
  });
  const adminTo = process.env.ALERT_EMAIL || TO;
  console.log('  Admin notification →', adminTo);
  await sendPurchaseNotification({
    profileId,
    ...sample,
    actions,
    serverLabel: process.env.NOTIFICATION_SERVER_LABEL || 'cloudigan-api-green (STANDBY test)',
  });
}

async function main() {
  const mode = process.argv[2] || 'both';
  const keys = mode === 'both' ? ['block', 'hourly'] : [mode];
  if (!keys.every((k) => samples[k])) {
    console.error('Usage: node scripts/test-support-hour-emails.js [block|hourly|both]');
    process.exit(1);
  }

  console.log('Support-hour email test (NOT a real Stripe purchase)');
  for (const key of keys) {
    await sendPair(key, samples[key]);
    if (keys.length > 1) await new Promise((r) => setTimeout(r, 2000));
  }
  console.log('\nDone. Check inbox:', TO);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
