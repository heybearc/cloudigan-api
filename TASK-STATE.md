# Stripe-Datto Integration - Task State

**Last updated:** 2026-05-28

## Current Task
**Product-profile email routing (RMM / service / BNI Chapter Hub)** - COMPLETE — monitoring

### What I'm doing right now
Profile-driven purchase emails are live on both nodes. Next real purchases should be watched to confirm correct routing (no Datto for service/Chapter Hub, correct customer templates).

### Recent completions
- ✅ Product profiles: `rmm`, `service`, `chapter-hub` with profile-driven admin + customer emails — May 28
- ✅ Support-hour customer confirmation + fixed admin notifications (no false Datto/Wix actions) — May 28
- ✅ BNI Chapter Hub profile — skips RMM provisioning, dedicated customer email — May 28
- ✅ Removed cross-product disclaimers from customer emails (no "not RMM" language) — May 28
- ✅ BNI Chapter Hub branding + `hub.cloudigan.net` links — May 28
- ✅ Released to LIVE (BLUE) and synced GREEN — both on `5835a38` — May 28

### Integration Flow (Working)
```
Customer purchases on Stripe
    ↓
Stripe processes payment
    ↓
Webhook → api.cloudigan.net/webhook/stripe
    ↓
Product Profile (classifyProduct)
    ↓
┌──────────────────────┬─────────────────────────┬──────────────────────────────┐
│ RMM (default)        │ service                 │ chapter-hub                  │
│ Home Protect, etc.   │ Support hours           │ BNI Chapter Hub              │
├──────────────────────┼─────────────────────────┼──────────────────────────────┤
│ ✅ Datto site        │ ❌ Skip Datto           │ ❌ Skip Datto                │
│ ✅ Welcome email     │ ✅ Service confirmation │ ✅ BNI Chapter Hub email     │
│ ✅ Wix CMS           │ ❌ Skip Wix             │ ❌ Skip Wix                  │
│ ✅ Admin notification│ ✅ Admin notification   │ ✅ Admin notification        │
└──────────────────────┴─────────────────────────┴──────────────────────────────┘
```

## Next Steps

### Immediate
1. **Verify next real BNI Chapter Hub purchase**
   - Customer email: BNI Chapter Hub branding, button → `hub.cloudigan.net`
   - Admin email: processing summary only (no Datto/Wix false positives)
   - No Datto site created

2. **Verify support-hour purchase still correct**
   - Service confirmation to customer; admin shows service actions only

3. **Fix MCP health check port for cloudigan-api** (ops)
   - MCP defaults to port 3001; app runs on 3000
   - Blocks `switch_traffic` / deploy health checks — manual HAProxy switch used for release

### Optional cleanup
- Review/clean up Datto site created by Chapter Hub test purchase before profile fix (if still present)

## Deployment State
| Role | Server | IP | Commit |
|------|--------|-----|--------|
| **LIVE** | BLUE (CT181) | 10.92.3.181 | `5835a38` |
| **STANDBY** | GREEN (CT182) | 10.92.3.182 | `5835a38` |

HAProxy: `use_backend cloudigan_api_blue if is_cloudigan_api`

## Known Issues
- None blocking production.

**Ops notes:**
- **Runtime:** PM2 process `cloudigan-api` on both nodes (legacy `cloudigan-api.service` disabled).
- **Deploy:** `mcp0_deploy_to_standby(app='cloudigan-api')` or `git pull && npm ci --omit=dev && pm2 restart cloudigan-api`.

## Exact Next Command
Watch logs on next purchase:
```bash
ssh -i ~/.ssh/homelab_root root@10.92.3.181 'journalctl -u cloudigan-api -f | grep -E "profileId|chapter-hub|service|isRmmProduct"'
```

Or send test Chapter Hub emails on LIVE:
```bash
ssh -i ~/.ssh/homelab_root root@10.92.3.181 'cd /opt/cloudigan-api && node scripts/test-chapter-hub-emails.js'
```

## Success Criteria
- [x] Product profiles route RMM / service / chapter-hub correctly
- [x] Customer emails product-specific (no cross-product disclaimers)
- [x] BNI Chapter Hub uses `hub.cloudigan.net`
- [x] Deployed and released to LIVE
- [ ] Verified with next real Chapter Hub purchase
