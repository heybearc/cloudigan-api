# Stripe-Datto Integration - Task State

**Last updated:** 2026-04-07

## Current Task
**Production Operations & Monitoring** - ACTIVE

### What I'm doing right now
Cloudigan API is deployed and operational on blue-green containers (CT181/CT182). System is processing customer purchases successfully. Recent work focused on fixing expired Datto token, implementing automated refresh, and fixing alerting system.

### Recent completions
- ✅ Fixed expired Datto OAuth token (April 1, 2026)
- ✅ Implemented automated token refresh cron jobs (every 3 days, staggered)
- ✅ Fixed token-monitor.js mailer initialization bug (alerts were failing silently)
- ✅ Deployed fixes to both BLUE and GREEN containers
- ✅ Manually processed failed webhook customer (Patrick Frost - Cleveland Wrap)
- ✅ Corrected Wix CMS data for Business Essentials Package purchase
- ✅ Verified Wix CMS has 4 recent customers with complete data
- ✅ Cleaned up Zammad-related files (moved to homelab-nexus via control plane)

### Integration Flow (Working)
```
Customer subscribes on Wix
    ↓
Stripe processes payment
    ↓
Webhook → api.cloudigan.net/webhook/stripe
    ↓
Creates Datto RMM site (OAuth automated)
    ↓
Returns portal URL
    ↓
Wix confirmation page displays download link
```

## Next Steps

### Immediate
1. **Monitor automated token refresh**
   - BLUE cron: Midnight every 3 days
   - GREEN cron: 6 AM every 3 days
   - Verify email alerts are received on next refresh
   - Check `/var/log/datto-token-refresh.log` after first run

2. **Verify alerting system**
   - Token monitoring runs hourly via webhook-handler.js
   - Alerts sent to cory@cloudigan.com when < 24 hours remaining
   - M365OAuthMailer properly initialized in token-monitor.js

3. **Monitor production webhooks**
   - Watch for any Datto API errors
   - Verify customer data flows to Wix CMS correctly
   - Check that Business vs Personal products are classified correctly

### Operational Maintenance
1. Token refresh happens automatically every 3 days
2. Health checks via HAProxy on both containers
3. Metrics available at `/metrics` endpoint
4. Logs via `journalctl -u cloudigan-api`

## Files Ready for Handoff

### Application Code
- `webhook-handler.js` - Main webhook server (Express.js)
- `datto-auth.js` - OAuth automation (Playwright)
- `package.json` - Dependencies
- `.env.template` - Environment variables

### Documentation
- `HOMELAB-ARCHITECTURE.md` - Complete LXC container architecture
- `CONTROL-PLANE-PROMOTION.md` - Governance documentation
- `NEXUS-HANDOFF.md` - Deployment guide for nexus team
- `INTEGRATION-COMPLETE.md` - Technical integration details
- `QUICK-START.md` - Alternative cloud deployment (Railway)

### Configuration
- Systemd service file
- HAProxy backend configuration
- LXC container specification
- Environment variables template

## Technical Details

### Authentication Solution
- **Problem**: Datto OAuth requires browser interaction
- **Solution**: Playwright automation for OAuth flow
- **Result**: Fully automated token refresh every 100 hours
- **Token**: Cached in `.datto-token.json`, auto-refreshes

### Architecture
- **Deployment**: LXC container (not Docker)
- **Management**: Systemd service
- **Routing**: HAProxy → container port 3000
- **Domain**: api.cloudigan.net
- **Pattern**: Blue-green (STANDBY → LIVE)

### Integration Points
1. **Stripe**: Webhook for `checkout.session.completed`
2. **Datto RMM**: Site creation API (vidal-api.centrastage.net)
3. **Wix**: Confirmation page fetches agent download URL

## Known Issues
None - system is operational and stable.

**Recent Issues Resolved:**
- ✅ Datto OAuth token expired (10 days old) - Fixed April 1, 2026
- ✅ Token monitoring alerts not sending - Fixed mailer initialization
- ✅ No automated token refresh - Implemented cron jobs on both containers

## Exact Next Command
**Monitor the system:**
```bash
# Check token status on LIVE container
ssh root@10.92.3.181 'cd /opt/cloudigan-api && node -e "const t = require(\"./.datto-token.json\"); console.log(\"Expires:\", new Date(t.expires_at), \"Hours remaining:\", Math.round((t.expires_at - Date.now()) / 3600000))"'

# Check recent Wix CMS customers
ssh root@10.92.3.181 'cd /opt/cloudigan-api && node query-wix-cms.js | head -20'

# Verify cron jobs are scheduled
ssh root@10.92.3.181 'crontab -l | grep auto-renew-token'
```

## Success Criteria
- [x] Datto API authentication working
- [x] Site creation tested and confirmed
- [x] OAuth token auto-refresh implemented (cron jobs on both containers)
- [x] Webhook handler complete
- [x] LXC architecture documented
- [x] Control plane governance created
- [x] Deployed to homelab (CT181 BLUE - LIVE, CT182 GREEN - STANDBY)
- [x] Stripe webhook configured and processing payments
- [x] Wix CMS integration working
- [x] End-to-end test with real customers (4 customers processed successfully)
- [x] Token monitoring and alerting system operational
- [x] Blue-green deployment pattern implemented

## Notes
- **System is LIVE and processing customer purchases**
- Deployed on containers CT181 (BLUE - LIVE) and CT182 (GREEN - STANDBY)
- HAProxy routing traffic to BLUE container
- Automated token refresh every 3 days (staggered: BLUE midnight, GREEN 6 AM)
- Email alerts configured for token expiration and refresh events
- 4 customers successfully processed in Wix CMS
- Manual processing capability tested (Patrick Frost - Cleveland Wrap)
- Zammad work moved to homelab-nexus via control plane governance
