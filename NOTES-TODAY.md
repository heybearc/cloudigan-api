---
date: 2026-05-28
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Product-profile email routing for support hours and BNI Chapter Hub

### Discoveries / Notes
- MCP health checks fail for cloudigan-api (port 3001 vs 3000) — manual HAProxy release required
- MCP deploy_to_standby fails on `npm run build` — use systemd restart instead

### Decisions to Promote
- D-050 product profiles (promoted to DECISIONS.md)
- D-051 MCP port 3000 (promoted to DECISIONS.md)

### Blockers / Risks
- None blocking production; MCP ops fixes are backlog

### Links / Commands
- LIVE: BLUE 10.92.3.181 commit `5835a38`
- Test emails: `node scripts/test-chapter-hub-emails.js`
