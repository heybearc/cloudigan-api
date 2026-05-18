#!/usr/bin/env node
/**
 * Preview admin purchase emails (stdout HTML path hint + text body).
 * Usage: node scripts/preview-admin-purchase-email.js [rmm|service]
 */

const fs = require('fs');
const path = require('path');
const { classifyProduct, buildAdminActionSummary } = require('../lib/product-profiles');
const { buildAdminPurchaseEmail } = require('../lib/admin-purchase-email');

const mode = process.argv[2] || 'service';

const samples = {
  service: {
    productName: 'Technical Support - Block of Hours',
    customerName: 'Howard Hanna',
    customerEmail: 'ddebacco@mac.com',
    deviceQuantity: 1,
    amountTotal: 50000,
    currency: 'usd',
    sessionId: 'cs_live_example',
  },
  rmm: {
    productName: 'Home Protect',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    deviceQuantity: 3,
    amountTotal: 2997,
    currency: 'usd',
    sessionId: 'cs_live_rmm_example',
    siteUid: 'abc-123-datto-uid',
  },
};

const sample = samples[mode] || samples.service;
const profileId = classifyProduct(sample.productName);
const results =
  profileId === 'rmm'
    ? {
        dattoSiteCreated: true,
        downloadLinksGenerated: true,
        welcomeEmailSent: true,
        wixCmsCreated: true,
      }
    : {
        serviceConfirmationSent: true,
      };

const actions = buildAdminActionSummary(profileId, results);
const email = buildAdminPurchaseEmail({ ...sample, profileId, actions });

const outDir = path.join(__dirname, '../tmp');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `admin-purchase-${profileId}.html`);
fs.writeFileSync(outFile, email.htmlContent);

console.log(`Profile: ${profileId}`);
console.log(`Subject: ${email.subject}`);
console.log(`HTML written: ${outFile}`);
console.log('\n--- TEXT ---\n');
console.log(email.textContent);
