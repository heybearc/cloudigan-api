#!/usr/bin/env node
/**
 * Preview service confirmation emails (writes HTML to tmp/).
 * Usage: node scripts/preview-service-confirmation-email.js [block|hourly]
 */

const fs = require('fs');
const path = require('path');
const { buildServiceConfirmationEmail } = require('../lib/service-confirmation-email');

const mode = process.argv[2] || 'block';

const samples = {
  block: {
    customerName: 'Howard Hanna',
    customerEmail: 'customer@example.com',
    productName: 'Technical Support - Block of Hours',
    deviceQuantity: 1,
    amountTotal: 50000,
    currency: 'usd',
  },
  hourly: {
    customerName: 'Alex Rivera',
    customerEmail: 'customer@example.com',
    productName: 'Technical Support - Hourly',
    deviceQuantity: 4,
    amountTotal: 60000,
    currency: 'usd',
    companyName: 'Rivera Design LLC',
  },
};

const sample = samples[mode] || samples.block;
const email = buildServiceConfirmationEmail(sample);
const outDir = path.join(__dirname, '../tmp');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `service-confirmation-${mode}.html`);
fs.writeFileSync(outFile, email.htmlContent);

console.log(`Subject: ${email.subject}`);
console.log(`HTML: ${outFile}`);
console.log('\n--- TEXT ---\n');
console.log(email.textContent);
