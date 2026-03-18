/**
 * Test script to send sample emails from STANDBY
 * Tests both business and home protect email templates
 */

require('dotenv').config();
const { sendWelcomeEmail } = require('./m365-email');

// Test data for business customer
const businessTestData = {
  customerEmail: 'cory@cloudigan.com',
  customerName: 'John Smith',
  companyName: 'Acme Corporation',
  isBusinessProduct: true,
  siteUid: 'TEST-SITE-12345',
  downloadLinks: {
    windows: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-12345/windows',
    mac: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-12345/mac',
    linux: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-12345/linux'
  }
};

// Test data for home protect customer
const homeProtectTestData = {
  customerEmail: 'cory@cloudigan.com',
  customerName: 'Jane Doe',
  companyName: null,
  isBusinessProduct: false,
  siteUid: 'TEST-SITE-67890',
  downloadLinks: {
    windows: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-67890/windows',
    mac: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-67890/mac',
    linux: 'https://vidal-api.centrastage.net/csm/download/agent/TEST-SITE-67890/linux'
  }
};

async function runTests() {
  console.log('🧪 Testing Email Templates on STANDBY\n');
  
  try {
    // Test business email
    console.log('📧 Sending Business Email Test...');
    console.log('   To:', businessTestData.customerEmail);
    console.log('   Customer:', businessTestData.customerName);
    console.log('   Company:', businessTestData.companyName);
    await sendWelcomeEmail(businessTestData);
    console.log('✅ Business email sent successfully\n');
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test home protect email
    console.log('📧 Sending Home Protect Email Test...');
    console.log('   To:', homeProtectTestData.customerEmail);
    console.log('   Customer:', homeProtectTestData.customerName);
    console.log('   Product Type: Home Protect');
    await sendWelcomeEmail(homeProtectTestData);
    console.log('✅ Home Protect email sent successfully\n');
    
    console.log('✅ All test emails sent successfully!');
    console.log('📬 Check cory@cloudigan.com inbox for both emails');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
