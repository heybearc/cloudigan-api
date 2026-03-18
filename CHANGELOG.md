# Cloudigan API Changelog

All notable changes to the Cloudigan API webhook service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.1] - 2026-03-18

### Infrastructure
- Migrated to dedicated repository: `heybearc/cloudigan-api`
- Added control plane integration (`.cloudy-work` submodule)
- Proper git repository structure on containers
- Updated containers to use new repo structure
- Added release management documentation (CHANGELOG, VERSION, RELEASE-PROCESS)
- Added API testing guide (TESTING.md)

### Changed
- Repository location: `~/Projects/cloudigan-api/` (peer to other repos)
- Container path remains: `/opt/cloudigan-api/` (now proper git repo)
- Follows control plane "one repo = one app" standard

### Notes
- No code changes - infrastructure reorganization only
- Both containers (CT181/CT182) updated and verified
- M365 integration still on STANDBY, pending release

---

## [1.0.0] - 2026-03-16

### Added
- Initial Stripe to Datto RMM webhook integration
- Automated Datto site creation on Stripe subscription
- Playwright-based OAuth token management for Datto API
- SendGrid email integration for customer notifications
- Blue-green deployment architecture (CT181/CT182)
- HAProxy routing and health checks
- Webhook signature verification
- Environment-based configuration (.env)
- Comprehensive documentation suite

### Security
- Webhook signature verification (Stripe)
- OAuth token auto-refresh (Datto)
- Secret management via .env files (0600 permissions)
- Network isolation (containers only accessible via HAProxy)

### Infrastructure
- LXC containers: CT181 (BLUE/LIVE), CT182 (GREEN/STANDBY)
- HAProxy backend configuration
- Systemd service management
- Automated health checks
- Log rotation

### Documentation
- HOMELAB-ARCHITECTURE.md - Complete architecture overview
- NEXUS-HANDOFF.md - Deployment guide
- DEPLOYMENT.md - Deployment procedures
- QUICK-START.md - Quick reference
- INTEGRATION-COMPLETE.md - Integration status

---

## Version History

- **1.0.0** (2026-03-16) - Initial release with Stripe-Datto integration
- **Unreleased** - M365 OAuth email integration (STANDBY only)

---

## Current State

**LIVE (BLUE - CT181):**
- Version: 1.0.0
- Email: SendGrid
- Status: ✅ Production

**STANDBY (GREEN - CT182):**
- Version: 1.0.0 + M365 integration
- Email: M365 OAuth
- Status: ✅ Ready for testing

**Next Release:** Will include M365 OAuth email integration after testing
