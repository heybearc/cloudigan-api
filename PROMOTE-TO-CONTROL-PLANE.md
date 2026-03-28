# Promote to Control Plane

This file is used by `/sync-governance` workflow to promote discoveries to the control plane.

---

## Documentation: Zammad Support System Configuration
**Type:** documentation
**Target:** docs/infrastructure/ZAMMAD-CONFIGURATION.md
**Category:** infrastructure
**Date:** 2026-03-28

**Purpose:** Document Zammad API configuration, signatures, triggers, and notification setup for support@cloudigan.com ticket system

**Content Summary:** Complete reference for Zammad configuration including API access, email signatures with logo, auto-reply triggers, admin notifications, and troubleshooting steps

**Key Points:**
- Zammad API PAT token for automation and configuration
- Email signature setup (ID 2 with logo, ID 3 simple fallback)
- Auto-reply trigger configuration with signature embedding
- Admin notification trigger for new ticket alerts
- Microsoft Graph API email integration
- Outstanding issues: signature placeholder in triggers, admin notification delivery

**Related Docs:** 
- Container CT186 (Proxmox)
- Microsoft 365 Graph API integration
- Email routing: support@cloudigan.com

**Files to Transfer:**
The following scripts should be moved from cloudigan-api to homelab-nexus/applications/zammad/scripts/:
- update-zammad-trigger.sh
- create-admin-notification-trigger.sh
- create-simple-signature.sh
- update-autoreply-with-signature.sh

**Source File:** PROMOTE-TO-MC-zammad-configuration.md (contains full details)

---

