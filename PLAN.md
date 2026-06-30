# Cloudigan API Plan

**Last updated:** 2026-06-30  
**Current phase:** Phase 3 — Multi-Product Operations  
**Status:** v1.3.2 LIVE; stable — awaiting real purchase validation

---

## Current Phase

### Active Work
- [ ] **Monitor multi-product purchases** — Confirm BNI Chapter Hub and support-hour emails on LIVE
- [ ] **Restart Cursor MCP** — Pick up Cloudy-Work `9bf09eb` (port 3000, node-service deploy)

### Recently Completed
- ✅ **v1.3.2 release** — product profiles, BNI Chapter Hub emails, PM2 ops — 2026-06-10
- ✅ PM2 standardized; systemd disabled on CT181/182 — 2026-06-10
- ✅ MCP cloudigan-api config (`port: 3000`, `deployType: node-service`) — 2026-06-10
- ✅ Product profile system + profile-driven emails — 2026-05-28
- ✅ Blue-green infrastructure (CT181/182) — 2026-03-17

---

## Prioritized Backlog

### High Priority
- [ ] **Stripe product ID overrides** — `PRODUCT_ID_OVERRIDES` for edge-case product names (effort: S)

### Medium Priority
- [ ] **Admin Dashboard** — Webhook events, health (effort: L)
- [ ] **Rate Limiting** — Webhook endpoint (effort: S)
- [ ] **Automated Testing** — Webhook + integration tests (effort: M)

### Low Priority
- [ ] Analytics, customer portal, API docs

---

## Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| Cursor MCP may be stale | Automated ship/release fails | Restart MCP; manual PM2 deploy + HAProxy switch |
| Orphan Datto site (pre-fix Chapter Hub test) | Clutter in Datto | Manual cleanup if needed |

---

## User Feedback

**2026-05-28 (all fixed in v1.3.2):**
- Support-hour admin emails showed RMM fields — **fixed**
- Customer emails listed unrelated products — **fixed**
- Chapter Hub misclassified as RMM — **fixed**
- BNI Chapter Hub branding + hub.cloudigan.net — **fixed**

---

## Infrastructure

- **LIVE:** GREEN CT182 @ 10.92.3.182 — PM2 `cloudigan-api`, port 3000
- **STANDBY:** BLUE CT181 @ 10.92.3.181
- **Deploy:** `git pull && npm ci --omit=dev && pm2 restart cloudigan-api && pm2 save`
- **Public:** https://api.cloudigan.net

---

## Roadmap

### Phase 3 — In Progress
- ✅ Product profiles and emails
- ✅ PM2 + MCP deploy config
- [ ] Production validation on real purchases
- [ ] Admin dashboard, rate limiting, tests
