# Promote to Nexus Repository - Stripe-Datto Integration

## Summary
Complete Stripe to Datto RMM webhook integration ready for deployment to homelab infrastructure via nexus repository.

---

## Infrastructure Addition
**Type:** infrastructure
**Target:** Infrastructure documentation
**Category:** Integration Services
**Date:** 2026-03-16

### Service Details
- **Name**: stripe-datto-webhook
- **Function**: API Gateway / Webhook Handler
- **Purpose**: Automate Datto RMM site creation when customers subscribe via Stripe
- **Deployment**: LXC container (blue-green pattern)
- **Domain**: api.cloudigan.net
- **Internal Port**: 3000
- **External**: HTTPS via HAProxy

### Infrastructure Impact
- New LXC container in utility function range
- HAProxy backend configuration required
- DNS A record for api.cloudigan.net
- Firewall rules for Stripe webhook IPs

### Dependencies
- Stripe API (external)
- Datto RMM API (vidal-api.centrastage.net)
- Wix website (customer-facing)

---

## Policy: Webhook Security Standard
**Type:** policy
**Target:** Security policy
**Affects:** All webhook services
**Date:** 2026-03-16

### Policy Statement
All webhook endpoints must implement signature verification to prevent unauthorized requests and replay attacks.

### Requirements
1. **Signature Verification**: Validate webhook signatures using provider's secret
2. **HTTPS Only**: All webhook endpoints must use HTTPS
3. **Rate Limiting**: Implement rate limiting at HAProxy level (100 req/10s per IP)
4. **Network Isolation**: Webhook containers only accessible from HAProxy
5. **Secret Management**: Webhook secrets stored in .env files (0600 permissions)

### Implementation
- Stripe: Verify `stripe-signature` header
- Other providers: Follow provider-specific verification
- Reject all unsigned or invalid webhooks
- Log all verification failures

### Rationale
Webhooks are public endpoints that can be exploited if not properly secured. Signature verification ensures requests are legitimate.

---

## Decision: OAuth Token Management Pattern
**Type:** decision
**Target:** DECISIONS.md
**Affects:** Services using OAuth 2.0
**Date:** 2026-03-16
**Decision ID**: D-TBD (assign in control plane)

### Context
Datto RMM API requires OAuth 2.0 Authorization Code flow with browser interaction, making server-to-server automation challenging.

### Discovery/Decision
Use Playwright headless browser automation for OAuth flows that require user interaction. Cache tokens and implement auto-refresh.

### Implementation Pattern
```javascript
// 1. Automate OAuth flow with Playwright
const browser = await chromium.launch({ headless: true });
// Navigate, fill credentials, capture authorization code

// 2. Exchange code for token
const tokenResponse = await fetch(tokenUrl, { /* ... */ });

// 3. Cache token with expiration
const tokenInfo = {
  access_token: tokenData.access_token,
  expires_at: Date.now() + (tokenData.expires_in * 1000)
};
await fs.writeFile('.token.json', JSON.stringify(tokenInfo));

// 4. Auto-refresh before expiration
if (Date.now() >= tokenInfo.expires_at - 3600000) {
  await refreshToken();
}
```

### Rationale
- Enables full automation of OAuth flows requiring browser interaction
- Maintains security (no credential storage in code)
- Reduces manual intervention
- Tokens auto-refresh preventing service interruption

### Impact
- Services can automate OAuth without manual token generation
- Requires Playwright dependencies in containers
- Token files must be backed up and secured (0600 permissions)

### References
- Stripe-Datto integration implementation
- Playwright documentation

---

## Documentation: LXC Container Deployment Standard
**Type:** documentation
**Target:** Deployment documentation
**Category:** Container Management
**Date:** 2026-03-16

### Standard: Node.js Service in LXC Container

**Container Specifications:**
- Base: Ubuntu 22.04 LTS
- Type: Unprivileged LXC
- Management: Systemd service (not Docker/PM2)
- Deployment: Blue-green pattern (STANDBY → LIVE)

