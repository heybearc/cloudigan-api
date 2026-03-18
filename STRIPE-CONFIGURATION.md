# Stripe Configuration Guide

**Application:** Cloudigan API  
**Purpose:** Configure Stripe webhooks for both test and production environments

---

## Overview

Cloudigan API supports both **test mode** (for development/testing) and **production mode** (for live customer transactions). Each mode requires separate Stripe API keys and webhook endpoints.

---

## Test Mode Configuration

**Purpose:** Testing webhook integration without affecting real customers or creating real Datto sites.

### Step 1: Get Test Mode API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Create Test Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://api.cloudigan.net/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
5. Click **"Add endpoint"**
6. Click on the newly created endpoint
7. Click **"Reveal"** under **Signing secret**
8. Copy the webhook signing secret (starts with `whsec_`)

### Step 3: Configure Test Environment Variables

On both containers (CT181 and CT182), update `.env`:

```bash
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_[your-test-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-test-webhook-secret]
```

### Step 4: Test with Stripe CLI (Optional)

For local testing, you can use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to https://api.cloudigan.net/webhook/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### Step 5: Test with Real Checkout

1. Create a test pricing table in Stripe (test mode)
2. Add test products with test prices
3. Complete a test checkout using test card: `4242 4242 4242 4242`
4. Verify webhook received and processed
5. Check Datto RMM for test site creation
6. Verify email delivery
7. Check Wix CMS for order record

---

## Production Mode Configuration

**Purpose:** Live customer transactions with real Datto sites and customer emails.

### Step 1: Get Production API Keys

1. Go to https://dashboard.stripe.com/apikeys (production mode)
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

**⚠️ CRITICAL:** Keep production keys secure. Never commit to git or share publicly.

### Step 2: Create Production Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks (production mode)
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://api.cloudigan.net/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
5. Click **"Add endpoint"**
6. Click on the newly created endpoint
7. Click **"Reveal"** under **Signing secret**
8. Copy the webhook signing secret (starts with `whsec_`)

### Step 3: Update Production Environment Variables

**On LIVE container (currently CT181 - BLUE):**

```bash
ssh root@10.92.3.181
cd /opt/cloudigan-api
nano .env
```

Update Stripe keys:

```bash
# Stripe Production Mode
STRIPE_SECRET_KEY=sk_live_[your-production-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-production-webhook-secret]
```

Save and restart:

```bash
systemctl restart cloudigan-api
```

**On STANDBY container (currently CT182 - GREEN):**

```bash
ssh root@10.92.3.182
cd /opt/cloudigan-api
nano .env
```

Update with same production keys, save, and restart:

```bash
systemctl restart cloudigan-api
```

### Step 4: Verify Production Configuration

1. Check service status:
   ```bash
   systemctl status cloudigan-api
   ```

