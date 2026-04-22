# Stripe-Datto Integration - Task State

**Last updated:** 2026-04-22

## Current Task
**Production Operations & Product Type Handling** - ACTIVE

### What I'm doing right now
Cloudigan API is deployed and operational on blue-green containers (CT181/CT182). System is processing customer purchases successfully. Recent work focused on implementing product type detection to handle RMM products vs standalone service products differently.

### Recent completions
- ✅ Implemented product type detection (RMM vs standalone service) - April 17
- ✅ Deployed product type detection to both BLUE and GREEN containers - April 17
- ✅ Fixed issue where technical support purchases incorrectly created Datto sites - April 17
- ✅ Promoted D-038 (Product Type Detection Pattern) to control plane - April 18
- ✅ Governance sync: pulled new patterns (email dark mode, Stripe device qty, Wix multi-state box) - April 18-22
- ✅ Migrated IMPLEMENTATION-PLAN.md to PLAN.md per D-035 - April 22

### Integration Flow (Working)
```
Customer purchases on Stripe
    ↓
Stripe processes payment
    ↓
Webhook → api.cloudigan.net/webhook/stripe
    ↓
Product Type Detection
    ↓
┌─────────────────────────────────────┬──────────────────────────────────┐
│ RMM Products                        │ Standalone Service Products      │
│ (Home Protect, Business, etc.)      │ (Technical Support Hours)        │
├─────────────────────────────────────┼──────────────────────────────────┤
│ ✅ Create Datto RMM site            │ ❌ Skip Datto site creation      │
│ ✅ Generate download links          │ ❌ Skip download links           │
│ ✅ Send welcome email               │ ❌ Skip welcome email            │
│ ✅ Insert into Wix CMS              │ ❌ Skip Wix CMS                  │
│ ✅ Send admin notification          │ ✅ Send admin notification       │
└─────────────────────────────────────┴──────────────────────────────────┘
```

## Next Steps

### Immediate
1. **Create service confirmation email** (optional, next feature)
   - Currently service product purchases receive no customer-facing email
   - Should confirm purchase and provide scheduling/contact instructions
   - Needs new email template in M365 mailer

2. **Verify Datto token auto-refresh ran**
   - Scheduled refresh was ~April 20 on BLUE, ~April 20 6AM on GREEN
   - Check `/var/log/datto-token-refresh.log` on both containers
   - Verify email alerts were received

3. **Monitor production webhooks**
   - Watch logs for product type detection working correctly
   - `journalctl -u cloudigan-api | grep -E "isRmmProduct|isStandaloneService"`

### Operational Maintenance
1. Token refresh happens automatically every 3 days
2. Product type detection is fully dynamic (keyword-based)
3. Health checks via HAProxy on both containers
4. Metrics available at `/metrics` endpoint
5. Logs via `journalctl -u cloudigan-api`

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

### Product Type Detection (New - April 17, 2026)
- **Detection Method**: Keyword-based analysis of Stripe product names
- **RMM Products**: All products except those with service keywords
  - Home Protect, Business Essentials, Complete Package, Management packages
  - Creates Datto site, sends welcome email, inserts into Wix CMS
- **Service Products**: Products containing keywords:
  - "technical support", "support hour", "consulting hour"
  - Skips Datto site, skips welcome email, skips Wix CMS
  - Admin notification still sent
- **Fully Dynamic**: No code changes needed for new products
- **Logging**: Product type classification logged for all purchases

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
2. **Datto RMM**: Site creation API (vidal-api.centrastage.net) - RMM products only
3. **Wix CMS**: Customer tracking - RMM products only

## Known Issues
None - system is operational and stable.

**Recent Issues Resolved:**
- ✅ Datto OAuth token expired (10 days old) - Fixed April 1, 2026
- ✅ Token monitoring alerts not sending - Fixed mailer initialization
- ✅ No automated token refresh - Implemented cron jobs on both containers

## Exact Next Command
**Check if token auto-refresh ran and containers are healthy:**
```bash
# Check if token refresh ran on schedule (~April 20)
ssh root@10.92.3.181 'cat /var/log/datto-token-refresh.log | tail -20'
ssh root@10.92.3.182 'cat /var/log/datto-token-refresh.log | tail -20'

# Check current token status
ssh root@10.92.3.181 'cd /opt/cloudigan-api && node -e "const t = require(\"./.datto-token.json\"); console.log(\"Expires:\", new Date(t.expires_at), \"Hours remaining:\", Math.round((t.expires_at - Date.now()) / 3600000))"'

# Verify both containers healthy
ssh root@10.92.3.181 'curl -s http://localhost:3000/health | grep status'
ssh root@10.92.3.182 'curl -s http://localhost:3000/health | grep status'
```

**Next feature (optional):** Create service confirmation email for technical support purchases.

## Success Criteria
- [x] Datto API authentication working
- [x] Site creation tested and confirmed
- [x] OAuth token auto-refresh implemented (cron jobs on both containers)
- [x] Webhook handler complete with product type detection
- [x] LXC architecture documented
- [x] Control plane governance created
- [x] Deployed to homelab (CT181 BLUE - LIVE, CT182 GREEN - STANDBY)
- [x] Stripe webhook configured and processing payments
- [x] Wix CMS integration working (RMM products only)
- [x] End-to-end test with real customers (4+ customers processed successfully)
- [x] Token monitoring and alerting system operational
- [x] Blue-green deployment pattern implemented
- [x] Product type detection implemented (RMM vs service products)
- [x] Service products skip Datto site creation correctly

## Notes
- **System is LIVE and processing customer purchases**
- Deployed on containers CT181 (BLUE - LIVE) and CT182 (GREEN - STANDBY)
- HAProxy routing traffic to BLUE container
- Automated token refresh every 3 days (staggered: BLUE midnight, GREEN 6 AM)
- Email alerts configured for token expiration and refresh events
- **Product type detection active** - RMM products create Datto sites, service products skip
- Dynamic detection based on product name keywords (no code changes needed for new products)
- 4+ customers successfully processed in Wix CMS
- Manual processing capability tested (Patrick Frost - Cleveland Wrap)
- Technical support purchases now handled correctly (skip Datto site creation)
