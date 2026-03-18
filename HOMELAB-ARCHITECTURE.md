# Stripe-Datto Webhook - LXC Container Architecture

## Overview
Self-hosted webhook service running in LXC container on homelab infrastructure with blue-green deployment pattern.

## Architecture Diagram

```
Internet (Stripe)
    ↓
api.cloudigan.net (DNS)
    ↓
HAProxy (Public IP)
    ↓
┌─────────────────────────────────────┐
│  LXC Container: stripe-datto-live   │
│  IP: 10.x.x.x (internal)            │
│  Port: 3000                         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Node.js 18+                  │  │
│  │ webhook-handler.js           │  │
│  │ datto-auth.js (Playwright)   │  │
│  │ .datto-token.json (cached)   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Systemd Service                    │
│  PM2 Process Manager                │
└─────────────────────────────────────┘
    ↓
Datto RMM API (vidal-api.centrastage.net)
```

## Blue-Green Deployment

```
┌─────────────────────────────────────┐
│  stripe-datto-standby (testing)     │
│  IP: 10.x.x.y                       │
│  Port: 3000                         │
└─────────────────────────────────────┘
         ↓ (test & validate)
         ↓
    HAProxy switch
         ↓
┌─────────────────────────────────────┐
│  stripe-datto-live (production)     │
│  IP: 10.x.x.x                       │
│  Port: 3000                         │
└─────────────────────────────────────┘
```

## LXC Container Specifications

### Base Container
- **OS**: Ubuntu 22.04 LTS (or your standard base)
- **Type**: Unprivileged LXC container
- **CPU**: 1-2 cores
- **RAM**: 512MB - 1GB
- **Storage**: 5GB
- **Network**: Bridge to internal network

### Hostname
- **LIVE**: `stripe-datto-live.lxc.cloudigan.internal`
- **STANDBY**: `stripe-datto-standby.lxc.cloudigan.internal`

### Internal IPs
- **LIVE**: 10.x.x.x (assign from your network)
- **STANDBY**: 10.x.x.y (assign from your network)

## System Requirements

### Node.js Runtime
```bash
# Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### Playwright Dependencies
```bash
# Required for headless browser (OAuth automation)
apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2
```

### Process Management
```bash
# PM2 for process management
npm install -g pm2

# Or systemd service (recommended for LXC)
```

## Directory Structure

```
/opt/stripe-datto-webhook/
├── node_modules/
├── webhook-handler.js
├── datto-auth.js
├── package.json
├── package-lock.json
├── .env                      # Environment variables
├── .datto-token.json         # OAuth token cache (auto-generated)
└── logs/
    ├── webhook.log
    ├── error.log
    └── oauth.log
```

## Environment Configuration

### /opt/stripe-datto-webhook/.env
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_... # Get after configuring Stripe webhook

# Datto RMM Configuration
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=BCE6247DP69R8OBFHVE37EMET4IH6325
DATTO_API_SECRET_KEY=C9CEDEUVO476DF9IKAP3MK33I0QBUCAV

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Systemd Service Configuration

### /etc/systemd/system/stripe-datto-webhook.service
```ini
[Unit]
Description=Stripe to Datto RMM Webhook Service
After=network.target

[Service]
Type=simple
User=webhook
Group=webhook
WorkingDirectory=/opt/stripe-datto-webhook
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/stripe-datto-webhook/webhook-handler.js
Restart=always
RestartSec=10
StandardOutput=append:/opt/stripe-datto-webhook/logs/webhook.log
StandardError=append:/opt/stripe-datto-webhook/logs/error.log

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/stripe-datto-webhook

[Install]
WantedBy=multi-user.target
```

## HAProxy Configuration

### /etc/haproxy/haproxy.cfg (add to existing config)
```haproxy
# Frontend for HTTPS
frontend https_front
    bind *:443 ssl crt /etc/ssl/certs/cloudigan.net.pem
    
    # Stripe webhook routing
    acl is_stripe_webhook path_beg /webhook/stripe
    acl is_agent_link path_beg /api/agent-link
    acl is_webhook_health path /health
    
    use_backend stripe_datto_webhook if is_stripe_webhook or is_agent_link or is_webhook_health
    
    # Default backend for other traffic
    default_backend your_default_backend

# Backend for Stripe-Datto webhook
backend stripe_datto_webhook
    mode http
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    # LIVE server (primary)
    server stripe-datto-live 10.x.x.x:3000 check inter 5s fall 3 rise 2
    
    # STANDBY server (backup)
    server stripe-datto-standby 10.x.x.y:3000 check inter 5s fall 3 rise 2 backup