2. Check logs for startup:
   ```bash
   journalctl -u cloudigan-api -n 50 --no-pager
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

### Step 5: Test Production Webhook

**Option A: Use Stripe Dashboard**

1. Go to https://dashboard.stripe.com/webhooks (production mode)
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Click **"Send test webhook"**
6. Verify webhook received in logs

**Option B: Real Transaction Test**

1. Create a small-value test product ($0.50 or $1.00)
2. Complete a real checkout with a real card
3. Verify entire flow:
   - Datto site created
   - Email sent
   - Wix CMS updated
   - Stripe metadata updated
4. **Immediately cancel/refund the test transaction**

---

## Switching Between Test and Production

### Current Mode Check

Check which mode is active:

```bash
ssh root@10.92.3.181 "cat /opt/cloudigan-api/.env | grep STRIPE_SECRET_KEY"
```

- If starts with `sk_test_`: **Test mode**
- If starts with `sk_live_`: **Production mode**

### Switch to Test Mode

1. Update `.env` on both containers with test keys
2. Restart services on both containers
3. Update Stripe pricing tables to use test mode
4. Use test cards for checkout

### Switch to Production Mode

1. Update `.env` on both containers with production keys
2. Restart services on both containers
3. Update Stripe pricing tables to use production mode
4. Real cards will be charged

---

## Environment Variable Template

### Test Mode `.env`

```bash
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_[your-test-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[test-webhook-secret]

# Datto RMM (same for both modes)
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=[your-api-key]
DATTO_API_SECRET_KEY=[your-api-secret-key]

# Wix CMS (same for both modes)
WIX_API_KEY=[from-mcp-server]
WIX_ACCOUNT_ID=e1c7c474-4d12-462d-b03a-6ad2fc003e59
WIX_SITE_ID=24a897d5-3e0f-43e2-9d90-dc53fec9cd4e

# M365 Email (same for both modes)
M365_CLIENT_ID=[your-client-id]
M365_TENANT_ID=[your-tenant-id]
M365_CLIENT_SECRET=[your-client-secret]
M365_FROM_EMAIL=noreply@cloudigan.com

# Monitoring
LOG_LEVEL=info
ALERT_EMAIL=cory@cloudigan.com
```

### Production Mode `.env`

```bash
# Stripe Production Mode
STRIPE_SECRET_KEY=sk_live_[your-production-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[production-webhook-secret]

# Datto RMM (same for both modes)
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=[your-api-key]
DATTO_API_SECRET_KEY=[your-api-secret-key]

# Wix CMS (same for both modes)
WIX_API_KEY=[from-mcp-server]
WIX_ACCOUNT_ID=e1c7c474-4d12-462d-b03a-6ad2fc003e59
WIX_SITE_ID=24a897d5-3e0f-43e2-9d90-dc53fec9cd4e

# M365 Email (same for both modes)
M365_CLIENT_ID=[your-client-id]
M365_TENANT_ID=[your-tenant-id]
M365_CLIENT_SECRET=[your-client-secret]
M365_FROM_EMAIL=noreply@cloudigan.com

# Monitoring
LOG_LEVEL=info
ALERT_EMAIL=cory@cloudigan.com
```

---

## Webhook URL Configuration

### Single Webhook URL for Both Modes

Stripe supports using the **same webhook URL** for both test and production modes:

- **Test Mode Webhook:** https://dashboard.stripe.com/test/webhooks
- **Production Mode Webhook:** https://dashboard.stripe.com/webhooks
- **Both use:** `https://api.cloudigan.net/webhook/stripe`

The webhook handler automatically detects which mode based on the API key used.

### Webhook Endpoint Details

- **URL:** `https://api.cloudigan.net/webhook/stripe`
- **Method:** POST
- **Events:** `checkout.session.completed`
- **API Version:** Latest (Stripe auto-updates)
- **Signature Verification:** Required (webhook secret)

---

## Security Best Practices

### API Key Security

1. **Never commit API keys to git**
   - Production keys especially
   - Use `.env` files (already in `.gitignore`)

2. **Rotate keys regularly**
   - Stripe allows creating new keys
   - Update `.env` on both containers
   - Restart services

3. **Use webhook signature verification**
   - Already implemented in webhook handler
   - Prevents unauthorized webhook calls

### Webhook Security

1. **Always verify webhook signatures**
   - Protects against spoofed webhooks
   - Already implemented in code

2. **Use HTTPS only**
   - HAProxy terminates SSL
   - Webhook URL uses `https://`

3. **Monitor webhook failures**
   - Check Stripe dashboard for failed webhooks
   - Review logs for errors

---

## Troubleshooting

### Webhook Not Received

1. **Check Stripe dashboard:**
   - Go to webhook endpoint in Stripe
   - Check "Recent events" tab
   - Look for delivery attempts and responses

2. **Check webhook URL:**
   - Verify URL is `https://api.cloudigan.net/webhook/stripe`
   - Ensure HTTPS (not HTTP)

3. **Check service status:**
   ```bash
   ssh root@10.92.3.181 'systemctl status cloudigan-api'
   ```

4. **Check logs:**
   ```bash
   ssh root@10.92.3.181 'journalctl -u cloudigan-api -f'
   ```

### Signature Verification Failed

1. **Check webhook secret:**
   - Verify `STRIPE_WEBHOOK_SECRET` in `.env`
   - Must match secret from Stripe dashboard

2. **Check Stripe mode:**
   - Test webhook secret only works with test API key
   - Production webhook secret only works with production API key

3. **Restart service after updating:**
   ```bash
   systemctl restart cloudigan-api
   ```

### Webhook Received But Processing Failed

1. **Check logs for specific error:**
   ```bash
   journalctl -u cloudigan-api -n 100 --no-pager | grep -i error
   ```

2. **Common issues:**
   - Datto API credentials invalid
   - M365 email credentials invalid
   - Wix CMS credentials invalid
   - Network connectivity issues

---

## Testing Checklist

### Test Mode Checklist

- [ ] Test API keys configured in `.env`
- [ ] Test webhook endpoint created in Stripe
- [ ] Test webhook secret configured
- [ ] Service restarted after configuration
- [ ] Health check passes
- [ ] Test checkout completed successfully
- [ ] Datto test site created
- [ ] Email delivered
- [ ] Wix CMS updated
- [ ] Stripe metadata updated

### Production Mode Checklist

- [ ] Production API keys configured in `.env`
- [ ] Production webhook endpoint created in Stripe
- [ ] Production webhook secret configured
- [ ] Service restarted on both containers
- [ ] Health check passes on both containers
- [ ] Small-value test transaction completed
- [ ] Real Datto site created
- [ ] Real email delivered
- [ ] Wix CMS updated
- [ ] Stripe metadata updated
- [ ] Test transaction refunded

---

## Quick Reference

**Check current mode:**
```bash
ssh root@10.92.3.181 "cat /opt/cloudigan-api/.env | grep STRIPE_SECRET_KEY | head -c 20"
```

**Update to production mode:**
```bash
# On both CT181 and CT182:
nano /opt/cloudigan-api/.env
# Update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
systemctl restart cloudigan-api
```

**Test webhook:**
```bash
# Watch logs while triggering test webhook from Stripe dashboard
journalctl -u cloudigan-api -f
```

---

**Last Updated:** 2026-03-18  
**Status:** Active  
**Maintained By:** Cloudigan DevOps