**Directory Structure:**
```
/opt/<service-name>/
├── src/                    # Application code
├── node_modules/           # Dependencies
├── logs/                   # Application logs
├── .env                    # Environment variables (0600)
└── .<service>-token.json   # OAuth tokens (0600, if applicable)
```

**Systemd Service Template:**
```ini
[Unit]
Description=<Service Name>
After=network.target

[Service]
Type=simple
User=<service-user>
WorkingDirectory=/opt/<service-name>
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/<service-name>/server.js
Restart=always
StandardOutput=append:/opt/<service-name>/logs/service.log
StandardError=append:/opt/<service-name>/logs/error.log

[Install]
WantedBy=multi-user.target
```

**Deployment Workflow:**
1. Deploy to STANDBY container
2. Run health checks
3. Test functionality
4. Switch HAProxy routing
5. STANDBY becomes LIVE

**Security:**
- Dedicated service user (non-privileged)
- Network isolation (only HAProxy access)
- Secret files: 0600 permissions
- Firewall rules restrict container access

### Applies To
- All Node.js webhook services
- API gateway services
- Integration services

---

## Files to Copy to Nexus Repository

### Application Code
**Source:** `/Users/cory/Projects/cloudigan/projects/stripe-datto-integration/`
**Destination:** `<nexus-repo>/applications/stripe-datto-webhook/`

**Files:**
```
src/
├── webhook-handler.js
├── datto-auth.js
├── package.json
└── package-lock.json

config/
├── systemd/stripe-datto-webhook.service
├── haproxy/backend-config.cfg
└── env.template

docs/
├── HOMELAB-ARCHITECTURE.md
├── CONTROL-PLANE-PROMOTION.md
├── NEXUS-HANDOFF.md
└── INTEGRATION-COMPLETE.md

deployment/
├── deploy.sh
├── health-check.sh
└── rollback.sh
```

---

## Governance Updates Required

### 1. Global Rules
Add to infrastructure map:
```markdown
### Integration Services
- **stripe-datto-webhook**: Stripe to Datto RMM automation
  - Container: stripe-datto-live (10.x.x.x:3000)
  - Domain: api.cloudigan.net
  - Function: Webhook handler
  - Pattern: Blue-green deployment
```

### 2. Deployment Policy
Add webhook deployment procedure:
```markdown
### Webhook Service Deployment
1. Deploy to STANDBY container
2. Test with provider's test events
3. Verify signature verification
4. Validate external API connectivity
5. Switch HAProxy routing
6. Monitor for 24 hours
```

### 3. Security Policy
Add webhook security requirements:
```markdown
### Webhook Security
- All webhooks must verify signatures
- HTTPS only (no HTTP endpoints)
- Rate limiting at HAProxy
- Network isolation (HAProxy access only)
- Secret rotation quarterly
```

### 4. Monitoring Policy
Add webhook monitoring metrics:
```markdown
### Webhook Monitoring
- Health check: Every 5 seconds
- Success rate: >99%
- Response time: <500ms
- Token expiration: Alert at 24 hours remaining
- Error rate: Alert at >10% over 15 minutes
```

---

## Next Steps

### For Control Plane Team
1. **Review this promotion document**
2. **Assign Decision ID** for OAuth pattern
3. **Update global-rules.md** with infrastructure entry
4. **Update policies** with webhook security standards
5. **Add documentation** for LXC Node.js deployment pattern

### For Nexus Deployment Team
1. **Copy files** to nexus repository
2. **Follow NEXUS-HANDOFF.md** for deployment
3. **Create LXC container** per specifications
4. **Deploy to STANDBY** first
5. **Test and promote to LIVE**

---

## Success Criteria

### Control Plane
- [ ] Infrastructure map updated
- [ ] Policies updated with webhook standards
- [ ] Decision recorded for OAuth pattern
- [ ] Documentation added for LXC deployment
- [ ] Files copied to nexus repository

### Deployment
- [ ] LXC container created
- [ ] Service deployed to STANDBY
- [ ] Health checks passing
- [ ] Stripe webhook configured
- [ ] End-to-end test successful
- [ ] Promoted to LIVE
- [ ] Monitoring configured

---

**This integration is production-ready and follows homelab governance standards.**