```

## DNS Configuration

### api.cloudigan.net
```
Type: A
Name: api
Value: <your-public-ip>
TTL: 300
```

Or if using subdomain:
```
Type: CNAME
Name: stripe-webhook.api
Value: api.cloudigan.net
TTL: 300
```

## Firewall Rules

### On HAProxy/Gateway
```bash
# Allow HTTPS from Stripe IPs
# Stripe webhook IPs: https://stripe.com/docs/ips

iptables -A INPUT -p tcp --dport 443 -s <stripe-ip-range> -j ACCEPT
```

### On LXC Container
```bash
# Only allow from HAProxy
iptables -A INPUT -p tcp --dport 3000 -s <haproxy-ip> -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

## Installation Steps (for Nexus repo)

### 1. Create LXC Container
```bash
# Create container
lxc-create -n stripe-datto-live -t ubuntu -- -r jammy

# Configure network
# Edit /var/lib/lxc/stripe-datto-live/config
lxc.net.0.type = veth
lxc.net.0.link = lxcbr0
lxc.net.0.flags = up
lxc.net.0.ipv4.address = 10.x.x.x/24
lxc.net.0.ipv4.gateway = 10.x.x.1

# Start container
lxc-start -n stripe-datto-live
lxc-attach -n stripe-datto-live
```

### 2. Install Dependencies
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Playwright dependencies
apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2

# Install git (for deployment)
apt-get install -y git
```

### 3. Create Service User
```bash
# Create dedicated user
useradd -r -s /bin/bash -d /opt/stripe-datto-webhook webhook

# Create application directory
mkdir -p /opt/stripe-datto-webhook/logs
chown -R webhook:webhook /opt/stripe-datto-webhook
```

### 4. Deploy Application
```bash
# Switch to webhook user
su - webhook

# Clone/copy application files
cd /opt/stripe-datto-webhook
# Copy files from development machine or git repo

# Install dependencies
npm install
npx playwright install chromium

# Create .env file
nano .env
# Add environment variables

# Test application
node webhook-handler.js
# Should see: "Webhook server running on port 3000"
```

### 5. Configure Systemd Service
```bash
# Exit webhook user
exit

# Create systemd service
nano /etc/systemd/system/stripe-datto-webhook.service
# Paste service configuration from above

# Enable and start service
systemctl daemon-reload
systemctl enable stripe-datto-webhook
systemctl start stripe-datto-webhook

# Check status
systemctl status stripe-datto-webhook
journalctl -u stripe-datto-webhook -f
```

### 6. Configure HAProxy
```bash
# On HAProxy server
nano /etc/haproxy/haproxy.cfg
# Add backend configuration from above

# Test configuration
haproxy -c -f /etc/haproxy/haproxy.cfg

# Reload HAProxy
systemctl reload haproxy
```

### 7. Test Endpoint
```bash
# From external network
curl https://api.cloudigan.net/health

# Should return:
# {"status":"ok","timestamp":"2026-03-16T..."}
```

## Blue-Green Deployment Workflow

### Deploy to STANDBY
```bash
# 1. Create STANDBY container (clone LIVE)
lxc-copy -n stripe-datto-live -N stripe-datto-standby

# 2. Update STANDBY IP in container config
# Edit /var/lib/lxc/stripe-datto-standby/config
lxc.net.0.ipv4.address = 10.x.x.y/24

# 3. Start STANDBY
lxc-start -n stripe-datto-standby

# 4. Update code on STANDBY
lxc-attach -n stripe-datto-standby
cd /opt/stripe-datto-webhook
git pull  # or copy new files
npm install
systemctl restart stripe-datto-webhook

# 5. Test STANDBY
curl http://10.x.x.y:3000/health
```

### Switch to LIVE
```bash
# 1. Verify STANDBY health
curl http://10.x.x.y:3000/health

# 2. Update HAProxy to use STANDBY as primary
# Edit /etc/haproxy/haproxy.cfg
# Swap server priorities or change IPs

# 3. Reload HAProxy
systemctl reload haproxy

# 4. Verify traffic routing
curl https://api.cloudigan.net/health

# 5. Monitor logs
journalctl -u stripe-datto-webhook -f
```

### Rollback
```bash
# Switch HAProxy back to old LIVE
systemctl reload haproxy
```

## Monitoring & Maintenance

### Health Checks
```bash
# Local health check
curl http://localhost:3000/health

# External health check
curl https://api.cloudigan.net/health

# Check service status
systemctl status stripe-datto-webhook

# View logs
journalctl -u stripe-datto-webhook -n 100 -f
tail -f /opt/stripe-datto-webhook/logs/webhook.log
```

### OAuth Token Management
```bash
# Check token status
cat /opt/stripe-datto-webhook/.datto-token.json | jq

# Token expires every 100 hours
# Automatic refresh via Playwright when needed

