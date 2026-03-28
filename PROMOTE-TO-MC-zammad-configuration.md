# Zammad Configuration - Promote to Mission Control

**Date:** 2026-03-28  
**Source:** cloudigan-api repository (incorrect location)  
**Destination:** homelab-nexus repository  
**Component:** Zammad Support Ticket System (CT186)

## Summary

Configured Zammad email signatures and notification triggers for support@cloudigan.com. This work belongs in the homelab infrastructure repository, not cloudigan-api.

## Zammad API Access

**Personal Access Token (PAT):**
```
doghcRUPpmvQ5QnzTm011XtdW7qI4jRJUWyjN8oPlLAs_OtVAt2_IKxLNC8hQbhZ
```

**API Endpoint:** `https://support.cloudigan.net/api/v1/`

**Token Location:** Created in Zammad web UI → Profile → Token Access

**Usage Example:**
```bash
curl -H "Authorization: Token doghcRUPpmvQ5QnzTm011XtdW7qI4jRJUWyjN8oPlLAs_OtVAt2_IKxLNC8hQbhZ" \
  https://support.cloudigan.net/api/v1/users/me
```

## Configuration Changes Made

### 1. Email Signatures

**Signature ID 2:** "Cloudigan Support" (with embedded logo)
- Active: true
- Contains: Cloudigan logo and contact information
- Size: ~15KB (logo embedded as base64)

**Signature ID 3:** "Cloudigan Simple" (text-only fallback)
- Active: true
- Plain text signature without logo

**Group Assignment:**
- Group: "Users" (ID: 1)
- Assigned Signature: ID 2 (logo version)

### 2. Auto-Reply Trigger

**Trigger ID 1:** "auto reply (on new tickets)"
- **Purpose:** Send auto-reply to customers when they create a ticket
- **Recipient:** Customer (article_last_sender)
- **Subject:** "Ticket Recieved [Ticket##{ticket.number}]"
- **Signature Issue:** `#{signature}` placeholder doesn't work in triggers
- **Solution Needed:** Embed signature HTML directly in trigger body

**Current Status:** Signature shows as `#{signature / no such object}` - needs to be fixed by embedding actual signature HTML

### 3. Admin Notification Trigger

**Trigger ID 4:** "Notify Admin on New Ticket"
- **Purpose:** Notify admin when new tickets are created
- **Recipient:** cory@cloudigan.com
- **Subject:** "New Support Ticket: #{ticket.title}"
- **Internal:** false (sends as external email)
- **Status:** Active

**Email Content:**
- Ticket number
- Customer name and email
- Ticket subject
- Message body
- Link to view ticket in Zammad

## Scripts Created (Need to Move)

Located in `/Users/cory/Projects/cloudigan-api/`:

1. **update-zammad-trigger.sh**
   - Updates auto-reply trigger with signature placeholder
   - Status: Needs revision (placeholder doesn't work)

2. **create-admin-notification-trigger.sh**
   - Creates admin notification trigger
   - Status: Working

3. **create-simple-signature.sh**
   - Creates simple text-only signature
   - Status: Working (created signature ID 3)

4. **update-autoreply-with-signature.sh**
   - Updates auto-reply with embedded signature
   - Status: Needs revision

5. **update-autoreply-with-logo.sh** (in /tmp/)
   - Embeds signature ID 2 (with logo) directly in trigger
   - Status: Not completed

## Outstanding Issues

### Issue 1: Auto-Reply Signature Not Displaying
**Problem:** `#{signature}` placeholder doesn't work in Zammad triggers  
**Solution:** Need to embed the actual signature HTML from signature ID 2 directly into the trigger body  
**Impact:** Customers receive auto-reply without signature

### Issue 2: Admin Notifications Not Received
**Problem:** Admin notification emails not arriving at cory@cloudigan.com  
**Possible Causes:**
- Microsoft Graph API configuration
- Email filtering/spam
- Trigger timing issue
**Status:** Needs testing and troubleshooting

## Next Steps for Mission Control

1. **Move scripts to homelab-nexus repository:**
   - Create directory: `applications/zammad/scripts/`
   - Move all `.sh` files from cloudigan-api
   - Update paths in scripts if needed

2. **Document Zammad configuration:**
   - Create: `applications/zammad/README.md`
   - Document API access, signatures, triggers
   - Include troubleshooting steps

3. **Fix auto-reply signature:**
   - Extract signature HTML from ID 2
   - Embed directly in trigger ID 1 body
   - Test with new ticket creation

4. **Test admin notifications:**
   - Send test email to support@cloudigan.com
   - Verify notification arrives at cory@cloudigan.com
   - Check spam folder if not received

5. **Clean up cloudigan-api repository:**
   - Remove all Zammad-related scripts
   - Remove this PROMOTE-TO-MC file after sync

## Files to Transfer

**From:** `/Users/cory/Projects/cloudigan-api/`  
**To:** `homelab-nexus/applications/zammad/scripts/`

- `update-zammad-trigger.sh`
- `create-admin-notification-trigger.sh`
- `create-simple-signature.sh`
- `update-autoreply-with-signature.sh`

**Method:** Pull from cloudigan-api repo during sync (files will be deleted from source after transfer)

## Security Notes

- **PAT Token:** Store securely in homelab secrets management
- **Token Scope:** Full API access to Zammad
- **Revocation:** Can be revoked in Zammad UI → Profile → Token Access
- **Rotation:** Consider rotating token periodically

## References

- **Zammad API Docs:** https://docs.zammad.org/en/latest/api/intro.html
- **Zammad Instance:** https://support.cloudigan.net
- **Container:** CT186 (Proxmox)
- **Email Channel:** Microsoft Graph API (support@cloudigan.com)

---

**Sync Instructions:**
1. Review this file in Mission Control
2. Create homelab-nexus structure for Zammad
3. Pull scripts from cloudigan-api
4. Update homelab documentation
5. Delete this file and scripts from cloudigan-api
6. Complete outstanding fixes in homelab context
