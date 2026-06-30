# Stripe-Datto Integration - Task State

**Last updated:** 2026-06-30

## Current Task
**v1.3.2 production — monitor real purchases** - ACTIVE

### What I'm doing right now
v1.3.2 remains stable on both nodes (verified 2026-06-30). Still waiting on a real BNI Chapter Hub or support-hour purchase to confirm production email routing.

### Recent completions
- ✅ **v1.3.2 shipped** — release + sync; both nodes on `8c1ba7f` — Jun 10
- ✅ PM2 standardized; legacy systemd disabled on both nodes — Jun 10
- ✅ MCP deploy config: `node-service`, port 3000, `webhook-handler.js` — Jun 10
- ✅ Product profiles + BNI Chapter Hub emails (`hub.cloudigan.net`) — May 28
- ✅ Removed cross-product disclaimers from customer emails — May 28

### Integration Flow (Working)
```
Stripe webhook → classifyProduct → rmm | service | chapter-hub → profile-specific actions + emails
```

## Next Steps

### Immediate
1. **Verify next real BNI Chapter Hub purchase** — BNI branding, `hub.cloudigan.net`, no Datto site
2. **Verify support-hour purchase** — service confirmation + accurate admin summary
3. **Restart homelab-blue-green MCP in Cursor** — local MCP still uses old config (port 3001, npm build); Cloudy-Work `9bf09eb` has the fix

### Optional
- Clean up orphan Datto site from pre-fix Chapter Hub test purchase

## Deployment State
| Role | Server | IP | Commit | Version |
|------|--------|-----|--------|---------|
| **LIVE** | GREEN (CT182) | 10.92.3.182 | `8c1ba7f` | 1.3.2 |
| **STANDBY** | BLUE (CT181) | 10.92.3.181 | `8c1ba7f` | 1.3.2 |

HAProxy: `use_backend cloudigan_api_green if is_cloudigan_api`

## Known Issues
- **Cursor MCP stale:** Running MCP server may not have Cloudy-Work `9bf09eb` yet — `deploy_to_standby` / `switch_traffic` fail until MCP restarted or path updated. Manual deploy works: `git pull && npm ci --omit=dev && pm2 restart cloudigan-api`.

## Exact Next Command
Watch logs on LIVE for next purchase:
```bash
ssh -i ~/.ssh/homelab_root root@10.92.3.182 'pm2 logs cloudigan-api --lines 0 | grep -E "profileId|chapter-hub|service"'
```

Or test emails on LIVE:
```bash
ssh -i ~/.ssh/homelab_root root@10.92.3.182 'cd /opt/cloudigan-api && node scripts/test-chapter-hub-emails.js'
```

## Success Criteria
- [x] v1.3.2 LIVE on both nodes
- [x] PM2 runtime, systemd disabled
- [ ] Verified with next real Chapter Hub purchase
