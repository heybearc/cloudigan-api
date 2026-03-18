# Monitoring & Error Handling Deployment Guide

## ⚠️ CRITICAL: Blue-Green Deployment Workflow

**ALWAYS deploy to STANDBY first, test, then switch traffic.**

1. Deploy to STANDBY (currently CT182 - GREEN)
2. Test thoroughly on STANDBY
3. Switch traffic (STANDBY becomes LIVE)
4. Deploy to old LIVE (now STANDBY)

**Never deploy directly to LIVE. Never skip STANDBY testing.**

---

## Overview

This guide covers deploying the enhanced monitoring and error handling system to the cloudigan-api service.

## What's New

### Core Enhancements
1. **Structured Logging** - Winston with correlation IDs
2. **Prometheus Metrics** - Full observability integration
3. **Retry Logic** - Exponential backoff with circuit breaker
4. **Error Alerting** - M365 email notifications for critical errors
5. **Custom Error Classes** - Better error categorization
6. **Enhanced Health Checks** - Detailed service status

### New Endpoints
- `/metrics` - Prometheus metrics endpoint
- `/health` - Enhanced health check with circuit breaker status

## Pre-Deployment Checklist

- [ ] Review new code in `webhook-handler-enhanced.js`
- [ ] Verify M365 OAuth credentials in `.env`
- [ ] Set `ALERT_EMAIL` environment variable
- [ ] Create `logs/` directory on containers
- [ ] Update `package.json` dependencies

## Deployment Steps

### Step 1: Update Repository (Local Mac)

```bash
cd /Users/cory/Projects/cloudigan-api

# Verify all new files are present
ls -la lib/
ls -la monitoring/

# Commit changes
git add .
git commit -m "feat: add comprehensive monitoring and error handling

- Structured logging with Winston and correlation IDs
- Prometheus metrics endpoint for monitoring integration
- Retry logic with exponential backoff and circuit breaker
- M365 email alerting for critical errors
- Custom error classes for better categorization
- Enhanced health checks with service status
- Grafana dashboard and Prometheus alert rules"

git push origin main
```

### Step 2: Deploy to STANDBY (CT182 - GREEN)

```bash
# SSH to STANDBY container
ssh 10.92.3.182

# Navigate to app directory
cd /opt/cloudigan-api

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Create logs directory
mkdir -p logs
chmod 755 logs

# Verify environment variables
cat .env | grep -E "(ALERT_EMAIL|M365_|LOG_LEVEL)"

# Add missing env vars if needed
cat >> .env << 'EOF'
# Monitoring & Alerting
LOG_LEVEL=info
ALERT_EMAIL=cory@cloudigan.com
EOF

# Backup current handler
cp webhook-handler.js webhook-handler.backup.js

# Use enhanced handler
cp webhook-handler-enhanced.js webhook-handler.js

# Restart service
pm2 restart cloudigan-api
pm2 save

# Verify service started
pm2 status cloudigan-api
pm2 logs cloudigan-api --lines 50
```

### Step 3: Test STANDBY

```bash
# Test health endpoint
curl http://localhost:3000/health | jq

# Test metrics endpoint
curl http://localhost:3000/metrics | grep cloudigan_api

# Check logs are being written
ls -lh logs/
tail -f logs/combined.log

# Trigger test webhook (from local Mac)
stripe trigger checkout.session.completed --forward-to https://api.cloudigan.net/webhook/stripe
```

### Step 4: Verify Monitoring Integration

From local Mac or monitoring-stack (CT150):

```bash
# Test metrics scraping
curl http://10.92.3.182:3000/metrics

# Check Prometheus can reach it
ssh monitoring-stack
curl http://10.92.3.182:3000/metrics | head -20
```

### Step 5: Update Prometheus Configuration (CT150)

```bash
# SSH to monitoring stack
ssh monitoring-stack

# Backup current config
sudo cp /etc/prometheus/prometheus.yml /etc/prometheus/prometheus.yml.backup

# Add cloudigan-api job
sudo nano /etc/prometheus/prometheus.yml
```

