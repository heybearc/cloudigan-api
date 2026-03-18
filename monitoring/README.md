# Cloudigan API Monitoring Setup

## Overview

Comprehensive monitoring and alerting for the Cloudigan API webhook service, integrating with the homelab monitoring stack (CT150).

## Components

### 1. Structured Logging (Winston)
- **Location**: `lib/logger.js`
- **Features**:
  - Correlation IDs for request tracking
  - JSON structured logs for parsing
  - Separate error and combined log files
  - Log rotation (10MB max, 5 files)
  - Console output for development

**Log Files**:
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All logs

### 2. Prometheus Metrics (prom-client)
- **Location**: `lib/metrics.js`
- **Endpoint**: `/metrics`
- **Metrics Exposed**:
  - `cloudigan_api_webhooks_total` - Total webhooks received
  - `cloudigan_api_webhook_duration_seconds` - Processing duration histogram
  - `cloudigan_api_datto_requests_total` - Datto API calls
  - `cloudigan_api_datto_duration_seconds` - Datto API duration
  - `cloudigan_api_emails_total` - Email delivery status
  - `cloudigan_api_errors_total` - Error counts by type
  - `cloudigan_api_active_operations` - Current active operations
  - Default Node.js metrics (CPU, memory, etc.)

### 3. Error Alerting (M365 Email)
- **Location**: `lib/alerting.js`
- **Features**:
  - Critical error email notifications
  - 5-minute cooldown to prevent spam
  - HTML formatted alerts with full context
  - Integration with M365 OAuth mailer

**Alert Recipients**: Configured via `ALERT_EMAIL` environment variable

### 4. Retry Logic & Circuit Breaker
- **Location**: `lib/retry.js`
- **Features**:
  - Exponential backoff (1s → 30s max)
  - Automatic retry for transient failures
  - Circuit breaker pattern (5 failures → open)
  - Jitter to prevent thundering herd

### 5. Custom Error Classes
- **Location**: `lib/errors.js`
- **Error Types**:
  - `WebhookValidationError` - Stripe signature failures
  - `DattoApiError` - Datto RMM API issues
  - `DattoAuthError` - OAuth authentication failures
  - `EmailError` - Email delivery failures
  - `StripeApiError` - Stripe API issues
  - `ConfigurationError` - Configuration problems

## Integration with Homelab Monitoring

### Prometheus Configuration

Add to `/etc/prometheus/prometheus.yml` on CT150:

```yaml
scrape_configs:
  - job_name: 'cloudigan-api'
    static_configs:
      - targets: ['10.92.3.181:3000', '10.92.3.182:3000']
        labels:
          service: 'cloudigan-api'
          environment: 'production'
```

### Alert Rules

Copy `prometheus-alerts.yml` to CT150:

```bash
scp monitoring/prometheus-alerts.yml monitoring-stack:/etc/prometheus/rules/cloudigan-api.yml
ssh monitoring-stack 'sudo systemctl reload prometheus'
```

### Grafana Dashboard

Import `grafana-dashboard.json`:

1. Open Grafana at https://grafana.cloudigan.net
2. Navigate to Dashboards → Import
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus data source
5. Click Import

## Environment Variables

Add to `.env` on both containers:

```bash
# Logging
LOG_LEVEL=info                    # debug, info, warn, error
NODE_ENV=production               # production, development

# Alerting
ALERT_EMAIL=cory@cloudigan.com    # Email for critical alerts
M365_CLIENT_ID=your_client_id     # M365 OAuth (already configured)
M365_TENANT_ID=your_tenant_id
M365_CLIENT_SECRET=your_secret
M365_FROM_EMAIL=noreply@cloudigan.com
```

## Deployment

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `winston` - Structured logging
- `prom-client` - Prometheus metrics

### 2. Create Log Directory

```bash
mkdir -p logs
chmod 755 logs
```

### 3. Update Main Handler

Replace `webhook-handler.js` with `webhook-handler-enhanced.js`:

```bash
# Backup current handler
cp webhook-handler.js webhook-handler.backup.js

# Use enhanced handler
cp webhook-handler-enhanced.js webhook-handler.js
```

