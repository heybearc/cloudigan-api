/**
 * Prometheus metrics for monitoring
 * Integrates with homelab monitoring stack (CT150)
 */

const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics for webhook processing
const webhookCounter = new promClient.Counter({
  name: 'cloudigan_api_webhooks_total',
  help: 'Total number of webhooks received',
  labelNames: ['event_type', 'status'],
  registers: [register]
});

const webhookDuration = new promClient.Histogram({
  name: 'cloudigan_api_webhook_duration_seconds',
  help: 'Webhook processing duration in seconds',
  labelNames: ['event_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const dattoApiCounter = new promClient.Counter({
  name: 'cloudigan_api_datto_requests_total',
  help: 'Total number of Datto API requests',
  labelNames: ['operation', 'status'],
  registers: [register]
});

const dattoApiDuration = new promClient.Histogram({
  name: 'cloudigan_api_datto_duration_seconds',
  help: 'Datto API request duration in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const emailCounter = new promClient.Counter({
  name: 'cloudigan_api_emails_total',
  help: 'Total number of emails sent',
  labelNames: ['provider', 'status'],
  registers: [register]
});

const errorCounter = new promClient.Counter({
  name: 'cloudigan_api_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'operation'],
  registers: [register]
});

const wixCmsCounter = new promClient.Counter({
  name: 'cloudigan_api_wix_cms_operations_total',
  help: 'Total number of Wix CMS operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

// Gauge for active operations
const activeOperations = new promClient.Gauge({
  name: 'cloudigan_api_active_operations',
  help: 'Number of currently active operations',
  labelNames: ['operation'],
  registers: [register]
});

// Gauge for Datto token expiration (hours until expiry)
const dattoTokenExpiry = new promClient.Gauge({
  name: 'cloudigan_api_datto_token_hours_until_expiry',
  help: 'Hours until Datto OAuth token expires',
  registers: [register]
});

// Counter for signup flow stages
const signupFlowCounter = new promClient.Counter({
  name: 'cloudigan_api_signup_flow_total',
  help: 'Total number of signup flow stage completions',
  labelNames: ['stage', 'status', 'product_type'],
  registers: [register]
});

// Histogram for signup flow stage duration
const signupFlowDuration = new promClient.Histogram({
  name: 'cloudigan_api_signup_flow_duration_seconds',
  help: 'Duration of each signup flow stage in seconds',
  labelNames: ['stage', 'product_type'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [register]
});

// Gauge for token refresh status
const tokenRefreshStatus = new promClient.Gauge({
  name: 'cloudigan_api_token_refresh_status',
  help: 'Token refresh status (1=success, 0=failed)',
  labelNames: ['token_type'],
  registers: [register]
});

/**
 * Record webhook processing
 */
function recordWebhook(eventType, status, duration) {
  webhookCounter.inc({ event_type: eventType, status });
  if (duration !== undefined) {
    webhookDuration.observe({ event_type: eventType, status }, duration);
  }
}

/**
 * Record Datto API call
 */
function recordDattoApi(operation, status, duration) {
  dattoApiCounter.inc({ operation, status });
  if (duration !== undefined) {
    dattoApiDuration.observe({ operation }, duration);
  }
}

/**
 * Record email sent
 */
function recordEmail(provider, status) {
  emailCounter.inc({ provider, status });
}

/**
 * Record error
 */
function recordError(type, operation) {
  errorCounter.inc({ type, operation });
}

/**
 * Record Wix CMS operation
 */
function recordWixCms(operation, status) {
  wixCmsCounter.inc({ operation, status });
}

/**
 * Track active operation
 */
function trackOperation(operation, callback) {
  activeOperations.inc({ operation });
  try {
    return callback();
  } finally {
    activeOperations.dec({ operation });
  }
}

/**
 * Track async operation
 */
async function trackAsyncOperation(operation, callback) {
  activeOperations.inc({ operation });
  try {
    return await callback();
  } finally {
    activeOperations.dec({ operation });
  }
}

/**
 * Update Datto token expiry metric
 */
function updateDattoTokenExpiry(hoursUntilExpiry) {
  dattoTokenExpiry.set(hoursUntilExpiry);
}

/**
 * Record signup flow stage
 */
function recordSignupFlowStage(stage, status, productType, duration) {
  signupFlowCounter.inc({ stage, status, product_type: productType });
  if (duration !== undefined) {
    signupFlowDuration.observe({ stage, product_type: productType }, duration);
  }
}

/**
 * Update token refresh status
 */
function updateTokenRefreshStatus(tokenType, success) {
  tokenRefreshStatus.set({ token_type: tokenType }, success ? 1 : 0);
}

/**
 * Express middleware to expose metrics endpoint
 */
async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  register,
  metricsHandler,
  recordWebhook,
  recordDattoApi,
  recordEmail,
  recordError,
  recordWixCms,
  trackOperation,
  trackAsyncOperation,
  updateDattoTokenExpiry,
  recordSignupFlowStage,
  updateTokenRefreshStatus
};