Add this scrape config:

```yaml
  - job_name: 'cloudigan-api'
    scrape_interval: 30s
    static_configs:
      - targets: ['10.92.3.181:3000', '10.92.3.182:3000']
        labels:
          service: 'cloudigan-api'
          environment: 'production'
```

```bash
# Validate config
sudo promtool check config /etc/prometheus/prometheus.yml

# Reload Prometheus
sudo systemctl reload prometheus

# Verify targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="cloudigan-api")'
```

### Step 6: Deploy Alert Rules (CT150)

```bash
# Copy alert rules from local Mac
scp monitoring/prometheus-alerts.yml monitoring-stack:/tmp/

# SSH to monitoring stack
ssh monitoring-stack

# Move to rules directory
sudo mv /tmp/prometheus-alerts.yml /etc/prometheus/rules/cloudigan-api.yml
sudo chown prometheus:prometheus /etc/prometheus/rules/cloudigan-api.yml

# Validate rules
sudo promtool check rules /etc/prometheus/rules/cloudigan-api.yml

# Reload Prometheus
sudo systemctl reload prometheus

# Verify rules loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | select(.name=="cloudigan_api_alerts")'
```

### Step 7: Import Grafana Dashboard

1. Open https://grafana.cloudigan.net
2. Login with admin credentials
3. Navigate to **Dashboards** → **Import**
4. Click **Upload JSON file**
5. Select `monitoring/grafana-dashboard.json`
6. Select **Prometheus** as data source
7. Click **Import**
8. Verify panels are displaying data

### Step 8: Test Error Alerting

```bash
# SSH to STANDBY container
ssh 10.92.3.182

cd /opt/cloudigan-api

# Test alert email (development test)
node -e "
require('dotenv').config();
const { getAlerter } = require('./lib/alerting');
const alerter = getAlerter();
const testError = new Error('Test alert - monitoring deployment verification');
testError.code = 'TEST_ALERT';
alerter.sendAlert(testError, { 
  operation: 'deployment_test',
  correlationId: 'test-' + Date.now(),
  hostname: require('os').hostname()
}).then(() => console.log('Alert sent')).catch(console.error);
"
```

Check email at cory@cloudigan.com for test alert.

### Step 9: Traffic Switch to STANDBY (Test)

```bash
# Use MCP server to switch traffic
# This will make STANDBY (CT182) the LIVE server
```

Or manually via HAProxy:

```bash
ssh prox
pct exec 136 -- nano /etc/haproxy/haproxy.cfg

# Change backend for cloudigan-api to use CT182
# Reload HAProxy
pct exec 136 -- systemctl reload haproxy
```

### Step 10: Monitor LIVE Traffic

```bash
# Watch logs on new LIVE server (CT182)
ssh 10.92.3.182
cd /opt/cloudigan-api
tail -f logs/combined.log | jq

# Watch metrics in Grafana
# Open dashboard and monitor:
# - Webhook success rate
# - Processing duration
# - Error rate
# - Datto API calls
```

### Step 11: Deploy to OLD STANDBY (CT181 - BLUE)

Once CT182 is stable as LIVE, deploy to CT181:

```bash
# SSH to CT181
ssh 10.92.3.181

cd /opt/cloudigan-api
git pull origin main
npm install
mkdir -p logs
chmod 755 logs

# Update .env
cat >> .env << 'EOF'
LOG_LEVEL=info
ALERT_EMAIL=cory@cloudigan.com
EOF

# Backup and replace handler
cp webhook-handler.js webhook-handler.backup.js
cp webhook-handler-enhanced.js webhook-handler.js

# Restart
pm2 restart cloudigan-api
pm2 save

# Verify
curl http://localhost:3000/health | jq
curl http://localhost:3000/metrics | grep cloudigan_api
```

## Verification Checklist

After deployment, verify:

