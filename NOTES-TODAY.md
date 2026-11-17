---
date: 2026-11-17
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Mid-day handoff: ship catalog/hosting fix to LIVE

### Discoveries / Notes
- Nov 14: `Windows Server Hosting - Internal` → misclassified `rmm` (see-jane-sell / Renvis); Datto site created
- Catalog maps Stripe product IDs; hosting/service/training skip Datto
- Stripe api.cloudigan.net webhook now has checkout.session.completed + invoice.payment_failed
- MCP was missing deployType on cloudigan-api → npm run build; fixed Cloudy-Work 706ce7b
- Datto API: no DELETE site; renamed orphan ZZZ-DELETE (0 devices)

### Decisions to Promote
- Prefer Stripe product ID catalog over name keywords for email/profile routing

### Blockers / Risks
- LIVE still on pre-catalog code until /ship

### Links / Commands
- Next: `/ship cloudigan-api` then `/sync`
- Datto UID: 84d6bf5d-3f0d-43f5-9ae7-583be31913cf
