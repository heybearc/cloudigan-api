# NOTES Archive

Promoted entries from `NOTES-TODAY.md` on /end-day.

---

## 2026-07-04

### Focus
- Wendy Ellis payment-failed email sent wrong Chapter Hub template for Complete Package subscription

### Discoveries
- Chapter Hub webhook sent billing emails for any Stripe sub on shared account (Stripe customer email fallback)
- Complete Package checkout via Wix (`b-checkout-confirmation`), no Hub DB row or metadata
- Payment failed because no default payment method on customer/subscription (Amex on file but not default)

### Shipped
- cloudigan-api v1.3.3 — `invoice.payment_failed` + Cloudigan-branded template
- chapter-hub v0.29.2 — `isChapterHubManagedSubscription` guard
- Both LIVE + synced Jul 4; MCP switch failed for cloudigan-api (underscore backend names)

### Manual follow-ups (operator)
- Stripe: enable `invoice.payment_failed` on api.cloudigan.net webhook
- Wendy: fix PM on `cus_UE7HQ2lMMVcd2k`, retry invoice or cancel sub

### Links
- cloudigan-api release: https://github.com/heybearc/cloudigan-api/releases/tag/v1.3.3
- chapter-hub release: https://github.com/heybearc/chapter-hub/releases/tag/v0.29.2
