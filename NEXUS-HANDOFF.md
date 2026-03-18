# Nexus Repository Handoff - Stripe-Datto Webhook

## Quick Summary
This document provides everything needed to deploy the Stripe-Datto webhook integration in your homelab nexus repository.

## What This Service Does
Automatically creates Datto RMM sites when customers subscribe via Stripe on your Wix website.

**Flow:**
```
Customer subscribes on Wix
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to api.cloudigan.net
    ↓
Webhook creates Datto site
    ↓
Returns portal URL to customer
```

## Files to Copy to Nexus Repo

### Source Code (copy to `/applications/stripe-datto-webhook/src/`)
```
webhook-handler.js          # Main webhook server
datto-auth.js              # OAuth automation
package.json               # Dependencies
package-lock.json          # Locked dependencies
```

### Configuration (copy to `/applications/stripe-datto-webhook/config/`)
```
systemd/stripe-datto-webhook.service    # Systemd service
haproxy/backend-config.cfg              # HAProxy configuration
env.template                            # Environment variables template
```

### Documentation (copy to `/applications/stripe-datto-webhook/docs/`)
```
HOMELAB-ARCHITECTURE.md     # Complete architecture
CONTROL-PLANE-PROMOTION.md  # Governance documentation
INTEGRATION-COMPLETE.md     # Integration details
```

### Deployment Scripts (copy to `/applications/stripe-datto-webhook/deployment/`)
```
deploy.sh                   # Deployment automation
health-check.sh            # Health check script
rollback.sh                # Rollback procedure
```

## Container Specification for Nexus

### LXC Container Config
```yaml
name: stripe-datto-webhook
function: utility
base: ubuntu-22.04
resources:
  cpu: 2
  memory: 1024  # MB
  disk: 5       # GB
network:
  ip: 10.x.x.x  # Assign from your utility range
  gateway: 10.x.x.1
  bridge: lxcbr0
services:
  - name: stripe-datto-webhook
    port: 3000
    protocol: http
    health_check: /health
```

### Required Packages
```bash
# System packages
nodejs (18.x)
npm
git

# Playwright dependencies
libnss3
libnspr4
libatk1.0-0
libatk-bridge2.0-0
libcups2
libdrm2
libdbus-1-3
libxkbcommon0
libxcomposite1
libxdamage1
libxfixes3
libxrandr2
libgbm1
libasound2
```

### Node.js Dependencies (from package.json)
```json
{
  "express": "^4.18.2",
  "axios": "^1.6.0",
  "dotenv": "^16.3.1",
  "stripe": "^14.0.0",
  "playwright": "^1.40.0"
}
```

## Environment Variables Required

Create `/opt/stripe-datto-webhook/.env`:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_[get from Stripe dashboard after webhook setup]

# Datto RMM
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=BCE6247DP69R8OBFHVE37EMET4IH6325
DATTO_API_SECRET_KEY=C9CEDEUVO476DF9IKAP3MK33I0QBUCAV

# Server
PORT=3000
NODE_ENV=production
```

## Deployment Procedure for Nexus

### 1. Create Container
```bash
# Using your nexus automation
create-lxc-container \
  --name stripe-datto-webhook \
  --function utility \
  --ip 10.x.x.x \
  --base ubuntu-22.04 \
  --cpu 2 \
  --memory 1024 \
  --disk 5
```

### 2. Install Dependencies
```bash
# SSH into container
ssh stripe-datto-webhook

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git

# Install Playwright dependencies
apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### 3. Deploy Application
```bash
# Create service user
useradd -r -s /bin/bash -d /opt/stripe-datto-webhook webhook

# Create directory
mkdir -p /opt/stripe-datto-webhook/logs
chown -R webhook:webhook /opt/stripe-datto-webhook

# Copy application files
# (from nexus repo to container)
cp -r /path/to/nexus/applications/stripe-datto-webhook/src/* \
  /opt/stripe-datto-webhook/

# Install npm dependencies
cd /opt/stripe-datto-webhook
npm install
npx playwright install chromium

# Create .env file
cp /path/to/nexus/applications/stripe-datto-webhook/config/env.template \
  /opt/stripe-datto-webhook/.env
# Edit .env with actual values
nano .env

# Fix permissions
chown -R webhook:webhook /opt/stripe-datto-webhook
chmod 600 /opt/stripe-datto-webhook/.env
```

### 4. Configure Systemd
```bash
# Copy systemd service
cp /path/to/nexus/applications/stripe-datto-webhook/config/systemd/stripe-datto-webhook.service \
  /etc/systemd/system/

# Enable and start
systemctl daemon-reload
systemctl enable stripe-datto-webhook
systemctl start stripe-datto-webhook

# Verify
systemctl status stripe-datto-webhook
```

### 5. Configure HAProxy
```bash
# On HAProxy server
# Add backend configuration from:
# /path/to/nexus/applications/stripe-datto-webhook/config/haproxy/backend-config.cfg

# Test and reload
haproxy -c -f /etc/haproxy/haproxy.cfg
systemctl reload haproxy
```

### 6. Configure DNS
```bash
# Add A record
api.cloudigan.net → <your-public-ip>
```

### 7. Configure Stripe Webhook
```bash
# 1. Go to https://dashboard.stripe.com/webhooks
# 2. Add endpoint: https://api.cloudigan.net/webhook/stripe
# 3. Select event: checkout.session.completed
# 4. Copy webhook signing secret
# 5. Update .env with STRIPE_WEBHOOK_SECRET
# 6. Restart service: systemctl restart stripe-datto-webhook
```

