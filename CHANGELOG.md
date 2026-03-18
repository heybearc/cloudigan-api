# Cloudigan API Changelog

All notable changes to the Cloudigan API webhook service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- M365 OAuth email integration (GREEN/STANDBY only)
  - `m365-email.js` - M365 Graph API email sender
  - `m365-oauth-mailer.js` - OAuth token management for M365
  - Environment variables for M365 configuration

### Changed
- GREEN (CT182) now uses M365 OAuth for email delivery
- BLUE (CT181) continues using SendGrid for email delivery

### Notes
- M365 integration pending testing and release
- Both email providers functional on respective nodes

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
