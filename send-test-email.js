#!/usr/bin/env node
/**
 * Send test welcome email to see Customer Portal button
 */

require('dotenv').config();
const { sendWelcomeEmail } = require('./m365-email');

// Test data for Home Protect
const testData = {
  customerEmail: process.env.ALERT_EMAIL || 'cory@cloudigan.com',
  customerName: 'Test Customer',
  companyName: '',
  isBusinessProduct: false,
  downloadLinks: {
    windows: 'https://vidal.rmm.datto.com/download-agent/windows/test-uid',
    mac: 'https://vidal.rmm.datto.com/download-agent/mac/test-uid',
    linux: 'https://vidal.rmm.datto.com/download-agent/linux/test-uid'
  },
  siteUid: 'test-site-uid',
  deviceQuantity: 1
};

console.log('Sending test email to:', testData.customerEmail);
console.log('Email type: Home Protect with Customer Portal button\n');

sendWelcomeEmail(testData)
  .then(() => {
    console.log('✅ Test email sent successfully!');
    console.log('\nCheck your inbox at:', testData.customerEmail);
    console.log('\nThe email includes:');
    console.log('- Download links for Windows, Mac, Linux');
    console.log('- Customer Portal button (green button)');
    console.log('- Link: https://pay.cloudigan.com/p/login/eVq4gz6nrgSW1Kh6e9gnK00');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to send test email:', err.message);
    process.exit(1);
  });
