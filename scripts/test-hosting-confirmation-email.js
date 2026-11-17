#!/usr/bin/env node
/**
 * Preview/send hosting purchase confirmation (catalog-driven).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { resolveProduct, buildAdminActionSummary } = require('../lib/product-profiles');
const { buildServiceConfirmationEmail } = require('../lib/service-confirmation-email');
const { sendServiceConfirmationEmail, sendPurchaseNotification } = require('../m365-email');

const TO = process.env.TEST_EMAIL_TO || 'cory@cloudigan.com';
const SEND = process.argv.includes('--send');

const resolved = resolveProduct(
  'Windows Server Hosting - Internal',
  'prod_VBivzzY2t1mYuR',
  'Internal Windows Server hosting service providing secure, managed Windows-based infrastructure for approved business applications, services, and workloads.',
);

const sample = {
  profileId: resolved.profileId,
  productName: resolved.productName,
  productDescription: resolved.productDescription,
  nextSteps: resolved.nextSteps,
  customerName: 'Renvis LLC',
  customerEmail: TO,
  companyName: 'Renvis LLC',
  deviceQuantity: 1,
  amountTotal: 0,
  currency: 'usd',
  sessionId: 'cs_test_hosting_preview',
};

async function main() {
  console.log('Resolved:', {
    profileId: resolved.profileId,
    productName: resolved.productName,
  });

  const { subject, htmlContent } = buildServiceConfirmationEmail(sample);
  console.log('Subject:', subject);

  const out = path.join(__dirname, '..', 'tmp', 'hosting-confirmation.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, htmlContent);
  console.log('Preview written:', out);

  if (!SEND) {
    console.log('Pass --send to deliver via M365');
    return;
  }

  await sendServiceConfirmationEmail(sample);
  console.log('Customer confirmation →', TO);

  const actions = buildAdminActionSummary(resolved.profileId, {
    serviceConfirmationSent: true,
  });
  await sendPurchaseNotification({
    profileId: resolved.profileId,
    ...sample,
    actions,
    serverLabel: 'cloudigan-api (hosting preview)',
  });
  console.log('Admin notification →', process.env.ALERT_EMAIL || TO);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
