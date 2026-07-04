#!/usr/bin/env node
/**
 * Preview/send payment-failed email for Cloudigan subscription products.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { buildPaymentFailedEmail } = require('../lib/payment-failed-email');
const { sendPaymentFailedEmail } = require('../m365-email');

const TO = process.env.TEST_EMAIL_TO || 'cory@cloudigan.com';
const SEND = process.argv.includes('--send');

const sample = {
  profileId: 'rmm',
  productName: 'Complete Package',
  customerName: 'Wendy Ellis',
  customerEmail: TO,
  companyName: 'Wendy Ellis',
  invoiceUrl: 'https://invoice.stripe.com/i/example',
};

async function main() {
  const { subject, htmlContent } = buildPaymentFailedEmail(sample);
  console.log('Subject:', subject);

  const out = path.join(__dirname, '..', 'tmp', 'payment-failed-complete-package.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, htmlContent);
  console.log('Preview written:', out);

  if (SEND) {
    await sendPaymentFailedEmail(sample);
    console.log('Sent →', TO);
  } else {
    console.log('Pass --send to deliver via M365');
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
