# Cloudigan API Testing Guide

**Application:** Cloudigan API (Stripe-Datto Webhook)  
**Type:** API-only service (no UI)  
**Testing Approach:** Manual API testing + automated integration tests

---

## Testing Philosophy

**Cloudigan API is different from web apps:**
- ❌ No UI to test with Playwright
- ❌ No qa-01 container needed
- ✅ API endpoint testing
- ✅ Webhook event testing
- ✅ Integration testing (Stripe → Datto → Email)

**Testing happens on the containers themselves**, not on qa-01.

---

## Test Environments

### STANDBY (GREEN - CT182)
- **Purpose:** Pre-release testing
- **IP:** 10.92.3.182
- **Access:** `ssh root@10.92.3.182`
- **Test before:** Traffic switch (/release)

### LIVE (BLUE - CT181)
- **Purpose:** Production validation
- **IP:** 10.92.3.181
- **Access:** `ssh root@10.92.3.181`
- **Test after:** Traffic switch (smoke tests only)

---

## Manual Testing Checklist

### Pre-Release (STANDBY)

**1. Health Check**
```bash
ssh root@10.92.3.182 'curl http://localhost:3000/health'
# Expected: {"status":"ok"}
```

**2. Service Status**
```bash
ssh root@10.92.3.182 'systemctl status cloudigan-api'
# Expected: active (running)
```

**3. Log Check**
```bash
ssh root@10.92.3.182 'journalctl -u cloudigan-api -n 50 --no-pager'
# Expected: No errors, clean startup
```

**4. Environment Variables**
```bash
ssh root@10.92.3.182 'cat /opt/cloudigan-api/.env | grep -v SECRET | grep -v KEY'
# Verify configuration is correct
```

**5. Test Stripe Webhook (using Stripe CLI)**
```bash
# On your Mac (requires Stripe CLI installed)
stripe listen --forward-to https://api.cloudigan.net/webhook/stripe

# In another terminal, trigger test event
stripe trigger customer.subscription.created
```

**6. Verify Datto Site Creation**
- Check Datto RMM portal for new test site
- Verify site was created with correct name
- Check that site UID was returned

**7. Verify Email Delivery**
- Check email inbox for customer notification
- Verify download links are present
- Verify email formatting is correct

**8. Check OAuth Token**
```bash
ssh root@10.92.3.182 'cat /opt/cloudigan-api/.datto-token.json | jq .expires_at'
# Verify token is not expired
```

### Post-Release (LIVE)

**1. Smoke Test - Health Check**
```bash
curl https://api.cloudigan.net/health
# Expected: {"status":"ok"}
```

**2. Monitor Logs**
```bash
ssh root@[new-live-ip] 'journalctl -u cloudigan-api -f'
# Watch for 15 minutes, verify no errors
```

**3. Test Real Webhook**
- Process a real Stripe subscription (if safe)
- OR wait for next customer subscription
- Verify end-to-end flow works

---

## Automated Testing (Future)

### Integration Test Suite

**Location:** `/opt/cloudigan-api/tests/`

**Test Categories:**

1. **Unit Tests** (`tests/unit/`)
   - OAuth token management
   - Webhook signature verification
   - Email template rendering

2. **Integration Tests** (`tests/integration/`)
   - Stripe webhook → Datto site creation
   - Datto site creation → Email delivery
   - OAuth token refresh flow

3. **E2E Tests** (`tests/e2e/`)
   - Full webhook flow (Stripe → Datto → Email)
   - Error handling and retries
   - Rate limiting

**Test Framework:** Jest or Mocha  
**Run Command:** `npm test`

### Automated Test Execution

**On STANDBY before release:**
```bash
ssh root@10.92.3.182 'cd /opt/cloudigan-api && npm test'
```

**CI/CD Integration (future):**
- Run tests on every push to main
- Block deployment if tests fail
- Report test results to monitoring

---

## Test Data

### Stripe Test Events

**Use Stripe test mode:**
- Test API keys (sk_test_...)
- Test webhook secret (whsec_test_...)
- Stripe CLI for triggering events

**Test Event Types:**
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription change
- `customer.subscription.deleted` - Cancellation

### Datto Test Sites

**Naming convention:**
- Test sites: `TEST-[timestamp]`
- Easy to identify and clean up
- Delete after testing

### Email Testing

**Test email addresses:**
- Use your own email for testing
- Or use email testing service (Mailtrap, etc.)
- Verify formatting and links

