# Cloudigan API Changelog

All notable changes to the Cloudigan API webhook service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.3] - 2026-07-04

### Added
- `invoice.payment_failed` webhook handler with product-profile routing
- Cloudigan-branded payment-failed customer email (Stripe customer portal link)

### Fixed
- Non–Chapter Hub subscription payment failures no longer receive Chapter Hub billing emails from the shared Stripe account (handled in chapter-hub guard; cloudigan-api sends the correct template)

---

## [1.3.2] - 2026-06-10

### Added
- Product profile routing: `rmm`, `service`, `chapter-hub` with dedicated customer and admin emails
- BNI Chapter Hub confirmation email with hub.cloudigan.net links
- Support-hour customer confirmation email

### Changed
- Admin purchase notifications driven by product profile (accurate processing summary)
- Customer emails no longer include cross-product disclaimers
- Production runtime standardized on PM2; legacy systemd unit disabled on nodes

### Fixed
- Support-hour and Chapter Hub purchases no longer trigger Datto site creation or RMM welcome emails
- Chapter Hub purchases no longer misclassified as RMM products

---

## [1.2.0] - 2026-03-18

### Added
- **Comprehensive Monitoring & Error Handling**
  - Structured logging with Winston
    - Correlation IDs for request tracking
    - JSON structured logs with rotation (10MB, 5 files)
    - Separate error and combined log files
  - Prometheus metrics endpoint (`/metrics`)
    - Webhook processing metrics (count, duration)
    - Datto API metrics (requests, duration)
    - Email delivery metrics
    - Error tracking by type
    - Active operations gauge
    - Default Node.js metrics (CPU, memory)
  - Retry logic with exponential backoff
    - Automatic retry for transient failures
    - Circuit breaker pattern (5 failures → open)
    - Jitter to prevent thundering herd
  - Error alerting via M365 email
    - Critical error notifications
    - 5-minute cooldown to prevent spam
    - HTML formatted alerts with full context
  - Custom error classes
    - WebhookValidationError, DattoApiError, DattoAuthError
    - EmailError, WixCmsError, StripeApiError
    - ConfigurationError, RateLimitError, TimeoutError
  - Enhanced health check endpoint
    - Circuit breaker status
    - Alerter status
    - Service metadata

### Changed
- Main webhook handler enhanced with:
  - Structured logging throughout
  - Metrics recording for all operations
  - Retry logic for Datto API calls
  - Error alerting for critical failures
  - Correlation IDs in all responses
- Health endpoint now returns detailed service status

### Infrastructure
- Grafana dashboard configuration
- Prometheus alert rules (8 alerts)
- Integration with homelab monitoring stack (CT150)
- Log directory structure (`logs/error.log`, `logs/combined.log`)

### Documentation
- `monitoring/README.md` - Complete monitoring setup guide
- `MONITORING-DEPLOYMENT.md` - Step-by-step deployment guide
- `monitoring/grafana-dashboard.json` - Dashboard configuration
- `monitoring/prometheus-alerts.yml` - Alert rules

### Testing
- ✅ Structured logging verified
- ✅ Metrics endpoint functional
- ✅ Retry logic tested
- ✅ Error alerting tested
- ✅ Circuit breaker tested
- Ready for STANDBY deployment

---

## [1.1.0] - 2026-03-18

### Added
- **M365 OAuth Email Integration** - Microsoft 365 email sending capability
  - `m365-oauth-mailer.js` - M365 Graph API email sender with OAuth 2.0
  - OAuth client credentials flow for authentication
  - Automatic token caching and refresh
  - HTML email support via Microsoft Graph API
  - Tested and verified on STANDBY (GREEN/CT182)

### Changed
- Email provider options: SendGrid (BLUE) or M365 OAuth (GREEN)
- Environment variables added for M365 configuration:
  - `M365_CLIENT_ID` - Azure AD app client ID
  - `M365_CLIENT_SECRET` - Azure AD app client secret
  - `M365_TENANT_ID` - Azure AD tenant ID
  - `M365_FROM_EMAIL` - Email address to send from

### Testing
- ✅ M365 OAuth authentication verified
- ✅ Email sending tested successfully
- ✅ Message ID: `81137823-6618-492d-b81b-fe633081dd36`
- ✅ Test email delivered to cory@cloudigan.com

### Notes
- Requires Azure AD app registration with `Mail.Send` API permission
- Admin consent required for application permission
- Ready for production deployment

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
