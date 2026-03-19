#!/usr/bin/env node
/**
 * Test script to manually trigger Wix CMS write with Stripe session data
 * Usage: node test-wix-write.js <stripe_session_id>
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { insertCustomerDownload } = require('./wix-mcp-integration');

const sessionId = process.argv[2] || 'cs_test_a1BkTHzXRwu8hGA1dU2BwYvFwoarZzCq9OZKM22tUZ0';

async function testWixWrite() {
  try {
    console.log('Fetching Stripe session:', sessionId);
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    });
    
    console.log('Session retrieved:');
    console.log('- Customer:', session.customer_details.name);
    console.log('- Email:', session.customer_details.email);
    console.log('- Status:', session.status);
    
    // Create mock data for Wix CMS write
    const testData = {
      sessionId: session.id,
      siteUid: 'test-site-uid-' + Date.now(),
      customerEmail: session.customer_details.email,
      customerName: session.customer_details.name,
      companyName: '',
      isBusinessProduct: false,
      downloadLinks: {
        windows: 'https://test.com/windows',
        mac: 'https://test.com/mac',
        linux: 'https://test.com/linux'
      }
    };
    
    console.log('\nAttempting Wix CMS write...');
    const result = await insertCustomerDownload(testData);
    
    console.log('\n✅ SUCCESS! Wix CMS record created:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testWixWrite();
