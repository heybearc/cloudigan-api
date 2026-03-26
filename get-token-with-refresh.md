# Get Datto Token WITH refresh_token for Automatic Renewal

## Problem
The current token was manually generated from Datto portal and doesn't include a `refresh_token`, which prevents automatic renewal.

## Solution
Generate a new token using the OAuth flow that includes a `refresh_token`.

---

## Option 1: Use Datto RMM Portal (Recommended)

1. **Log into Datto RMM Portal:**
   - URL: https://vidal.rmm.datto.com
   - Username: Your Datto account
   - Password: Your Datto password

2. **Generate API Token:**
   - Go to: Setup → API Credentials
   - Click "Generate New Token" or "Refresh Token"
   - **IMPORTANT:** Make sure to select "Include refresh token" or "Long-lived token" option
   - Copy BOTH the `access_token` AND `refresh_token`

3. **Save to server:**
   ```bash
   ssh pve
   pct enter 181
   cd /opt/cloudigan-api
   
   # Create token file with BOTH tokens
   cat > .datto-token.json << 'EOF'
   {
     "access_token": "YOUR_ACCESS_TOKEN_HERE",
     "refresh_token": "YOUR_REFRESH_TOKEN_HERE",
     "token_type": "bearer",
     "expires_in": 360000,
     "obtained_at": CURRENT_TIMESTAMP_IN_MS,
     "expires_at": EXPIRY_TIMESTAMP_IN_MS
   }
   EOF
   
   # Fix permissions
   chown webhook:webhook .datto-token.json
   chmod 600 .datto-token.json
   ```

4. **Calculate timestamps:**
   ```bash
   # Current timestamp (milliseconds)
   node -e "console.log(Date.now())"
   
   # Expiry timestamp (current + 360000 seconds = 100 hours)
   node -e "console.log(Date.now() + (360000 * 1000))"
   ```

---

## Option 2: Manual OAuth Flow (If Portal Doesn't Work)

1. **Get Authorization Code:**
   - Open in browser: https://vidal-api.centrastage.net/auth/oauth/authorize?client_id=public-client&redirect_uri=https://oauth.pstmn.io/v1/callback&response_type=code&scope=default
   - Log in with API credentials:
     - Username: `BCE6247DP69R8OBFHVE37EMET4IH6325`
     - Password: `C9CEDEUVO476DF9IKAP3MK33I0QBUCAV`
   - After redirect, copy the `code` from URL

2. **Exchange for token WITH refresh_token:**
   ```bash
   ssh pve
   pct enter 181
   cd /opt/cloudigan-api
   node manual-token-input.js
   # Paste the authorization code when prompted
   ```

---

## Option 3: Direct API Call (Advanced)

```bash
ssh pve
pct enter 181

# Exchange authorization code for token
curl -X POST https://vidal-api.centrastage.net/auth/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE_HERE" \
  -d "redirect_uri=https://oauth.pstmn.io/v1/callback" \
  -d "client_id=public-client" \
  | python3 -m json.tool > /opt/cloudigan-api/.datto-token.json

# Add timestamps
node -e "
const fs = require('fs');
const token = JSON.parse(fs.readFileSync('.datto-token.json'));
token.obtained_at = Date.now();
token.expires_at = Date.now() + (token.expires_in * 1000);
fs.writeFileSync('.datto-token.json', JSON.stringify(token, null, 2));
console.log('Token saved with timestamps');
console.log('Has refresh_token:', !!token.refresh_token);
"
```

---

## Verify Token Has refresh_token

```bash
ssh pve "pct exec 181 -- cat /opt/cloudigan-api/.datto-token.json | python3 -c 'import sys, json; t=json.load(sys.stdin); print(\"Has refresh_token:\", \"refresh_token\" in t and t[\"refresh_token\"] is not None)'"
```

Should output: `Has refresh_token: True`

---

## Test Automatic Renewal

```bash
ssh pve "pct exec 181 -- sh -c 'cd /opt/cloudigan-api && node auto-renew-token.js'"
```

You should see:
- ✅ Token refreshed using refresh_token
- Email alert sent with success notification

---

## Once Token Has refresh_token

**Automatic renewal will work:**
- Cron job runs every 4 days at 2 AM
- Uses `refresh_token` (no browser needed)
- Sends email on success or failure
- Updates Prometheus metrics

**You'll receive email alerts:**
- ✅ Success: "Datto Token Renewal Successful"
- 🚨 Failure: "CRITICAL: Datto Token Renewal FAILED"

---

## Current Status

- ❌ Current token: NO refresh_token (manual renewal required in 97 hours)
- ✅ Auto-renewal script: Ready and deployed
- ✅ Cron job: Configured (runs every 4 days at 2 AM)
- ✅ Email alerts: Configured
- ⏳ **Action needed:** Generate new token WITH refresh_token

Once you complete any of the options above, automatic renewal will work permanently.
