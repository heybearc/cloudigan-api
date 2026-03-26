# Manual Token Renewal Process

## Reality Check

**Datto's API does NOT support automatic token renewal.** All tokens expire in 100 hours (4.16 days) and must be manually regenerated.

- ❌ No `refresh_token` support
- ❌ No `client_credentials` grant type
- ❌ No API key-only authentication
- ✅ OAuth authorization code flow ONLY (requires manual login)

---

## What IS Automated

Even though token generation is manual, we have **full monitoring and alerting**:

### ✅ Automated Monitoring (Every Hour)
- Checks token expiration
- Updates Prometheus metrics
- Tracks hours remaining

### ✅ Automated Alerts (Email)
- **24-hour warning**: When < 24 hours remain
- **Expiration alert**: When token expires
- **Renewal reminders**: Sent to `cory@cloudigan.com`

### ✅ Automated Metrics (Grafana)
- Real-time token expiration gauge
- Visual alerts when token is expiring
- Historical tracking

---

## Manual Renewal Workflow (Every 4 Days)

### **Step 1: Get New Token in Postman**

1. Open Postman
2. Go to your Datto RMM collection
3. Click **Authorization** tab
4. Click **Get New Access Token**
5. Log in with Datto credentials
6. Copy the **Access Token** (the long eyJhbG... string)

### **Step 2: Update Token on Server**

```bash
ssh pve
pct enter 181
cd /opt/cloudigan-api
node update-token-from-postman.js
# Paste the token when prompted
```

**That's it!** The script will:
- Backup the old token
- Save the new token
- Calculate expiration time
- Show you when next renewal is needed

### **Step 3: Verify**

```bash
# Check token expiration
node -e "const t = require('./.datto-token.json'); console.log('Expires:', new Date(t.expires_at))"

# Check service is using new token
curl http://localhost:3000/metrics | grep datto_token_hours
```

---

## Renewal Schedule

**Token lifespan:** 100 hours (4.16 days)

**Recommended renewal:** Every 4 days (96 hours)

**You'll receive email alerts:**
- 📧 **Day 3** (24 hours before expiration): Warning
- 🚨 **Day 4** (at expiration): Critical alert

**Set a calendar reminder** for every 4 days to refresh the token.

---

## Quick Reference

### Get Current Token Status
```bash
ssh pve "pct exec 181 -- curl -s http://localhost:3000/metrics | grep cloudigan_api_datto_token_hours_until_expiry"
```

### Update Token
```bash
ssh pve
pct enter 181
cd /opt/cloudigan-api
node update-token-from-postman.js
```

### Check Logs
```bash
ssh pve "pct exec 181 -- tail -50 /opt/cloudigan-api/logs/combined.log"
```

---

## Why Can't This Be Fully Automated?

Datto's API security model requires:
1. **User login** to Datto portal
2. **Manual authorization** for OAuth flow
3. **No refresh tokens** are issued

This is a security feature - Datto wants human verification for API access.

**Other RMM platforms** (like ConnectWise, NinjaRMM) have similar limitations.

---

## What We've Optimized

Even though renewal is manual, we've made it as easy as possible:

✅ **One-command update** - Just paste token and done
✅ **Email alerts** - Never miss a renewal
✅ **Prometheus monitoring** - Visual dashboard
✅ **Automatic backup** - Old tokens saved
✅ **Clear instructions** - This document

**Time required:** ~2 minutes every 4 days

---

## Grafana Dashboard

Monitor token expiration visually:
- Import `grafana-dashboard.json`
- Panel 1 shows hours remaining with color-coded alerts
- Panel 2 shows last renewal status

---

## Troubleshooting

**Q: I forgot to renew and token expired**
```bash
# Customer signups will fail until you renew
# Follow Step 1-2 above to get new token
# Service will automatically start working again
```

**Q: How do I know if token is working?**
```bash
# Check metrics endpoint
curl http://localhost:3000/metrics | grep datto_token

# Should show positive hours remaining
```

**Q: Can I automate the Postman part?**
- No - Postman requires manual OAuth login
- This is intentional security by Datto

---

## Summary

- 🔄 **Manual renewal required** every 4 days
- 📧 **Email alerts** remind you automatically  
- ⏱️ **2 minutes** to complete renewal
- 📊 **Full monitoring** via Prometheus/Grafana
- ✅ **Simple workflow** with one command

This is the best we can do with Datto's API limitations.