### 8. Test Deployment
```bash
# Health check
curl https://api.cloudigan.net/health
# Expected: {"status":"ok","timestamp":"..."}

# Test webhook (using Stripe CLI)
stripe trigger checkout.session.completed \
  --webhook-endpoint https://api.cloudigan.net/webhook/stripe

# Check logs
journalctl -u stripe-datto-webhook -f
```

## Blue-Green Deployment in Nexus

### STANDBY Deployment
```bash
# 1. Clone LIVE container
clone-lxc-container stripe-datto-webhook stripe-datto-webhook-standby

# 2. Update IP
update-lxc-ip stripe-datto-webhook-standby 10.x.x.y

# 3. Deploy new code to STANDBY
# 4. Test STANDBY
# 5. Switch HAProxy to STANDBY
# 6. STANDBY becomes new LIVE
```

## Integration Points

### 1. Stripe
- **Webhook URL**: https://api.cloudigan.net/webhook/stripe
- **Event**: checkout.session.completed
- **Verification**: Webhook signature validation

### 2. Datto RMM
- **API URL**: https://vidal-api.centrastage.net
- **Authentication**: OAuth 2.0 (automated via Playwright)
- **Operations**: Site creation, portal URL retrieval

### 3. Wix Confirmation Page
- **API Endpoint**: https://api.cloudigan.net/api/agent-link/:sessionId
- **Returns**: Agent download portal URL
- **Usage**: Fetch and display to customer

## Monitoring Integration

### Health Checks
```bash
# HAProxy health check
GET https://api.cloudigan.net/health
Expected: 200 OK, {"status":"ok"}
Frequency: Every 5 seconds
```

### Logs
```bash
# Application logs
/opt/stripe-datto-webhook/logs/webhook.log
/opt/stripe-datto-webhook/logs/error.log

# System logs
journalctl -u stripe-datto-webhook
```

### Metrics to Track
- Service uptime
- Webhook processing success rate
- Datto API call success rate
- OAuth token expiration time
- Response time

## Security Considerations

### Network Security
- Container only accessible from HAProxy
- Firewall rules restrict port 3000 to HAProxy IP
- SSL/TLS terminated at HAProxy

### Secret Management
- All secrets in .env file (0600 permissions)
- OAuth token auto-refreshes (stored in .datto-token.json)
- No secrets in logs or version control

### Webhook Security
- Stripe signature verification on all webhooks
- Rejects unsigned or invalid webhooks
- Rate limiting in HAProxy

## Troubleshooting

### Service Won't Start
```bash
# Check logs
journalctl -u stripe-datto-webhook -n 50

# Check permissions
ls -la /opt/stripe-datto-webhook

# Check port
netstat -tlnp | grep 3000
```

### Webhooks Not Processing
```bash
# Check Stripe webhook logs
# https://dashboard.stripe.com/webhooks

# Verify webhook secret
grep STRIPE_WEBHOOK_SECRET /opt/stripe-datto-webhook/.env

# Test endpoint
curl -X POST https://api.cloudigan.net/webhook/stripe
```

### OAuth Token Issues
```bash
# Check token
cat /opt/stripe-datto-webhook/.datto-token.json

# Manual refresh
su - webhook
cd /opt/stripe-datto-webhook
node datto-auth.js
```

## Rollback Procedure

### Quick Rollback
```bash
# 1. Switch HAProxy back to old LIVE
systemctl reload haproxy

# 2. Verify
curl https://api.cloudigan.net/health

# 3. Fix STANDBY issues
```

### Full Rollback
```bash
# 1. Stop new service
systemctl stop stripe-datto-webhook

# 2. Restore from backup
tar -xzf /backup/stripe-datto-webhook-YYYYMMDD.tar.gz -C /

# 3. Restart service
systemctl start stripe-datto-webhook
```

## Success Criteria

### Deployment Success
- [ ] Container created and running
- [ ] Service started and healthy
- [ ] HAProxy routing correctly
- [ ] DNS resolving to public IP
- [ ] Health check endpoint responding
- [ ] Stripe webhook configured
- [ ] Test webhook processed successfully
- [ ] Datto site created via test webhook
- [ ] Logs being written

### Operational Success
- [ ] Uptime > 99.9%
- [ ] Webhook processing success > 99%
- [ ] Response time < 500ms
- [ ] OAuth token auto-refreshing
- [ ] No security incidents

## Support

### Internal Support
- **Documentation**: See `/applications/stripe-datto-webhook/docs/`
- **Logs**: `journalctl -u stripe-datto-webhook`
- **Health**: `curl https://api.cloudigan.net/health`

### External Support
- **Stripe**: https://support.stripe.com
- **Datto**: https://www.datto.com/support

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch logs for errors
   - Verify webhook processing
   - Check OAuth token refresh

2. **Test with Real Customer**
   - Have test customer subscribe
   - Verify site created in Datto
   - Confirm download link works

3. **Document in Control Plane**
   - Update infrastructure map
   - Add to monitoring dashboard
   - Document in runbook

4. **Train Support Team**
   - How to check service health
   - How to read logs
   - How to restart service
   - Escalation procedures

---

**This service is ready for deployment in your nexus repository.**

All files are in `/Users/cory/Projects/cloudigan/projects/stripe-datto-integration/`
