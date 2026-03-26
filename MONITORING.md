# Cloudigan API Monitoring & Alerting

## Overview

Comprehensive monitoring and alerting system for the Cloudigan API, covering token expiration, customer signup flows, and system health.

---

## 📊 Prometheus Metrics

### Token Monitoring

**`cloudigan_api_datto_token_hours_until_expiry`** (Gauge)
- Hours until Datto OAuth token expires
- Updated every hour automatically
- **Alert Threshold:** < 24 hours

**`cloudigan_api_token_refresh_status{token_type="datto"}`** (Gauge)
- Token refresh status (1=success, 0=failed)
- Updated after each refresh attempt

### Signup Flow Metrics

**`cloudigan_api_signup_flow_total{stage, status, product_type}`** (Counter)
- Total signup flow stage completions
- **Stages:**
  - `datto_site_creation` - Datto RMM site creation
  - `wix_cms_write` - Wix CMS record creation
  - `welcome_email` - Welcome email delivery
- **Status:** `success` | `failed`
- **Product Type:** `business` | `personal`

**`cloudigan_api_signup_flow_duration_seconds{stage, product_type}`** (Histogram)
- Duration of each signup flow stage
- Buckets: [0.5, 1, 2, 5, 10, 30, 60] seconds

### Existing Metrics

- `cloudigan_api_webhooks_total{event_type, status}` - Webhook processing
- `cloudigan_api_datto_requests_total{operation, status}` - Datto API calls
- `cloudigan_api_emails_total{provider, status}` - Email delivery
- `cloudigan_api_errors_total{type, operation}` - Error tracking
- `cloudigan_api_wix_cms_operations_total{operation, status}` - Wix CMS operations

---

## 🚨 Alerting

### Token Expiration Alerts

**Warning Alert (< 24 hours remaining)**
- **Subject:** `⚠️ Datto OAuth Token Expiring Soon (Xh remaining)`
- **Recipient:** `cory@cloudigan.com` (configurable via `ALERT_EMAIL` env var)
- **Action Required:** Refresh token manually or wait for cron job

**Critical Alert (Token Expired)**
- **Subject:** `🚨 CRITICAL: Datto OAuth Token EXPIRED (Xh ago)`
- **Impact:** Customer signups are FAILING
- **Action Required:** Immediate token refresh

### Alert Configuration

Set alert email in `.env`:
```bash
ALERT_EMAIL=your-email@example.com
```

Alerts are sent via M365 SMTP using existing email configuration.

---

## 📈 Grafana Dashboard

### Installation

1. **Import Dashboard:**
   ```bash
   # Copy dashboard JSON to Grafana server
   scp grafana-dashboard.json grafana-server:/var/lib/grafana/dashboards/
   ```

2. **Or import via UI:**
   - Grafana → Dashboards → Import
   - Upload `grafana-dashboard.json`

### Dashboard Panels

1. **Datto Token Expiration (Gauge)**
   - Visual indicator of hours remaining
   - Color-coded thresholds:
     - Red: 0-24 hours
     - Orange: 24-48 hours
     - Yellow: 48-72 hours
     - Green: 72+ hours

2. **Token Refresh Status**
   - Shows last refresh success/failure

3. **Customer Signup Flow - Success Rate**
   - Real-time success/failure rates for each stage
   - Separate lines for business vs personal products

4. **Signup Flow Stage Duration (p95)**
   - 95th percentile latency for each stage
   - Helps identify performance bottlenecks

5. **Signup Flow Stages - Total Counts**
   - Datto sites created
   - Wix CMS records written
   - Welcome emails sent

6. **Signup Flow Funnel**
   - Business vs Personal product breakdown

7. **Failed Signup Stages (Table)**
   - Detailed view of failures by stage and product type

8. **Webhook Processing Rate**
   - Overall webhook success/error rates

### Accessing the Dashboard

```
http://your-grafana-server:3000/d/cloudigan-api
```

---

## 🔄 Automatic Token Refresh

### Cron Job

**Schedule:** Every 4 days at 2 AM
**User:** `webhook`
**Script:** `/opt/cloudigan-api/refresh-datto-token.sh`

```bash
# View cron schedule
ssh pve "pct exec 181 -- crontab -l -u webhook"

# Check refresh logs
ssh pve "pct exec 181 -- tail -f /opt/cloudigan-api/logs/token-refresh.log"
```

### Manual Token Refresh

If automatic refresh fails:

```bash
# SSH into container
ssh pve
pct enter 181

# Run refresh script
cd /opt/cloudigan-api
node datto-auth.js

# Verify new token
node -e "const t = require('./.datto-token.json'); console.log('Expires:', new Date(t.expires_at))"

# Restart service
systemctl restart cloudigan-api
```

### Token Refresh Methods

1. **OAuth Refresh Token (Preferred)** - Uses `refresh_token` from existing token
2. **Playwright Automation (Fallback)** - Browser automation for OAuth flow
3. **Manual Input** - Copy/paste authorization code

---

## 🔍 Monitoring Best Practices

### Daily Checks

1. **Check Grafana Dashboard**
   - Verify token expiration > 24 hours
   - Review signup flow success rates
   - Check for failed stages

2. **Review Logs**
   ```bash
   ssh pve "pct exec 181 -- tail -100 /opt/cloudigan-api/logs/combined.log"
   ```

3. **Check Prometheus Metrics**
   ```bash
   curl http://cloudigan-api-blue:3000/metrics | grep cloudigan_api_datto_token
   ```

### Weekly Tasks

1. **Verify Token Refresh**
   - Check `/opt/cloudigan-api/logs/token-refresh.log`
   - Confirm cron job is running

2. **Review Failed Signups**
   - Check Grafana "Failed Signup Stages" panel
   - Investigate any patterns

### Monthly Review

1. **Analyze Signup Flow Performance**
   - Review p95 latencies
   - Identify optimization opportunities

2. **Token Refresh Reliability**
   - Verify refresh_token is present in token file
   - Confirm automatic refresh is working

---

## 🛠️ Troubleshooting

### Token Expiration Issues

**Problem:** Token expired, signups failing

**Solution:**
```bash
ssh pve "pct exec 181 -- sh -c 'cd /opt/cloudigan-api && node datto-auth.js && systemctl restart cloudigan-api'"
```

**Prevention:** Ensure token has `refresh_token` for automatic renewal

### Signup Flow Failures

**Problem:** Specific stage failing consistently

**Check:**
1. Review error logs: `tail -100 /opt/cloudigan-api/logs/error.log`
2. Check Prometheus metrics for error counts
3. Verify service dependencies (Datto API, Wix CMS, M365 SMTP)

**Common Issues:**
- **Datto API:** Token expired or network issues
- **Wix CMS:** OAuth token expired or permissions issue
- **Email:** M365 SMTP credentials or rate limiting

### Metrics Not Updating

**Problem:** Grafana shows no data

**Check:**
1. Verify Prometheus is scraping: `http://prometheus:9090/targets`
2. Check metrics endpoint: `curl http://cloudigan-api-blue:3000/metrics`
3. Restart cloudigan-api service

---

## 📞 Support

**Primary Contact:** cory@cloudigan.com

**Escalation:**
1. Check logs: `/opt/cloudigan-api/logs/`
2. Review Grafana dashboard
3. Check Prometheus alerts
4. Contact if issue persists

---

## 🔗 Related Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Architecture Overview](HOMELAB-ARCHITECTURE.md)
- [Integration Details](INTEGRATION-COMPLETE.md)
