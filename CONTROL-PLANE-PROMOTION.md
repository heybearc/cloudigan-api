# Control Plane Promotion - Stripe-Datto Webhook Integration

## Overview
This document provides the governance and handoff requirements for promoting the Stripe-Datto webhook integration to the control plane for deployment via the nexus repository.

## Repository Governance Model

### Canonical Location
```
Repository: cloudigan-nexus (or your homelab control plane repo)
Path: /applications/stripe-datto-webhook/
```

### Directory Structure for Control Plane
```
/applications/stripe-datto-webhook/
├── _governance/
│   ├── service-spec.md           # Service specification
│   ├── deployment-policy.md      # Deployment requirements
│   ├── security-policy.md        # Security requirements
│   └── monitoring-policy.md      # Monitoring requirements
├── src/
│   ├── webhook-handler.js        # Main application
│   ├── datto-auth.js            # OAuth automation
│   ├── package.json             # Dependencies
│   └── package-lock.json
├── config/
│   ├── systemd/
│   │   └── stripe-datto-webhook.service
│   ├── haproxy/
│   │   └── backend-config.cfg
│   └── env.template             # Environment variable template
├── deployment/
│   ├── lxc-container-spec.yaml  # LXC container specification
│   ├── deploy.sh                # Deployment automation
│   ├── health-check.sh          # Health check script
│   └── rollback.sh              # Rollback procedure
├── docs/
│   ├── ARCHITECTURE.md          # System architecture
│   ├── OPERATIONS.md            # Operations guide
│   └── TROUBLESHOOTING.md       # Troubleshooting guide
└── README.md                    # Service overview
```

## Service Specification

### Service Identity
- **Name**: stripe-datto-webhook
- **Function**: Integration service
- **Category**: API Gateway / Webhook Handler
- **Owner**: Cloudigan IT Solutions
- **Criticality**: Medium (affects new customer onboarding)

### Technical Specifications
- **Runtime**: Node.js 18.x LTS
- **Port**: 3000 (internal)
- **Protocol**: HTTP (internal), HTTPS (external via HAProxy)
- **Dependencies**: 
  - Playwright (OAuth automation)
  - Express.js (web framework)
  - Axios (HTTP client)
- **External APIs**:
  - Stripe API (stripe.com)
  - Datto RMM API (vidal-api.centrastage.net)

### Container Specifications
- **Type**: LXC (unprivileged)
- **Base**: Ubuntu 22.04 LTS
- **CPU**: 1-2 cores
- **RAM**: 512MB - 1GB
- **Storage**: 5GB
- **Network**: Internal bridge (10.x.x.x/24)
- **CTID Range**: Utility (assign from your utility range)

### Network Requirements
- **Ingress**: HTTPS (443) from Stripe webhook IPs
- **Egress**: 
  - HTTPS (443) to stripe.com
  - HTTPS (443) to vidal-api.centrastage.net
- **Internal**: HTTP (3000) from HAProxy only
- **Public Endpoint**: https://api.cloudigan.net/webhook/stripe

## Deployment Policy

### Blue-Green Deployment
```
STANDBY Container (stripe-datto-standby)
    ↓
Deploy new version
    ↓
Run health checks
    ↓
Test with Stripe test events
    ↓
Verify Datto API connectivity
    ↓
Switch HAProxy routing
    ↓
LIVE Container (stripe-datto-live)
```

### Pre-Deployment Checklist
- [ ] Code reviewed and tested locally
- [ ] Dependencies audited (`npm audit`)
- [ ] Environment variables configured
- [ ] OAuth token obtained and tested
- [ ] Health check endpoint responding
- [ ] Stripe webhook signature verification working
- [ ] Datto API connectivity confirmed
- [ ] Logs configured and rotating
- [ ] Backup of current LIVE container taken

### Deployment Steps
1. **Prepare STANDBY**
   ```bash
   lxc-copy -n stripe-datto-live -N stripe-datto-standby
   lxc-start -n stripe-datto-standby
   ```

2. **Deploy Code**
   ```bash
   lxc-attach -n stripe-datto-standby
   cd /opt/stripe-datto-webhook
   git pull origin main
   npm install
   systemctl restart stripe-datto-webhook
   ```

3. **Validate STANDBY**
   ```bash
   # Health check
   curl http://10.x.x.y:3000/health
   
   # Test Stripe webhook (using test mode)
   stripe trigger checkout.session.completed --webhook-endpoint http://10.x.x.y:3000/webhook/stripe
   
   # Verify Datto connectivity
   curl http://10.x.x.y:3000/health
   ```

4. **Switch to LIVE**
   ```bash
   # Update HAProxy configuration
   # Reload HAProxy
   systemctl reload haproxy
   
   # Verify external endpoint
   curl https://api.cloudigan.net/health
   ```

5. **Monitor**
   ```bash
   # Watch logs for 15 minutes
   journalctl -u stripe-datto-webhook -f
   
   # Verify webhook events processing
   # Check Stripe dashboard webhook logs
   ```

