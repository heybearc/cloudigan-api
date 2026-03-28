#!/usr/bin/env node
/**
 * Retrieve Stripe session details for Wendy Ellis purchase
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const sessionId = 'cs_live_a1G0vvu2yQ79DJ300udpgVFg7nDr9kCV7wol1NrR6uOnmvYmi0AyVlS4z4';

stripe.checkout.sessions.retrieve(sessionId, {
  expand: ['line_items', 'line_items.data.price.product']
})
.then(session => {
  console.log('\n=== STRIPE SESSION DETAILS ===\n');
  console.log('Session ID:', session.id);
  console.log('Customer Email:', session.customer_details.email);
  console.log('Customer Name:', session.customer_details.name);
  console.log('Amount Total:', session.amount_total, session.currency.toUpperCase());
  console.log('\nLine Items:');
  session.line_items.data.forEach((item, i) => {
    console.log(`  ${i + 1}. Product: ${item.price.product.name}`);
    console.log(`     Product ID: ${item.price.product.id}`);
    console.log(`     Quantity: ${item.quantity}`);
    console.log(`     Amount: ${item.amount_total} ${session.currency}`);
  });
  console.log('\nMetadata:', JSON.stringify(session.metadata, null, 2));
  console.log('\n=== RAW JSON ===\n');
  console.log(JSON.stringify({
    sessionId: session.id,
    customerEmail: session.customer_details.email,
    customerName: session.customer_details.name,
    amountTotal: session.amount_total,
    currency: session.currency,
    lineItems: session.line_items.data.map(item => ({
      productName: item.price.product.name,
      productId: item.price.product.id,
      priceId: item.price.id,
      quantity: item.quantity,
      amount: item.amount_total
    })),
    metadata: session.metadata
  }, null, 2));
})
.catch(err => {
  console.error('Error retrieving session:', err.message);
  process.exit(1);
});