### 4. Restart Service

```bash
pm2 restart cloudigan-api
pm2 save
```

### 5. Verify Metrics

```bash
curl http://localhost:3000/metrics
```

## Monitoring Dashboards

### Key Metrics to Watch

1. **Webhook Success Rate** - Should be > 95%
2. **Processing Duration (p95)** - Should be < 10s
3. **Datto API Success Rate** - Should be > 98%
4. **Error Rate** - Should be < 5%
5. **Active Operations** - Monitor for stuck operations

### Alert Severity Levels

- **Critical**: Immediate action required (service down, >25% error rate)
- **Warning**: Investigation needed (>10% error rate, slow processing)
- **Info**: Informational (no webhooks for 30min)

## Testing

### Test Metrics Endpoint

```bash
curl http://localhost:3000/metrics | grep cloudigan_api
```

### Test Health Endpoint

```bash
curl http://localhost:3000/health | jq
```

### Test Error Alerting

Trigger a test alert (development only):

```bash
node -e "
const { getAlerter } = require('./lib/alerting');
const alerter = getAlerter();
alerter.sendAlert(new Error('Test alert'), { 
  operation: 'test',
  correlationId: 'test-123'
});
"
```

### Simulate Webhook Error

Use Stripe CLI to trigger test webhook:

```bash
stripe trigger checkout.session.completed
```

## Log Analysis

### View Recent Errors

```bash
tail -f logs/error.log | jq
```

### Search by Correlation ID

```bash
grep "correlation-id-here" logs/combined.log | jq
```

### Count Errors by Type

```bash
jq -r 'select(.level=="error") | .error.name' logs/error.log | sort | uniq -c
```

## Troubleshooting

### Metrics Not Appearing in Prometheus

1. Check Prometheus can reach the endpoint:
   ```bash
   curl http://10.92.3.181:3000/metrics
   ```

2. Verify Prometheus configuration:
   ```bash
   ssh monitoring-stack 'sudo promtool check config /etc/prometheus/prometheus.yml'
   ```

3. Check Prometheus targets:
   - Open https://prometheus.cloudigan.net/targets
   - Look for `cloudigan-api` job

### Alerts Not Firing

1. Check alert rules are loaded:
   ```bash
   ssh monitoring-stack 'sudo promtool check rules /etc/prometheus/rules/cloudigan-api.yml'
   ```

2. Verify Alertmanager configuration:
   - Open https://alertmanager.cloudigan.net

### Email Alerts Not Sending

1. Check M365 OAuth configuration:
   ```bash
   node -e "console.log(process.env.M365_CLIENT_ID ? 'Configured' : 'Missing')"
   ```

2. Test M365 mailer directly:
   ```bash
   node -e "
   const M365OAuthMailer = require('./m365-oauth-mailer');
   const mailer = new M365OAuthMailer({
     clientId: process.env.M365_CLIENT_ID,
     tenantId: process.env.M365_TENANT_ID,
     clientSecret: process.env.M365_CLIENT_SECRET,
     fromEmail: process.env.M365_FROM_EMAIL
   });
   mailer.sendMail({
     to: 'cory@cloudigan.com',
     subject: 'Test',
     html: '<p>Test</p>'
   }).then(() => console.log('Sent')).catch(console.error);
   "
   ```

## Performance Impact

- **Memory**: +20-30MB for Winston and metrics
- **CPU**: <1% overhead for logging and metrics collection
- **Disk**: ~50MB/day for logs (with rotation)
- **Network**: Minimal (metrics scraped every 30s)

## Best Practices

1. **Correlation IDs**: Always included in responses for tracing
2. **Log Levels**: Use appropriate levels (debug, info, warn, error)
3. **Error Context**: Include relevant context in error logs
4. **Metric Labels**: Keep cardinality low (avoid high-cardinality labels)
5. **Alert Fatigue**: Tune thresholds to reduce false positives

## Future Enhancements

- [ ] Distributed tracing (OpenTelemetry)
- [ ] Log aggregation (Loki integration)
- [ ] Custom business metrics (revenue tracking)
- [ ] SLA monitoring and reporting
- [ ] Automated incident response