- [ ] Both containers (CT181, CT182) show in Prometheus targets
- [ ] Grafana dashboard displays metrics from both containers
- [ ] Alert rules are loaded in Prometheus
- [ ] Test alert email received successfully
- [ ] Logs are being written to `logs/` directory
- [ ] Health endpoint returns detailed status
- [ ] Metrics endpoint returns cloudigan_api metrics
- [ ] Correlation IDs appear in logs and responses
- [ ] Circuit breaker status visible in health check
- [ ] No errors in PM2 logs

## Rollback Procedure

If issues occur:

```bash
# SSH to affected container
ssh 10.92.3.181  # or 10.92.3.182

cd /opt/cloudigan-api

# Restore backup handler
cp webhook-handler.backup.js webhook-handler.js

# Restart service
pm2 restart cloudigan-api
pm2 save

# Verify service is working
curl http://localhost:3000/health
```

## Monitoring After Deployment

### Key Metrics to Watch (First 24 Hours)

1. **Webhook Success Rate** - Should remain > 95%
2. **Error Rate** - Should be < 5%
3. **Processing Duration** - Should be < 10s (p95)
4. **Memory Usage** - Monitor for leaks
5. **Alert Frequency** - Tune thresholds if too noisy

### Grafana Dashboard

Access: https://grafana.cloudigan.net

Look for:
- "Cloudigan API - Webhook Monitoring" dashboard
- Real-time webhook processing metrics
- Error trends
- Datto API performance

### Prometheus Alerts

Access: https://prometheus.cloudigan.net/alerts

Monitor for:
- CloudiganAPIHighErrorRate
- CloudiganAPISlowWebhookProcessing
- CloudiganAPIDattoAPIFailures
- CloudiganAPIDown

### Log Analysis

```bash
# View recent errors
ssh 10.92.3.182
cd /opt/cloudigan-api
tail -f logs/error.log | jq

# Search by correlation ID
grep "correlation-id" logs/combined.log | jq

# Count errors by type
jq -r 'select(.level=="error") | .error.name' logs/error.log | sort | uniq -c
```

## Troubleshooting

### Metrics Not Showing in Prometheus

1. Check Prometheus can scrape endpoint:
   ```bash
   curl http://10.92.3.182:3000/metrics
   ```

2. Check Prometheus targets:
   ```bash
   curl http://monitoring-stack:9090/api/v1/targets | jq
   ```

3. Verify firewall rules allow port 3000

### Alerts Not Firing

1. Validate alert rules:
   ```bash
   ssh monitoring-stack
   sudo promtool check rules /etc/prometheus/rules/cloudigan-api.yml
   ```

2. Check Alertmanager status:
   ```bash
   curl http://monitoring-stack:9093/api/v1/status
   ```

### Email Alerts Not Sending

1. Verify M365 OAuth config:
   ```bash
   ssh 10.92.3.182
   cd /opt/cloudigan-api
   node -e "console.log(process.env.M365_CLIENT_ID ? 'OK' : 'MISSING')"
   ```

2. Test mailer directly:
   ```bash
   node -e "
   require('dotenv').config();
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
     html: '<p>Test email</p>'
   }).then(() => console.log('Sent')).catch(console.error);
   "
   ```

## Success Criteria

Deployment is successful when:

1. ✅ Both containers reporting metrics to Prometheus
2. ✅ Grafana dashboard showing live data
3. ✅ Alert rules loaded and evaluating
4. ✅ Test alert email received
5. ✅ Webhook processing working normally
6. ✅ No increase in error rates
7. ✅ Logs being written correctly
8. ✅ Health checks passing

## Next Steps

After successful deployment:

1. Monitor for 24-48 hours
2. Tune alert thresholds based on actual traffic
3. Review error patterns in logs
4. Optimize retry logic if needed
5. Add custom business metrics as needed
6. Document any issues encountered

## Support

For issues during deployment:
- Check logs: `tail -f logs/combined.log`
- Review PM2 logs: `pm2 logs cloudigan-api`
- Check Prometheus targets: https://prometheus.cloudigan.net/targets
- Review Grafana dashboard: https://grafana.cloudigan.net
