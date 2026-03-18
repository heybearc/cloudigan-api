/**
 * Enhanced Stripe to Datto RMM Integration Webhook Handler
 * With comprehensive error handling, logging, metrics, and retry logic
 */

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const os = require('os');

// Import enhanced modules
const { logger, correlationMiddleware, logError } = require('./lib/logger');
const { 
  metricsHandler, 
  recordWebhook, 
  recordDattoApi, 
  recordError,
  trackAsyncOperation 
} = require('./lib/metrics');
const { retryAsync, CircuitBreaker } = require('./lib/retry');
const { 
  WebhookValidationError, 
  DattoApiError, 
  StripeApiError,
  formatErrorResponse 
} = require('./lib/errors');
const { getAlerter } = require('./lib/alerting');

const dattoAuth = require('./datto-auth');
const { generateDownloadLinks } = require('./download-links');
const { insertCustomerDownload } = require('./wix-cms');
const { sendWelcomeEmail } = require('./m365-email');

const app = express();
const alerter = getAlerter();

// Circuit breaker for Datto API
const dattoCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000 // 1 minute
});

// Datto RMM API Configuration
const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

/**
 * Create a new site in Datto RMM with retry logic
 */
async function createDattoSite(customerData, requestLogger) {
  const startTime = Date.now();
  
  try {
    const result = await dattoCircuitBreaker.execute(
      async () => {
        return await retryAsync(
          async () => {
            return await dattoAuth.makeAuthenticatedRequest('/api/v2/site', {
              method: 'PUT',
              body: JSON.stringify({
                name: customerData.companyName || customerData.email,
                description: `Customer: ${customerData.email}`,
                notes: `Created via Stripe integration on ${new Date().toISOString()}`,
              }),
            });
          },
          {
            operationName: 'createDattoSite',
            logger: requestLogger,
            maxRetries: 3
          }
        );
      },
      {
        operationName: 'createDattoSite',
        logger: requestLogger
      }
    );
    
    const duration = (Date.now() - startTime) / 1000;
    recordDattoApi('create_site', 'success', duration);
    
    requestLogger.info('Datto site created successfully', {
      siteUid: result.uid,
      duration
    });
    
    return result;
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordDattoApi('create_site', 'error', duration);
    recordError('datto_api', 'create_site');
    
    logError(requestLogger, error, {
      operation: 'createDattoSite',
      customerEmail: customerData.email
    });
    
    throw new DattoApiError('Failed to create Datto site', {
      originalError: error.message,
      customerEmail: customerData.email
    });
  }
}

/**
 * Get agent download link for a site
 */
async function getAgentDownloadLink(siteUid, requestLogger) {
  const startTime = Date.now();
  
  try {
    const siteData = await retryAsync(
      async () => {
        return await dattoAuth.makeAuthenticatedRequest(`/api/v2/site/${siteUid}`);
      },
      {
        operationName: 'getAgentDownloadLink',
        logger: requestLogger,
        maxRetries: 2
      }
    );
    
    const duration = (Date.now() - startTime) / 1000;
    recordDattoApi('get_download_link', 'success', duration);
    
    if (siteData.portalUrl) {
      return siteData.portalUrl;
    }
    
    // Fallback: construct portal URL
    const platform = DATTO_CONFIG.apiUrl.match(/https:\/\/(\w+)-api/)[1];
    return `https://${platform}.rmm.datto.com/site/${siteData.id}`;
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordDattoApi('get_download_link', 'error', duration);
    recordError('datto_api', 'get_download_link');
    
    logError(requestLogger, error, {
      operation: 'getAgentDownloadLink',
      siteUid
    });
    
    throw new DattoApiError('Failed to get agent download link', {
      originalError: error.message,
      siteUid
    });
  }
}

/**
 * Update Stripe customer metadata
 */
async function updateStripeMetadata(customerId, metadata, requestLogger) {
  try {
    await retryAsync(
      async () => {
        return await stripe.customers.update(customerId, { metadata });
      },
      {
        operationName: 'updateStripeMetadata',
        logger: requestLogger,
        maxRetries: 2
      }
    );
    
    requestLogger.info('Stripe metadata updated', { customerId });
    
  } catch (error) {
    recordError('stripe_api', 'update_metadata');
    
    logError(requestLogger, error, {
      operation: 'updateStripeMetadata',
      customerId
    });
    
    throw new StripeApiError('Failed to update Stripe metadata', {
      originalError: error.message,
      customerId
    });
  }
}

/**
 * Stripe Webhook Handler with enhanced error handling
 */