---

## Testing Workflow Integration

### With /test-release

**For Cloudigan API, /test-release should:**

1. SSH into STANDBY container
2. Run manual test checklist (automated script)
3. Verify health, logs, configuration
4. Trigger test webhook event
5. Verify Datto site creation
6. Verify email delivery
7. Report pass/fail

**Command:**
```bash
/test-release cloudigan-api
```

**What it does:**
```bash
# Automated test script on STANDBY
ssh root@10.92.3.182 '/opt/cloudigan-api/tests/run-tests.sh'
```

### With /bump

**After tests pass:**
1. Update VERSION file
2. Update CHANGELOG.md
3. Commit and push
4. Ready for /release

### With /release

**Traffic switch:**
1. HAProxy switches from BLUE to GREEN
2. Run smoke tests on new LIVE
3. Monitor for 15 minutes
4. Report success

### With /sync

**After release:**
1. SSH into new STANDBY (old LIVE)
2. Pull latest code
3. Update .env if needed
4. Restart service
5. Verify health

---

## Test Automation Script

**Location:** `/opt/cloudigan-api/tests/run-tests.sh`

```bash
#!/bin/bash
# Automated test script for Cloudigan API

set -e

echo "🧪 Running Cloudigan API Tests..."

# 1. Health check
echo "✓ Health check..."
curl -f http://localhost:3000/health || exit 1

# 2. Service status
echo "✓ Service status..."
systemctl is-active cloudigan-api || exit 1

# 3. Log check (no errors in last 50 lines)
echo "✓ Log check..."
if journalctl -u cloudigan-api -n 50 | grep -i "error\|fatal\|exception"; then
    echo "❌ Errors found in logs"
    exit 1
fi

# 4. OAuth token check
echo "✓ OAuth token check..."
if [ -f /opt/cloudigan-api/.datto-token.json ]; then
    EXPIRES_AT=$(cat /opt/cloudigan-api/.datto-token.json | jq -r .expires_at)
    NOW=$(date +%s)000
    if [ "$EXPIRES_AT" -lt "$NOW" ]; then
        echo "❌ OAuth token expired"
        exit 1
    fi
fi

# 5. Environment check
echo "✓ Environment check..."
if [ ! -f /opt/cloudigan-api/.env ]; then
    echo "❌ .env file missing"
    exit 1
fi

echo "✅ All tests passed!"
exit 0
```

**Make executable:**
```bash
chmod +x /opt/cloudigan-api/tests/run-tests.sh
```

---

## Monitoring & Alerts

### Health Check Monitoring

**HAProxy health checks:**
- Endpoint: `GET /health`
- Frequency: Every 5 seconds
- Timeout: 2 seconds
- Failures before marking down: 3

### Log Monitoring

**Watch for:**
- Webhook signature failures
- Datto API errors
- Email delivery failures
- OAuth token expiration warnings

### Metrics to Track

1. **Webhook Processing:**
   - Success rate
   - Processing time
   - Error rate

2. **Datto API:**
   - Site creation success rate
   - API response time
   - OAuth token refresh frequency

3. **Email Delivery:**
   - Delivery success rate
   - Bounce rate
   - Time to deliver

---

## Troubleshooting Tests

### Health Check Fails

**Check:**
```bash
systemctl status cloudigan-api
journalctl -u cloudigan-api -n 100
```

### Webhook Test Fails

**Check:**
1. Stripe webhook secret is correct
2. Signature verification is working
3. Logs show webhook received
4. Datto API credentials are valid

### Email Test Fails

**Check:**
1. Email provider credentials (SendGrid or M365)
2. Email template is valid
3. Recipient email is correct
4. Logs show email sent

### OAuth Token Issues

**Check:**
```bash
cat /opt/cloudigan-api/.datto-token.json
# Verify expires_at is in the future
```

**Refresh manually if needed:**
```bash
cd /opt/cloudigan-api
node datto-auth.js
```

---

## Summary

**Cloudigan API testing is different:**
- ✅ API endpoint testing (not UI testing)
- ✅ Manual checklist + automated script
- ✅ Tests run on containers (not qa-01)
- ✅ Integration testing (Stripe → Datto → Email)
- ✅ Pre-release on STANDBY, smoke tests on LIVE

**Key principle:** Test the API integration flow, not the UI.

---

**Last Updated:** 2026-03-18  
**Status:** Active  
**Maintained By:** Cloudigan DevOps
