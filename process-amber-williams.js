#!/usr/bin/env node
/**
 * Manually process Amber Williams' failed purchase
 */

require('dotenv').config();
const { makeAuthenticatedRequest } = require('./datto-auth');
const { generateDownloadLinks } = require('./download-links');
const { insertCustomerDownload } = require('./wix-mcp-integration');
const { sendWelcomeEmail } = require('./m365-email');

const customerData = {
  email: 'amberwillms@gmail.com',
  name: 'Amber M Williams',
  sessionId: 'cs_live_a1o01plUIw1sQJsfGjXuyWvJLzcFWRiu07Nx6PJBHEmdi2P6cYOHtpRmOx',
  isBusinessProduct: false,
  deviceQuantity: 1
};

console.log('Processing Amber Williams purchase...\n');

// Step 1: Create Datto site
console.log('1. Creating Datto RMM site...');

makeAuthenticatedRequest('/api/v2/site', {
  method: 'PUT',
  body: JSON.stringify({
    name: customerData.name,
    description: `Customer: ${customerData.email}`,
    notes: `Created via Stripe integration on ${new Date().toISOString()}\nPersonal Product\nManually processed due to token expiration`
  })
})
.then(dattoSite => {
  console.log('✅ Datto site created:', dattoSite.uid);
  
  // Step 2: Generate download links
  console.log('\n2. Generating download links...');
  const downloadLinks = generateDownloadLinks(dattoSite.id, dattoSite.uid);
  console.log('✅ Download links generated');
  
  // Step 3: Insert into Wix CMS
  console.log('\n3. Inserting into Wix CMS...');
  return insertCustomerDownload({
    sessionId: customerData.sessionId,
    siteUid: dattoSite.uid,
    customerEmail: customerData.email,
    customerName: customerData.name,
    companyName: '',
    businessLocation: '',
    isBusinessProduct: false,
    downloadLinks
  }).then(() => {
    console.log('✅ Wix CMS record created');
    return { dattoSite, downloadLinks };
  });
})
.then(({ dattoSite, downloadLinks }) => {
  // Step 4: Send welcome email
  console.log('\n4. Sending welcome email...');
  return sendWelcomeEmail({
    customerEmail: customerData.email,
    customerName: customerData.name,
    companyName: '',
    isBusinessProduct: false,
    downloadLinks,
    siteUid: dattoSite.uid,
    deviceQuantity: 1
  }).then(() => {
    console.log('✅ Welcome email sent');
    return dattoSite;
  });
})
.then(dattoSite => {
  console.log('\n✅ SUCCESS! Amber Williams processed successfully');
  console.log('\nDatto Site UID:', dattoSite.uid);
  console.log('Customer Email:', customerData.email);
  console.log('Download links sent via email');
})
.catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
