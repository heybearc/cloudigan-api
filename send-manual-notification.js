#!/usr/bin/env node
/**
 * Send manual purchase notification for Wendy Ellis transaction
 */

require('dotenv').config();
const { sendPurchaseNotification } = require('./m365-email');

// Wendy Ellis purchase data from Stripe (3/27/2026 6:23 PM)
// Product: Complete Package (Business)
const purchaseData = {
  customerEmail: 'wendy@nildoctor.com',
  customerName: 'Wendy Ellis',
  companyName: 'Wendy Ellis', // Business customer
  isBusinessProduct: true,
  deviceQuantity: 1,
  siteUid: '18683ccb-2b46-4eab-a223-1ab1ff70b13b',
  sessionId: 'cs_live_a1G0vvu2yQ79DJ300udpgVFg7nDr9kCV7wol1NrR6uOnmvYmi0AyVlS4z4',
  amountTotal: 6250, // $62.50 in cents (Complete Package price)
  currency: 'usd'
};

console.log('Sending purchase notification for Wendy Ellis...');

sendPurchaseNotification(purchaseData)
  .then(() => {
    console.log('✅ Purchase notification sent successfully to:', process.env.ALERT_EMAIL);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to send notification:', err.message);
    process.exit(1);
  });
