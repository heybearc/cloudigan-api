#!/usr/bin/env node
/**
 * Find Amber Williams' Stripe session
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const customerId = 'cus_UDjBQ5zYVlHDft'; // Amber M Williams

console.log('Searching for Amber Williams sessions...\n');

stripe.checkout.sessions.list({
  customer: customerId,
  limit: 10
})
.then(sessions => {
  if (sessions.data.length === 0) {
    console.log('No sessions found for this customer');
    return;
  }
  
  const sessionId = sessions.data[0].id;
  
  // Retrieve full session with line items
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'line_items.data.price.product']
  });
})
.then(session => {
  if (!session) return;
  
  console.log('=== STRIPE SESSION DETAILS ===\n');
  console.log('Session ID:', session.id);
  console.log('Customer Email:', session.customer_details.email);
  console.log('Customer Name:', session.customer_details.name);
  console.log('Amount Total:', session.amount_total, session.currency.toUpperCase());
  console.log('Status:', session.status);
  console.log('Payment Status:', session.payment_status);
  
  if (session.line_items && session.line_items.data.length > 0) {
    console.log('\nProduct:', session.line_items.data[0].price.product.name);
    console.log('Quantity:', session.line_items.data[0].quantity);
  }
  
  console.log('\n=== SESSION DATA ===\n');
  console.log(JSON.stringify({
    sessionId: session.id,
    customerEmail: session.customer_details.email,
    customerName: session.customer_details.name,
    amountTotal: session.amount_total,
    currency: session.currency,
    productName: session.line_items?.data?.[0]?.price?.product?.name,
    quantity: session.line_items?.data?.[0]?.quantity || 1
  }, null, 2));
})
.catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