app.post('/webhook/stripe', 
  express.raw({ type: 'application/json' }), 
  correlationMiddleware,
  async (req, res) => {
    const startTime = Date.now();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const requestLogger = req.logger;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      requestLogger.info('Webhook signature verified', { eventType: event.type });
      
    } catch (err) {
      const duration = (Date.now() - startTime) / 1000;
      recordWebhook('unknown', 'signature_failed', duration);
      recordError('webhook_validation', 'signature_verification');
      
      logError(requestLogger, err, {
        operation: 'webhookSignatureVerification'
      });
      
      return res.status(400).json(
        formatErrorResponse(new WebhookValidationError('Webhook signature verification failed'))
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        await trackAsyncOperation('webhook_processing', async () => {
          // Extract customer data from Stripe session
          const customerData = {
            email: session.customer_details.email,
            companyName: session.customer_details.name || session.metadata?.company_name,
            subscriptionId: session.subscription,
            customerId: session.customer,
            productId: session.metadata?.product_id,
          };

          requestLogger.info('Processing subscription', {
            email: customerData.email,
            customerId: customerData.customerId
          });

          // Create site in Datto RMM
          const dattoSite = await createDattoSite(customerData, requestLogger);
          
          requestLogger.info('Datto site created', {
            siteUid: dattoSite.uid,
            email: customerData.email
          });

          // Generate all platform download links
          const downloadLinks = generateDownloadLinks(dattoSite.id, dattoSite.uid);
          
          requestLogger.info('Download links generated', {
            siteUid: dattoSite.uid,
            siteId: dattoSite.id,
            windows: downloadLinks.windows,
            mac: downloadLinks.mac,
            linux: downloadLinks.linux
          });

          // Insert into Wix CMS (if configured)
          if (process.env.WIX_API_KEY && process.env.WIX_SITE_ID) {
            try {
              await insertCustomerDownload({
                sessionId: session.id,
                siteUid: dattoSite.uid,
                customerEmail: customerData.email,
                customerName: customerData.companyName || customerData.email,
                downloadLinks
              });
              requestLogger.info('Wix CMS item created', { sessionId: session.id });
            } catch (error) {
              requestLogger.warn('Wix CMS insert failed (non-critical)', { error: error.message });
            }
          } else {
            requestLogger.info('Wix CMS not configured - skipping');
          }

          // Send welcome email (if configured)
          if (process.env.M365_CLIENT_ID) {
            try {
              await sendWelcomeEmail({
                customerEmail: customerData.email,
                customerName: customerData.companyName || customerData.email,
                downloadLinks,
                siteUid: dattoSite.uid
              });
              requestLogger.info('Welcome email sent', { email: customerData.email });
            } catch (error) {
              requestLogger.warn('Email send failed (non-critical)', { error: error.message });
            }
          } else {
            requestLogger.info('M365 email not configured - skipping email');
          }

          // Store the download links in Stripe metadata
          await updateStripeMetadata(
            session.customer,
            {
              datto_site_uid: dattoSite.uid,
              windows_download: downloadLinks.windows,
              mac_download: downloadLinks.mac,
              linux_download: downloadLinks.linux,
            },
            requestLogger
          );

          const duration = (Date.now() - startTime) / 1000;
          recordWebhook(event.type, 'success', duration);
          
          requestLogger.info('Webhook processed successfully', {
            duration,
            siteUid: dattoSite.uid
          });

          res.json({ 
            received: true, 
            dattoSiteUid: dattoSite.uid,
            correlationId: req.correlationId
          });
        });
        
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        recordWebhook(event.type, 'error', duration);
        recordError('webhook_processing', event.type);
        
        logError(requestLogger, error, {
          operation: 'webhookProcessing',
          eventType: event.type,
          sessionId: session.id
        });
        
        // Send critical error alert
        await alerter.alertCritical(error, {
          correlationId: req.correlationId,
          operation: 'webhook_processing',
          eventType: event.type,
          sessionId: session.id,
          hostname: os.hostname()
        });
        
        // Return 200 to Stripe to prevent retries (we've logged the error)
        res.status(200).json({ 
          received: true, 
          error: error.message,
          correlationId: req.correlationId
        });
      }
    } else {
      // Other event types
      const duration = (Date.now() - startTime) / 1000;
      recordWebhook(event.type, 'ignored', duration);
      res.json({ received: true });
    }
  }
);

/**
 * Endpoint to retrieve agent download link for confirmation page
 */
app.get('/api/agent-download/:customerId', correlationMiddleware, async (req, res) => {
  const requestLogger = req.logger;
  
  try {
    const customer = await stripe.customers.retrieve(req.params.customerId);
    
    if (!customer.metadata.datto_agent_download) {
      requestLogger.warn('Download link not found', {
        customerId: req.params.customerId
      });
      return res.status(404).json({ 
        error: 'Download link not found',
        correlationId: req.correlationId
      });
    }

    requestLogger.info('Download link retrieved', {
      customerId: req.params.customerId
    });

    res.json({
      downloadUrl: customer.metadata.datto_agent_download,
      siteUid: customer.metadata.datto_site_uid,
      correlationId: req.correlationId
    });
    
  } catch (error) {
    recordError('api', 'get_download_link');
    logError(requestLogger, error, {
      operation: 'getDownloadLink',
      customerId: req.params.customerId
    });
    
    res.status(500).json(formatErrorResponse(error));
  }
});

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    hostname: os.hostname(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    circuitBreaker: dattoCircuitBreaker.getState(),
    alerter: alerter.getStatus()
  };
  
  res.json(health);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'Cloudigan API - Stripe to Datto RMM Integration',
    status: 'running',
    version: require('./package.json').version,
    endpoints: {
      webhook: '/webhook/stripe',
      agentDownload: '/api/agent-download/:customerId',
      health: '/health',
      metrics: '/metrics'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const requestLogger = req.logger || logger;
  
  logError(requestLogger, err, {
    operation: 'global_error_handler',
    path: req.path,
    method: req.method
  });
  
  recordError('unhandled', 'global_handler');
  
  res.status(err.statusCode || 500).json(
    formatErrorResponse(err, process.env.NODE_ENV !== 'production')
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info('Webhook server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname()
  });
  console.log(`✅ Webhook server running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});
