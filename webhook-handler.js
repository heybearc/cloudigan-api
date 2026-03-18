/**
 * Stripe to Datto RMM Integration Webhook Handler
 * 
 * This webhook receives Stripe checkout.session.completed events,
 * creates a site in Datto RMM, and returns the agent download link.
 */

require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const app = express();

// Datto RMM API Configuration
const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL, // e.g., https://merlot-api.centrastage.net
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

// Datto RMM API Integration - JWT-based authentication
const dattoAuth = require('./datto-auth-jwt');

/**
 * Create a new site in Datto RMM
 */
async function createDattoSite(customerName, customerEmail) {
  try {
    const siteData = await dattoAuth.makeAuthenticatedRequest('/api/v2/site', {
      method: 'PUT',
      body: JSON.stringify({
        name: customerName,
        description: `Customer: ${customerEmail}`,
        notes: `Created via Stripe integration on ${new Date().toISOString()}`,
      }),
    });

    console.log('Datto site created:', siteData);
    return siteData;
  } catch (error) {
    console.error('Failed to create Datto site:', error.message);
    throw error;
  }
}

/**
 * Get agent download link for a site
 * Returns the portal URL where customers can download the agent
 */
async function getAgentDownloadLink(siteUid) {
  try {
    const siteData = await dattoAuth.makeAuthenticatedRequest(`/api/v2/site/${siteUid}`);
    
    if (siteData.portalUrl) {
      return siteData.portalUrl;
    }
    
    // Fallback: construct portal URL
    const platform = DATTO_CONFIG.apiUrl.match(/https:\/\/(\w+)-api/)[1];
    return `https://${platform}.rmm.datto.com/site/${siteData.id}`;
  } catch (error) {
    console.error('Failed to get agent download link:', error.message);
    throw error;
  }
}

/**
 * Stripe Webhook Handler
 */
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Extract customer data from Stripe session
      const customerData = {
        email: session.customer_details.email,
        companyName: session.customer_details.name || session.metadata?.company_name,
        subscriptionId: session.subscription,
        customerId: session.customer,
        productId: session.metadata?.product_id,
      };

      console.log('Processing subscription for:', customerData.email);

      // Create site in Datto RMM
      const dattoSite = await createDattoSite(customerData);
      console.log('Created Datto site:', dattoSite.uid);

      // Get agent download link
      const downloadLink = await getAgentDownloadLink(dattoSite.uid);
      console.log('Agent download link:', downloadLink);

      // Store the download link in Stripe metadata for later retrieval
      await stripe.customers.update(session.customer, {
        metadata: {
          datto_site_uid: dattoSite.uid,
          datto_agent_download: downloadLink,
        },
      });

      // TODO: Send email to customer with download link
      // TODO: Update your database with the Datto site info

      res.json({ received: true, dattoSiteUid: dattoSite.uid });
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to Stripe to avoid retries
      res.status(200).json({ received: true, error: error.message });
    }
  } else {
    res.json({ received: true });
  }
});

/**
 * Endpoint to retrieve agent download link for confirmation page
 */
app.get('/api/agent-download/:customerId', async (req, res) => {
  try {
    const customer = await stripe.customers.retrieve(req.params.customerId);
    
    if (!customer.metadata.datto_agent_download) {
      return res.status(404).json({ error: 'Download link not found' });
    }

    res.json({
      downloadUrl: customer.metadata.datto_agent_download,
      siteUid: customer.metadata.datto_site_uid,
    });
  } catch (error) {
    console.error('Error retrieving download link:', error);
    res.status(500).json({ error: 'Failed to retrieve download link' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Stripe to Datto RMM Integration',
    status: 'running',
    endpoints: {
      webhook: '/webhook/stripe',
      agentLink: '/api/agent-link/:sessionId',
      health: '/health'
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