### Rollback Procedure
```bash
# Immediate rollback
# 1. Switch HAProxy back to old LIVE
systemctl reload haproxy

# 2. Verify service restored
curl https://api.cloudigan.net/health

# 3. Investigate STANDBY issues
lxc-attach -n stripe-datto-standby
journalctl -u stripe-datto-webhook -n 100
```

## Security Policy

### Secret Management
- **Storage**: Environment variables in `/opt/stripe-datto-webhook/.env`
- **Permissions**: 0600 (webhook user only)
- **Rotation**: 
  - Stripe keys: Annual or on compromise
  - Datto API keys: Quarterly or on compromise
  - OAuth tokens: Auto-refresh every 100 hours

### Secrets Required
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Datto RMM
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=...
DATTO_API_SECRET_KEY=...
```

### Network Security
- **Firewall**: Only allow HAProxy IP to port 3000
- **SSL/TLS**: Terminated at HAProxy
- **Webhook Verification**: Stripe signature validation required
- **Rate Limiting**: Configured in HAProxy (100 req/10s per IP)

### Access Control
- **Service User**: `webhook` (non-privileged)
- **File Permissions**: 
  - Application files: 0644
  - .env: 0600
  - .datto-token.json: 0600
- **Container Access**: SSH key authentication only
- **Sudo**: Not required for service operation

## Monitoring Policy

### Health Checks
- **Endpoint**: `GET /health`
- **Expected Response**: `{"status":"ok","timestamp":"..."}`
- **Frequency**: Every 5 seconds (HAProxy)
- **Failure Threshold**: 3 consecutive failures
- **Recovery**: 2 consecutive successes

### Metrics to Monitor
- **Service Availability**: Uptime percentage
- **Response Time**: Average response time for /health
- **Webhook Processing**: Success/failure rate
- **OAuth Token**: Expiration time remaining
- **API Calls**: Datto API success/failure rate
- **Error Rate**: 5xx responses per minute

### Logging
- **Application Logs**: `/opt/stripe-datto-webhook/logs/webhook.log`
- **Error Logs**: `/opt/stripe-datto-webhook/logs/error.log`
- **System Logs**: `journalctl -u stripe-datto-webhook`
- **Retention**: 14 days (logrotate)
- **Format**: JSON structured logs

### Alerting Thresholds
- **Critical**: Service down > 5 minutes
- **Warning**: Error rate > 10% over 15 minutes
- **Info**: OAuth token expires in < 24 hours

### Monitoring Commands
```bash
# Service status
systemctl status stripe-datto-webhook

# Recent logs
journalctl -u stripe-datto-webhook -n 100 -f

# Health check
curl https://api.cloudigan.net/health

# Check OAuth token expiration
cat /opt/stripe-datto-webhook/.datto-token.json | jq '.expires_at'

# HAProxy stats
echo "show stat" | socat stdio /var/run/haproxy.sock
```

## Integration Requirements

### Stripe Configuration
1. **Webhook Endpoint**
   - URL: `https://api.cloudigan.net/webhook/stripe`
   - Events: `checkout.session.completed`
   - Mode: Live mode (production)

2. **API Keys**
   - Secret Key: From Stripe Dashboard
   - Webhook Secret: From webhook configuration

3. **Testing**
   - Use Stripe CLI for local testing
   - Use test mode for STANDBY validation
   - Switch to live mode for LIVE deployment

### Datto RMM Configuration
1. **API Access**
   - Enable API access in Global Settings
   - Generate API keys for `cloudy-api` user
   - Verify API URL: `https://vidal-api.centrastage.net`

2. **OAuth Setup**
   - Initial token obtained via Playwright automation
   - Token cached in `.datto-token.json`
   - Auto-refresh every 100 hours

3. **Permissions**
   - Site creation: Required
   - Site listing: Required
   - Account info: Required

### HAProxy Integration
1. **Backend Configuration**
   ```haproxy
   backend stripe_datto_webhook
       mode http
       balance roundrobin
       option httpchk GET /health
       server stripe-datto-live 10.x.x.x:3000 check
       server stripe-datto-standby 10.x.x.y:3000 check backup
   ```

2. **Frontend Routing**
   ```haproxy
   acl is_stripe_webhook path_beg /webhook/stripe
   use_backend stripe_datto_webhook if is_stripe_webhook
   ```

3. **SSL Certificate**
   - Domain: api.cloudigan.net
   - Provider: Let's Encrypt or commercial CA
   - Auto-renewal: Configured

### DNS Configuration
- **Record**: A record for api.cloudigan.net
- **IP**: Your public IP
- **TTL**: 300 seconds
- **Backup**: Document IP for disaster recovery

## Handoff Checklist

