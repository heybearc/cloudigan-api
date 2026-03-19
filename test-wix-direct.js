#!/usr/bin/env node
/**
 * Direct test of Wix CMS write with mock data
 */

require('dotenv').config();
const { insertCustomerDownload } = require('./wix-mcp-integration');

const testData = {
  sessionId: 'test_session_' + Date.now(),
  siteUid: 'test-site-uid-' + Date.now(),
  customerEmail: 'test@cloudigan.com',
  customerName: 'Test User',
  companyName: 'Test Company',
  isBusinessProduct: false,
  downloadLinks: {
    windows: 'https://test.com/windows',
    mac: 'https://test.com/mac',
    linux: 'https://test.com/linux'
  }
};

console.log('Testing Wix CMS write with mock data...');
console.log('Data:', JSON.stringify(testData, null, 2));

insertCustomerDownload(testData)
  .then(result => {
    console.log('\n✅ SUCCESS! Wix CMS record created:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  });
