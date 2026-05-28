# Cloudigan API Plan

**Last updated:** 2026-05-28  
**Current phase:** Phase 2 Complete — Production Operations  
**Status:** Production deployment operational; multi-product email routing live

---

## Current Phase

### Active Work
- [ ] **Monitor multi-product purchases** — Confirm BNI Chapter Hub and support-hour emails in production
- [ ] **MCP ops fix** — Add `port: 3000` to cloudigan-api in homelab-blue-green MCP (unblocks automated release)

### Recently Completed
- ✅ Product profile system (`rmm`, `service`, `chapter-hub`) — 2026-05-28
- ✅ Support-hour customer confirmation email — 2026-05-28
- ✅ BNI Chapter Hub profile + customer email (`hub.cloudigan.net`) — 2026-05-28
- ✅ Profile-driven admin purchase notifications — 2026-05-28
- ✅ Removed confusing cross-product disclaimers from customer emails — 2026-05-28
- ✅ Blue-green release + sync (both nodes `5835a38`) — 2026-05-28
- ✅ Stripe webhook integration (2026-03-17)
- ✅ Datto RMM API integration with OAuth automation (2026-03-17)
- ✅ Wix CMS integration for customer data storage (2026-03-17)
- ✅ Blue-green deployment infrastructure (CT181, CT182) (2026-03-17)
- ✅ Product type detection — keyword-based RMM vs service (2026-04-17)

---

## Prioritized Backlog

### High Priority
- [ ] **MCP cloudigan-api port fix** — Set `port: 3000` in homelab-blue-green MCP config (effort: S)
- [ ] **MCP deploy_to_standby skip build** — cloudigan-api has no `npm run build`; use systemd restart only (effort: S)

### Medium Priority
- [ ] **Stripe product ID overrides** — Populate `PRODUCT_ID_OVERRIDES` in `lib/product-profiles.js` for edge-case product names (effort: S)
- [ ] **Admin Dashboard** — View webhook events, customer downloads, system health (effort: L)
- [ ] **Rate Limiting** — Prevent webhook endpoint abuse (effort: S)
- [ ] **Automated Testing** — Webhook processing, Datto integration, Wix CMS (effort: M)

### Low Priority
- [ ] **Analytics Integration** — Conversion metrics, download rates (effort: M)
- [ ] **Customer Portal** — Self-service agent re-download (effort: XL)
- [ ] **Documentation** — API docs and integration guides (effort: S)

---

## Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| MCP health check uses port 3001 | Blocks automated `/release` via MCP | Manual HAProxy switch |
| MCP deploy runs `npm run build` | Deploy fails on STANDBY | SSH: `git pull && systemctl restart cloudigan-api` |
| Erroneous Datto site from pre-fix Chapter Hub test | Orphan site in Datto | Manual cleanup if needed |

---

## User Feedback (2026-05-28)

- Support-hour admin emails showed RMM fields (Datto UID, devices) and false automated actions — **fixed** via product profiles
- Customer emails should not describe what the product is *not* (RMM, Datto, etc.) — **fixed**
- Chapter Hub product misclassified as RMM — **fixed** with `chapter-hub` profile
- Product is **BNI Chapter Hub**; app URL is **hub.cloudigan.net** — **fixed**

---

## Roadmap

### Phase 1: Production Integration — Completed (Q1 2026)
Stripe → Datto → Wix → email automation

### Phase 2: Production Hardening — Completed (Mar 2026)
Error handling, MCP integration, monitoring

### Phase 3: Multi-Product Operations — In Progress
- ✅ Product profiles and profile-specific emails
- [ ] MCP ops fixes for cloudigan-api
- [ ] Admin dashboard, rate limiting, automated tests

### Phase 4: Platform Expansion — Future
Multi-product support, customer portal, analytics

---

## Notes

### Project Description
Stripe webhook integration API. Routes purchases by product profile:
1. **RMM** — Datto site, welcome email, Wix CMS, admin notification
2. **Service** — Service confirmation email, admin notification
3. **BNI Chapter Hub** — Chapter Hub welcome email (`hub.cloudigan.net`), admin notification

### Infrastructure
**Deployment:**
- BLUE: CT181 (10.92.3.181) — LIVE
- GREEN: CT182 (10.92.3.182) — STANDBY
- HAProxy routing via `api.cloudigan.net`
- Port: **3000** (not 3001)

**Key files:**
- `lib/product-profiles.js` — classification + admin action labels
- `lib/service-confirmation-email.js` — support-hour customer email
- `lib/chapter-hub-confirmation-email.js` — BNI Chapter Hub customer email
- `lib/admin-purchase-email.js` — profile-driven admin notifications
- `webhook-handler.js` — routing by `profileId`

### Effort Sizing Guide
- **S:** 1-4 hours | **M:** 1-2 days | **L:** 3-5 days | **XL:** 1+ weeks