### Code Handoff
- [ ] All source code committed to control plane repo
- [ ] Dependencies documented in package.json
- [ ] Environment variables documented in .env.template
- [ ] README.md with service overview complete
- [ ] ARCHITECTURE.md with technical details complete

### Configuration Handoff
- [ ] Systemd service file provided
- [ ] HAProxy configuration snippet provided
- [ ] LXC container specification documented
- [ ] Firewall rules documented
- [ ] DNS requirements documented

### Documentation Handoff
- [ ] Operations guide complete
- [ ] Troubleshooting guide complete
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Monitoring guide complete

### Security Handoff
- [ ] Secret management documented
- [ ] Access control requirements specified
- [ ] Network security requirements specified
- [ ] Webhook signature verification implemented
- [ ] OAuth token management documented

### Testing Handoff
- [ ] Health check endpoint tested
- [ ] Stripe webhook integration tested
- [ ] Datto API integration tested
- [ ] OAuth token refresh tested
- [ ] Blue-green deployment tested

## Governance Alignment

### Compliance with LDC Tools Model
This service follows the same governance model as LDC Tools:

1. **Repo-Governed**: All configuration in control plane repo
2. **Container-First**: LXC container deployment
3. **Blue-Green**: STANDBY → test → LIVE workflow
4. **Documented**: Complete documentation in `_governance/`
5. **Monitored**: Health checks and logging
6. **Secure**: Secret management and access control

### Control Plane Integration
```
_cloudy-ops/
├── global-rules.md              # Add Stripe-Datto webhook rules
├── policy/
│   ├── deployment-policy.md     # Reference this service
│   └── security-policy.md       # Reference this service
└── applications/
    └── stripe-datto-webhook/    # This service
```

### Policy Updates Required
1. **Global Rules**: Add webhook service to infrastructure map
2. **Deployment Policy**: Add blue-green procedure for webhooks
3. **Security Policy**: Add webhook signature verification requirements
4. **Monitoring Policy**: Add webhook-specific metrics

## Operations Runbook

### Daily Operations
- Monitor health check endpoint
- Review error logs for anomalies
- Verify OAuth token expiration (should auto-refresh)

### Weekly Operations
- Review webhook processing success rate
- Check Datto API connectivity
- Verify Stripe webhook logs
- Review resource usage (CPU, RAM, disk)

### Monthly Operations
- Review and rotate logs
- Update dependencies (`npm update`)
- Test backup/restore procedure
- Review security policies

### Quarterly Operations
- Rotate Datto API keys
- Review and update documentation
- Conduct disaster recovery drill
- Performance optimization review

## Disaster Recovery

### Backup Strategy
- **Application Code**: Git repository (control plane)
- **OAuth Token**: Daily backup to `/backup/stripe-datto-webhook/`
- **Configuration**: In control plane repo
- **Container**: LXC snapshot before deployments

### Recovery Procedure
1. **Service Failure**
   ```bash
   # Restart service
   systemctl restart stripe-datto-webhook
   
   # If restart fails, rollback to STANDBY
   systemctl reload haproxy
   ```

2. **Container Failure**
   ```bash
   # Restore from LXC snapshot
   lxc-snapshot -r snap0 -n stripe-datto-live
   lxc-start -n stripe-datto-live
   ```

3. **Complete Loss**
   ```bash
   # Rebuild from control plane repo
   # 1. Create new LXC container
   # 2. Deploy code from repo
   # 3. Restore OAuth token from backup
   # 4. Configure HAProxy
   # 5. Test and switch to LIVE
   ```

### RTO/RPO
- **RTO** (Recovery Time Objective): 15 minutes
- **RPO** (Recovery Point Objective): 24 hours (OAuth token)

## Success Criteria

### Deployment Success
- [ ] Service running and healthy
- [ ] HAProxy routing correctly
- [ ] Stripe webhooks processing
- [ ] Datto sites being created
- [ ] OAuth token auto-refreshing
- [ ] Logs being written
- [ ] Health checks passing

### Operational Success
- [ ] Uptime > 99.9%
- [ ] Webhook processing success rate > 99%
- [ ] Average response time < 500ms
- [ ] Zero security incidents
- [ ] Documentation complete and accurate

## Contact Information

### Service Owner
- **Team**: Cloudigan IT Solutions
- **Primary Contact**: [Your contact]
- **Escalation**: [Escalation contact]

### External Dependencies
- **Stripe Support**: https://support.stripe.com
- **Datto Support**: https://www.datto.com/support

## Appendix

### Related Documentation
- `HOMELAB-ARCHITECTURE.md` - Detailed architecture
- `INTEGRATION-COMPLETE.md` - Integration details
- `QUICK-START.md` - Quick deployment guide
- `DEPLOYMENT.md` - Alternative deployment options

### Version History
- **v1.0** (2026-03-16): Initial promotion to control plane
- Future versions documented here

### Change Log
All changes tracked in control plane repository commit history.

---

**This service is ready for promotion to the control plane and handoff to the nexus repository for deployment.**
