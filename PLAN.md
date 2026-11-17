# Cloudigan API Plan

**Last updated:** 2026-11-17  
**Current phase:** Phase 3 — Multi-Product Operations  
**Status:** Catalog/hosting fix on STANDBY — awaiting `/ship` to LIVE

---

## Current Phase

### Active Work
- [ ] **`/ship cloudigan-api`** — release product catalog + hosting profile to LIVE
- [ ] **Delete Datto orphan** in UI (`ZZZ-DELETE — Hosting miscreate (Renvis)`)
- [ ] **Validate** next hosting/service checkout + payment-failed emails on LIVE

### Recently Completed
- ✅ **Product catalog** (`lib/product-catalog.js`) + `hosting` profile; confirmation emails use Stripe product name/description/nextSteps — 2026-11-16
- ✅ **Stripe** `invoice.payment_failed` enabled on api.cloudigan.net webhook — 2026-11-16
- ✅ **MCP** cloudigan-api `deployType: node-service` + underscore HAProxy separator — Cloudy-Work `706ce7b` — 2026-11-16
- ✅ **v1.3.3** payment-failed handler — 2026-07-04
- ✅ **Chapter Hub v0.29.2** billing guard — 2026-07-04

---

## Prioritized Backlog

### High Priority
- [ ] Keep `lib/product-catalog.js` in sync when new Stripe products are added

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
| LIVE without catalog fix | Hosting still RMM on LIVE | `/ship` |
| Datto API cannot delete sites | Orphan remains until UI delete | Renamed ZZZ-DELETE |

---

## User Feedback

**2026-11-16:** Windows Server Hosting sent RMM subscription email — **fixed on STANDBY**, ship pending  
**2026-07-04:** Complete Package payment failure → Chapter Hub email — **fixed** (v1.3.3 + Hub guard)

---

## Infrastructure

- **LIVE:** BLUE CT181 — v1.3.3 (pre-catalog)
- **STANDBY:** GREEN CT182 — `0fa50f7` (catalog)
- **Public:** https://api.cloudigan.net