# Manual token refresh (if needed)
su - webhook
cd /opt/stripe-datto-webhook
node datto-auth.js
```

### Log Rotation
```bash
# Create /etc/logrotate.d/stripe-datto-webhook
/opt/stripe-datto-webhook/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 webhook webhook
    sharedscripts
    postrotate
        systemctl reload stripe-datto-webhook > /dev/null 2>&1 || true
    endscript
}
```

## Security Considerations

### 1. Network Isolation
- Container only accessible from HAProxy
- No direct internet access except for API calls
- Firewall rules restrict port 3000 to HAProxy IP

### 2. Secret Management
- `.env` file permissions: 0600 (webhook user only)
- OAuth tokens stored in `.datto-token.json` (0600)
- No secrets in logs or version control

### 3. HTTPS/TLS
- HAProxy terminates SSL
- Internal traffic over HTTP (trusted network)
- SSL certificate for api.cloudigan.net

### 4. Stripe Webhook Verification
- Webhook signature verification in code
- Rejects unsigned/invalid webhooks
- Prevents replay attacks

### 5. Rate Limiting (HAProxy)
```haproxy
# Add to frontend
stick-table type ip size 100k expire 30s store http_req_rate(10s)
http-request track-sc0 src
http-request deny if { sc_http_req_rate(0) gt 100 }
```

## Backup & Recovery

### Backup Strategy
```bash
# Backup script: /opt/backup-stripe-webhook.sh
#!/bin/bash
BACKUP_DIR="/backup/stripe-datto-webhook"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup application files
tar -czf $BACKUP_DIR/app-$DATE.tar.gz \
    /opt/stripe-datto-webhook \
    --exclude=node_modules \
    --exclude=logs

# Backup OAuth token
cp /opt/stripe-datto-webhook/.datto-token.json \
   $BACKUP_DIR/token-$DATE.json

# Keep last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Recovery
```bash
# Restore from backup
tar -xzf /backup/stripe-datto-webhook/app-YYYYMMDD-HHMMSS.tar.gz -C /

# Restore token
cp /backup/stripe-datto-webhook/token-YYYYMMDD-HHMMSS.json \
   /opt/stripe-datto-webhook/.datto-token.json

# Fix permissions
chown -R webhook:webhook /opt/stripe-datto-webhook

# Restart service
systemctl restart stripe-datto-webhook
```

## Stripe Configuration

### Webhook Endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://api.cloudigan.net/webhook/stripe`
4. Events: Select `checkout.session.completed`
5. Copy webhook signing secret
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Restart service: `systemctl restart stripe-datto-webhook`

### Test Webhook
```bash
# Install Stripe CLI
stripe listen --forward-to https://api.cloudigan.net/webhook/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

## Performance Tuning

### Node.js Optimization
```bash
# Set in systemd service
Environment=NODE_OPTIONS="--max-old-space-size=512"
```

### PM2 Alternative (if preferred)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start webhook-handler.js --name stripe-datto-webhook

# Save PM2 config
pm2 save
pm2 startup systemd
```

## Troubleshooting

### Service won't start
```bash
# Check logs
journalctl -u stripe-datto-webhook -n 50

# Check port availability
netstat -tlnp | grep 3000

# Check permissions
ls -la /opt/stripe-datto-webhook
```

### OAuth token issues
```bash
# Check token file
cat /opt/stripe-datto-webhook/.datto-token.json

# Manual refresh
su - webhook
cd /opt/stripe-datto-webhook
node datto-auth.js
```

### Webhook not receiving events
```bash
# Check HAProxy routing
curl -v https://api.cloudigan.net/webhook/stripe

# Check Stripe webhook logs
# https://dashboard.stripe.com/webhooks

# Verify webhook secret
grep STRIPE_WEBHOOK_SECRET /opt/stripe-datto-webhook/.env
```

## Resource Requirements

### Minimum
- CPU: 1 core
- RAM: 512MB
- Storage: 5GB
- Network: 10Mbps

### Recommended
- CPU: 2 cores
- RAM: 1GB
- Storage: 10GB
- Network: 100Mbps

## Cost Analysis

### Self-Hosted (Your Infrastructure)
- **Hardware**: $0 (existing)
- **Bandwidth**: Minimal (webhook calls only)
- **Maintenance**: Your time
- **Total**: $0/month

### vs Railway/Cloud
- **Service**: $5-10/month
- **Less control**: Limited customization
- **External dependency**: Reliant on third party

## Summary

**Architecture**: LXC container → HAProxy → api.cloudigan.net
**Deployment**: Blue-green with LIVE/STANDBY containers
**Management**: Systemd service, automated OAuth refresh
**Monitoring**: Systemd logs, health checks, HAProxy stats
**Security**: Network isolation, secret management, webhook verification
**Cost**: $0 (using existing infrastructure)

This architecture integrates with your existing homelab governance model and container-first workflow.
