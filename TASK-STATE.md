# Stripe-Datto Integration - Task State

**Last updated:** 2026-11-17

## Current Task
**Ship catalog/hosting email routing to LIVE** - READY

### What I'm doing right now
Product-catalog routing (`hosting` profile + Stripe product IDs) is on **STANDBY** (`0fa50f7`). LIVE is still BLUE without that fix. MCP deploy/switch bugs fixed in Cloudy-Work `706ce7b`. Next: `/ship cloudigan-api` then `/sync`.

### Recent completions
- ✅ **Product catalog + hosting profile** — `Windows Server Hosting - Internal` no longer RMM/Datto/welcome — STANDBY `0fa50f7` — Nov 16
- ✅ **Stripe webhook** — enabled `invoice.payment_failed` on `api.cloudigan.net` endpoint — Nov 16
- ✅ **MCP deployType restored** — Cloudy-Work `706ce7b`; STANDBY deploy via `npm ci` verified — Nov 16
- ✅ **MCP HAProxy underscore** for `cloudigan_api_*` backends — Cloudy-Work `706ce7b`
- ✅ **Datto orphan flagged** — site `84d6bf5d…` renamed `ZZZ-DELETE — Hosting miscreate (Renvis)` (0 devices; API cannot DELETE) — Nov 16
- ✅ **v1.3.3** payment-failed routing shipped — Jul 4

### Integration Flow (Working on STANDBY)
```
checkout.session.completed → resolveProduct(catalog ID) → rmm | service | hosting | chapter-hub
invoice.payment_failed     → skip chapter-hub → Cloudigan payment-failed email
```

## Next Steps

### Immediate
1. **`/ship cloudigan-api`** — bump (likely 1.3.4), release notes, switch LIVE to GREEN with catalog fix, then `/sync`
2. **Datto UI** — delete site named `ZZZ-DELETE — Hosting miscreate (Renvis)` (UID `84d6bf5d-3f0d-43f5-9ae7-583be31913cf`)

### Optional
- Confirm next hosting/service purchase gets catalog confirmation (not RMM welcome)
- Confirm next payment failure email is Cloudigan-branded

## Deployment State
| Role | Server | IP | Commit | Version |
|------|--------|-----|--------|---------|
| **LIVE** | BLUE (CT181) | 10.92.3.181 | pre-catalog (v1.3.3) | 1.3.3 |
| **STANDBY** | GREEN (CT182) | 10.92.3.182 | `0fa50f7` | 1.3.3 + catalog |

HAProxy: `use_backend cloudigan_api_blue if is_cloudigan_api`

## Known Issues
- **LIVE lagging STANDBY** — catalog/hosting fix not released yet
- **Datto site delete** — API has no DELETE site; finish purge in Datto UI

## Exact Next Command
```
/ship cloudigan-api
```
Then after LIVE healthy: `/sync`

## Success Criteria
- [x] Catalog routing on STANDBY
- [x] Stripe `invoice.payment_failed` enabled
- [x] MCP node-service deploy verified
- [ ] Catalog fix LIVE (ship)
- [ ] Datto ZZZ-DELETE site removed in UI
