# Cloudigan API Plan

**Last updated:** 2026-07-08  
**Current phase:** Phase 3 — Multi-Product Operations  
**Status:** v1.3.3 LIVE on BLUE — payment-failed routing shipped

---

## Current Phase

### Active Work
- [ ] **Enable Stripe `invoice.payment_failed`** on production webhook endpoint
- [ ] **Validate payment-failed emails** on first real non–Chapter Hub failure
- [ ] **Monitor checkout emails** — Chapter Hub and support-hour purchases on LIVE

### Recently Completed
- ✅ **v1.3.3 release** — `invoice.payment_failed` handler, Cloudigan-branded payment-failed email — 2026-07-04
- ✅ **Chapter Hub v0.29.2** (sibling repo) — Hub billing emails only for Hub-managed subscriptions — 2026-07-04
- ✅ **v1.3.2 release** — product profiles, BNI Chapter Hub emails, PM2 ops — 2026-06-10
- ✅ PM2 standardized; systemd disabled on CT181/182 — 2026-06-10

---

## Prioritized Backlog

### High Priority
- [ ] **Fix MCP HAProxy separator for cloudigan-api** — underscore backends (`cloudigan_api_blue`) vs MCP sed hyphen (effort: S)
- [ ] **Stripe product ID overrides** — `PRODUCT_ID_OVERRIDES` for edge-case product names (effort: S)

### Medium Priority
- [ ] **Admin Dashboard** — Webhook events, health (effort: L)
- [ ] **Rate Limiting** — Webhook endpoint (effort: S)
- [ ] **Automated Testing** — Webhook + integration tests (effort: M)

### Low Priority
- [ ] Analytics, customer portal, API docs
- [ ] Long term: separate Stripe accounts/webhooks per product line

---

## Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| MCP `switch_traffic` cloudigan-api | Release switch fails verify step | Manual HAProxy sed on CT136 (`cloudigan_api_blue`) |
| Stripe webhook missing event | Payment-failed emails never fire | Add `invoice.payment_failed` in Stripe Dashboard |
| Orphan Datto site (pre-fix Chapter Hub test) | Clutter in Datto | Manual cleanup if needed |

---

## User Feedback

**2026-07-04 (fixed in v1.3.3 + chapter-hub v0.29.2):**
- Complete Package payment failure sent Chapter Hub “your chapter” email — **fixed** (Hub guard + cloudigan-api handler)

**2026-05-28 (fixed in v1.3.2):**
- Support-hour admin emails showed RMM fields — **fixed**
- Customer emails listed unrelated products — **fixed**
- Chapter Hub misclassified as RMM — **fixed**
- BNI Chapter Hub branding + hub.cloudigan.net — **fixed**

---

## Infrastructure

- **LIVE:** BLUE CT181 @ 10.92.3.181 — PM2 `cloudigan-api`, port 3000, v1.3.3
- **STANDBY:** GREEN CT182 @ 10.92.3.182 — v1.3.3
- **Deploy:** MCP `deploy_to_standby` or `git pull && npm ci --omit=dev && pm2 restart cloudigan-api`
- **Public:** https://api.cloudigan.net

---

## Roadmap

### Phase 3 — In Progress
- ✅ Product profiles and checkout emails
- ✅ Payment-failed emails by product profile (v1.3.3)
- [ ] Production validation on real payment failures and purchases
- [ ] Admin dashboard, rate limiting, tests
