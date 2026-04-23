# Stripe-Datto Integration - Task State

**Last updated:** 2026-04-22 (evening)

## Current Task
**Production Operations & Product Type Handling** - ACTIVE

### What I'm doing right now
Cloudigan API is deployed and operational on blue-green containers (CT181/CT182). Fixed two bugs in purchase notification emails: device quantity was always showing 1 (quantity not populated on unexpanded Stripe session), and product name was hardcoded instead of using actual Stripe product name.

### Recent completions
- ✅ Fixed device quantity always showing 1 in purchase emails - April 22
- ✅ Fixed product name hardcoded in admin notification (now uses actual Stripe product name) - April 22
- ✅ Synced D-039 AI usage governance rules from control plane - April 22
- ✅ Implemented product type detection (RMM vs standalone service) - April 17
- ✅ Deployed product type detection to both BLUE and GREEN containers - April 17

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
1. **Verify email fix with next real purchase**
   - Confirm admin notification shows correct product name and quantity
   - Confirm customer welcome email shows correct device count
   - Watch logs: `journalctl -u cloudigan-api -f | grep -E "deviceQuantity|productName"`

2. **Create service confirmation email** (next feature)
   - Customers who buy technical support hours receive no email at all
   - Should confirm purchase and provide scheduling/contact instructions
   - Needs new email template + `sendServiceConfirmationEmail()` function

3. **Monitor production webhooks**
   - `journalctl -u cloudigan-api | grep -E "isRmmProduct|isStandaloneService|deviceQuantity"`

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
**Verify email fix is working in production:**
```bash
# Tail logs on LIVE container and trigger a test purchase
ssh root@10.92.3.181 'journalctl -u cloudigan-api -f | grep -E "deviceQuantity|productName|Extracted customer"'
```

**Next feature:** Build `sendServiceConfirmationEmail()` in `m365-email.js` for technical support purchase confirmations.

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
