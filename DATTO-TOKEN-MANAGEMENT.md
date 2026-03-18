# Datto OAuth Token Management

## Overview

The Datto RMM API requires OAuth authentication with a 100-hour access token. This document describes how tokens are managed and refreshed.

---

## Token Lifecycle

**Token Duration:** ~100 hours (4.16 days)  
**Refresh Schedule:** Every 4 days (96 hours)  
**Alert Threshold:** 24 hours before expiration

---

## Automated Token Refresh

### Cron Job Setup

A cron job runs every 4 days to automatically refresh the token:

```bash
# Install the cron job (run once on LIVE server)
cd /opt/cloudigan-api
chmod +x scripts/install-token-refresh-cron.sh
./scripts/install-token-refresh-cron.sh
```

**Schedule:** Every 96 hours (4 days)  
**Script:** `/opt/cloudigan-api/scripts/refresh-datto-token.sh`  
**Logs:** `/opt/cloudigan-api/logs/token-refresh.log`

### What the Cron Job Does

1. Checks current token expiration
2. Runs `node datto-auth.js` to get fresh token
3. Saves token to `.datto-token.json`
4. Copies token to standby server (CT182)
5. Logs success/failure
6. Sends email alert on failure

---

## Manual Token Refresh

If you need to manually refresh the token:

```bash
# SSH into LIVE server
ssh -i ~/.ssh/homelab_root root@10.92.3.181

# Navigate to app directory
cd /opt/cloudigan-api

# Run token refresh
node datto-auth.js

# Copy to standby server
scp .datto-token.json root@10.92.3.182:/opt/cloudigan-api/
```

---

## Token Health Monitoring

### Check Token Status

```bash
# Run health check script
cd /opt/cloudigan-api
./scripts/check-token-health.sh
```

**Output:**
```
Datto OAuth Token Status:
  Expires in: 87 hours
  Status: ✅ Healthy
```

### Add to Monitoring

You can add token health checks to your monitoring system:

```bash
# Add to cron for daily health checks
0 9 * * * /opt/cloudigan-api/scripts/check-token-health.sh
```

This will send email alerts if:
- Token is missing
- Token expires in less than 24 hours

---

## Webhook Behavior

**Important:** The webhook handler does NOT automatically refresh tokens during processing.

**If token is expired:**
- Webhook will fail with clear error message
- Error alert email will be sent to `cory@cloudigan.com`
- Error will include correlation ID for tracking

**To prevent webhook failures:**
- Ensure cron job is running
- Monitor token health daily
- Set up alerts for token expiration

---

## Troubleshooting

### Token Refresh Failed

**Check logs:**
```bash
tail -50 /opt/cloudigan-api/logs/token-refresh.log
```

**Common issues:**
- Playwright browser not installed: `npx playwright install chromium`
- Datto credentials changed: Update `.env` file
- Network connectivity issues: Check firewall/DNS

**Manual fix:**
```bash
cd /opt/cloudigan-api
node datto-auth.js
```

### Token Missing

**Generate new token:**
```bash
cd /opt/cloudigan-api
node datto-auth.js
scp .datto-token.json root@10.92.3.182:/opt/cloudigan-api/
```

### Webhook Failing with Token Error

**Check token status:**
```bash
./scripts/check-token-health.sh
```

**If expired, refresh immediately:**
```bash
node datto-auth.js
systemctl restart cloudigan-api
```

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Token file | `/opt/cloudigan-api/.datto-token.json` | Cached OAuth token |
| Refresh script | `/opt/cloudigan-api/scripts/refresh-datto-token.sh` | Automated refresh |
| Health check | `/opt/cloudigan-api/scripts/check-token-health.sh` | Token monitoring |
| Refresh logs | `/opt/cloudigan-api/logs/token-refresh.log` | Refresh history |
| Auth script | `/opt/cloudigan-api/datto-auth.js` | Token generation |

---

## Security Notes

- Token file contains sensitive credentials
- File permissions: `600` (read/write owner only)
- Not committed to Git (in `.gitignore`)
- Stored only on production servers
- Automatically copied between LIVE/STANDBY

---

## Monitoring Integration

### Prometheus Metrics

The webhook handler exposes token-related metrics:

```
cloudigan_api_errors_total{type="DATTO_AUTH_ERROR"}
```

### Grafana Alerts

Set up alerts for:
- Token expiration warnings
- Token refresh failures
- Datto API authentication errors

### Email Alerts

Configured recipients:
- `cory@cloudigan.com` (token refresh failures, expiration warnings)

---

## Deployment Checklist

When deploying to new servers:

- [ ] Install Playwright browsers: `npx playwright install chromium`
- [ ] Generate initial token: `node datto-auth.js`
- [ ] Install cron job: `./scripts/install-token-refresh-cron.sh`
- [ ] Test token health: `./scripts/check-token-health.sh`
- [ ] Verify webhook works: Test Stripe webhook
- [ ] Check logs: `tail -f logs/token-refresh.log`

---

**Last Updated:** 2026-03-18  
**Maintained By:** Cloudigan DevOps
