# Cloudigan API Release Process

This document outlines the release workflow for the Cloudigan API webhook service.

---

## Overview

**Application:** Cloudigan API (Stripe-Datto Webhook)  
**Deployment:** Blue-Green LXC Containers  
**Testing:** Manual API testing (no UI)  
**Versioning:** Semantic Versioning (MAJOR.MINOR.PATCH)

---

## Release Workflow

### 1. Development & Testing

**Work on STANDBY (GREEN) container:**
```bash
# SSH into STANDBY
ssh root@10.92.3.182

# Make changes
cd /opt/cloudigan-api
# Edit files, update .env, etc.

# Restart service
systemctl restart cloudigan-api

# Check logs
journalctl -u cloudigan-api -f
```

**Test manually:**
- Send test Stripe webhook events
- Verify Datto site creation
- Check email delivery
- Review logs for errors

### 2. Document Changes

**Update CHANGELOG.md:**
```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- What changed

### Fixed
- Bug fixes
```

**Track in this file:**
- What was added/changed/fixed
- Testing performed
- Known issues (if any)

### 3. Version Bump (when ready to release)

**Determine version type:**
- **MAJOR** (x.0.0): Breaking changes, API changes
- **MINOR** (0.x.0): New features, new functionality
- **PATCH** (0.0.x): Bug fixes, small improvements

**Update VERSION file:**
```bash
echo "X.Y.Z" > VERSION
```

**Update CHANGELOG.md:**
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Change 1

### Fixed
- Bug fix 1
```

**Commit version bump:**
```bash
git add VERSION CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z

Changes:
- Feature 1
- Feature 2
- Bug fix 1"
git push origin main
```

### 4. Release (Traffic Switch)

**Use homelab MCP to switch traffic:**
```
/release cloudigan-api
```

Or manually via HAProxy:
```bash
# Switch backend from BLUE to GREEN
# (HAProxy config update + reload)
```

**Verify switch:**
```bash
# Check deployment status
# Use homelab MCP: get_deployment_status cloudigan-api

# Test LIVE endpoint
curl https://api.cloudigan.net/health
```

### 5. Sync STANDBY

**After successful release, sync old LIVE (now STANDBY) with new code:**
```bash
# SSH into new STANDBY (old LIVE)
ssh root@10.92.3.181

# Pull latest code
cd /opt/cloudigan-api
git pull origin main

# Update dependencies (if needed)
npm install

# Update .env (if needed)
# Copy from new LIVE or update manually

# Restart service
systemctl restart cloudigan-api

# Verify health
curl http://localhost:3000/health
```

---

## Testing Checklist

**See TESTING.md for complete testing guide.**

Since there's no UI, testing is API-focused (not qa-01 Playwright testing):

### Pre-Release Testing (on STANDBY)

**Automated test script:**
```bash
ssh root@10.92.3.182 '/opt/cloudigan-api/tests/run-tests.sh'
```

**Or use /test-release workflow:**
```bash
/test-release cloudigan-api
```

**Manual checklist:**
- [ ] Health check responds: `curl http://10.92.3.182:3000/health`
- [ ] Service is running: `systemctl status cloudigan-api`
- [ ] Logs show no errors: `journalctl -u cloudigan-api -n 50`
- [ ] Test Stripe webhook with test event (Stripe CLI)
- [ ] Verify Datto site creation (check Datto portal)
- [ ] Verify email delivery (check inbox)
- [ ] Check OAuth token not expired

### Post-Release Testing (on new LIVE)

- [ ] Health check via HAProxy: `curl https://api.cloudigan.net/health`
- [ ] Service responding to webhooks
- [ ] Monitor logs for 15 minutes: `ssh root@[new-live-ip] journalctl -u cloudigan-api -f`
- [ ] No error spikes in logs
- [ ] Email delivery working

**Note:** Cloudigan API is API-only, so it does NOT use qa-01 container or Playwright testing. Tests run on the containers themselves.

---

## Rollback Procedure

**If issues detected after release:**

1. **Switch traffic back immediately:**
   ```
   /release cloudigan-api --emergency
   ```
   Or manually switch HAProxy backend

2. **Investigate on old LIVE (now STANDBY):**
   ```bash
   ssh root@[standby-ip]
   journalctl -u cloudigan-api -n 100
   ```

3. **Fix issues on STANDBY**

4. **Test thoroughly**

5. **Attempt release again**

---

## Version History Tracking

**Current Versions:**
- **LIVE (BLUE):** Check `ssh root@10.92.3.181 cat /opt/cloudigan-api/VERSION`
- **STANDBY (GREEN):** Check `ssh root@10.92.3.182 cat /opt/cloudigan-api/VERSION`

**Release History:**
- Track in CHANGELOG.md
- Git tags for each release: `git tag vX.Y.Z`

---

## Emergency Contacts

**If webhook service fails:**
- Check HAProxy status
- Check container status (Proxmox)
- Review logs on both containers
- Verify Stripe webhook configuration
- Verify Datto API connectivity

**Monitoring:**
- HAProxy health checks (every 5 seconds)
- Service logs: `journalctl -u cloudigan-api`
- Datto API status
- Stripe webhook delivery logs

---

## Notes

- **No automated tests** - All testing is manual via API calls
- **No UI** - Changes are not visible to end users
- **API-only** - Focus testing on webhook processing and integrations
- **Blue-green deployment** - Always test on STANDBY before switching traffic
- **Version tracking** - Use VERSION file + CHANGELOG.md + git tags

---

**Last Updated:** 2026-03-18  
**Maintained By:** Cloudigan DevOps
