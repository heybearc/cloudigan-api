#!/usr/bin/env node
/**
 * Send Chapter Hub test emails (customer + admin). Run on container with M365 .env.
 */

require('dotenv').config();
const { sendChapterHubConfirmationEmail, sendPurchaseNotification } = require('../m365-email');
const { classifyProduct, buildAdminActionSummary } = require('../lib/product-profiles');

const TO = process.env.TEST_EMAIL_TO || 'cory@cloudigan.com';

const sample = {
  productName: 'Chapter Hub - Medium Chapter',
  customerName: 'Cory Allen',
  customerEmail: TO,
  companyName: 'Cloudigan IT Solutions',
  amountTotal: 0,
  currency: 'usd',
  sessionId: 'cs_test_chapter_hub_preview',
};

async function main() {
  const profileId = classifyProduct(sample.productName);
  console.log('Profile:', profileId);

  await sendChapterHubConfirmationEmail(sample);
  console.log('Customer confirmation →', TO);

  const actions = buildAdminActionSummary(profileId, { chapterHubConfirmationSent: true });
  await sendPurchaseNotification({
    profileId,
    ...sample,
    actions,
    serverLabel: 'cloudigan-api (Chapter Hub test)',
  });
  console.log('Admin notification →', process.env.ALERT_EMAIL || TO);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
