# Stripe-Datto Integration - Task State

**Last updated:** 2026-07-08

## Current Task
**v1.3.3 LIVE — validate payment-failed routing** - ACTIVE

### What I'm doing right now
v1.3.3 is LIVE on BLUE (CT181) with payment-failed email routing by product profile. Waiting on Stripe webhook event enablement and first real `invoice.payment_failed` in production to confirm Cloudigan-branded emails (not Chapter Hub).

### Recent completions
- ✅ **v1.3.3 shipped** — payment-failed handler + product templates; release + sync — Jul 4
- ✅ **Chapter Hub v0.29.2** — billing guard so non-Hub subs skip Hub emails — Jul 4
- ✅ **Wendy Ellis root cause** — Complete Package failure was Chapter Hub fallback on shared Stripe account
- ✅ **HAProxy switch to BLUE LIVE** — manual fix after MCP `switch_traffic` sed mismatch — Jul 4

### Integration Flow (Working)
```
checkout.session.completed → classifyProduct → rmm | service | chapter-hub → profile emails
invoice.payment_failed     → skip chapter-hub metadata → Cloudigan payment-failed email (rmm/service)
```

## Next Steps

### Immediate
1. **Stripe Dashboard** — add `invoice.payment_failed` to `api.cloudigan.net` webhook (if not done)
2. **Wendy billing** — set default PM on `cus_UE7HQ2lMMVcd2k`, retry or cancel `sub_1TFf2yInNVY2iy2yiErm40ex`
3. **Confirm next payment failure** — Cloudigan email (not “your chapter”) on LIVE

### Optional
- **Fix MCP `switch_traffic`** for cloudigan-api — HAProxy uses `cloudigan_api_blue` (underscore); MCP sed expects hyphen separator
- Verify next real BNI Chapter Hub / support-hour **checkout** emails still correct
- Clean up orphan Datto site from pre-fix Chapter Hub test purchase

## Deployment State
| Role | Server | IP | Commit | Version |
|------|--------|-----|--------|---------|
| **LIVE** | BLUE (CT181) | 10.92.3.181 | `ead8a96` | 1.3.3 |
| **STANDBY** | GREEN (CT182) | 10.92.3.182 | `ead8a96` | 1.3.3 |

HAProxy: `use_backend cloudigan_api_blue if is_cloudigan_api`

## Known Issues
- **MCP switch_traffic (cloudigan-api):** `getHaProxyBackendSeparator` returns `-` but HAProxy backends are `cloudigan_api_blue/green` (underscore). Jul 4 release required manual HAProxy sed on CT136.
- **Stripe webhook event:** `invoice.payment_failed` must be enabled on production webhook endpoint for payment-failed emails to fire.

## Exact Next Command
Verify LIVE version and watch for payment-failed events:
```bash
curl -sf https://api.cloudigan.net/health | jq '{version,hostname}'
ssh -i ~/.ssh/homelab_root root@10.92.3.181 'pm2 logs cloudigan-api --lines 0 | grep -E "payment_failed|Payment failed"'
```

Preview payment-failed template:
```bash
ssh -i ~/.ssh/homelab_root root@10.92.3.181 'cd /opt/cloudigan-api && node scripts/test-payment-failed-email.js --send'
```

## Success Criteria
- [x] v1.3.3 LIVE on both nodes
- [x] Payment-failed routing implemented (cloudigan-api + chapter-hub guard)
- [ ] Stripe webhook includes `invoice.payment_failed`
- [ ] Verified production payment-failed email (non–Chapter Hub product)
