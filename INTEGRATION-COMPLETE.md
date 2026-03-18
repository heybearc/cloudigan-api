# Stripe → Datto RMM Integration - COMPLETE ✅

## Overview
Automated integration that creates Datto RMM sites when customers subscribe via Stripe and provides them with agent download links.

## What's Working

### ✅ Authentication
- **Method**: OAuth 2.0 Authorization Code flow with automated Playwright
- **Token Management**: Automatic caching and refresh (100-hour token lifetime)
- **Module**: `datto-auth.js` handles all authentication automatically

### ✅ Site Creation
- **Endpoint**: `PUT /api/v2/site`
- **Tested**: Successfully creates sites with customer name and email
- **Returns**: Site UID, ID, and portal URL

### ✅ Agent Download
- **Method**: Portal URL from site data
- **Format**: `https://vidal.rmm.datto.com/site/{siteId}`
- **Note**: Customers will need to log in to download agent (standard Datto workflow)

### ✅ Webhook Handler
- **File**: `webhook-handler.js`
- **Listens**: Stripe `checkout.session.completed` events
- **Actions**:
  1. Extracts customer info from Stripe
  2. Creates Datto site
  3. Gets portal URL
  4. Stores URL in Stripe customer metadata
  5. Provides API endpoint for Wix confirmation page

## Architecture

```
Stripe Checkout
    ↓
Webhook → webhook-handler.js
    ↓
datto-auth.js (OAuth)
    ↓
Datto RMM API
    ↓
Site Created + Portal URL
    ↓
Stored in Stripe Metadata
    ↓
Wix Confirmation Page
```

## Files

### Core Files
- `webhook-handler.js` - Main webhook server
- `datto-auth.js` - OAuth authentication module
- `.datto-token.json` - Cached OAuth token (auto-managed)
- `.env` - Environment configuration

### Test Files
- `test-token.js` - Test OAuth token
- `test-site-creation.js` - Test site creation
- `test-agent-download.js` - Test agent download endpoint

### Documentation
- `README.md` - Setup instructions
- `INTEGRATION-COMPLETE.md` - This file
- `DATTO-SUPPORT-REQUEST.md` - Support reference

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Datto RMM
DATTO_API_URL=https://vidal-api.centrastage.net
DATTO_API_KEY=BCE6247DP69R8OBFHVE37EMET4IH6325
DATTO_API_SECRET_KEY=C9CEDEUVO476DF9IKAP3MK33I0QBUCAV

# Server
PORT=3000
```

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Get Initial OAuth Token
```bash
node datto-auth.js
```
This will:
- Open a browser (headless)
- Log in with API credentials
- Get OAuth token
- Save to `.datto-token.json`

### 4. Test Integration
```bash
# Test site creation
node test-site-creation.js

# Test agent download
node test-agent-download.js
```

### 5. Start Webhook Server
```bash
npm start
# Or for production:
pm2 start webhook-handler.js --name stripe-datto-webhook
```

### 6. Configure Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhook/stripe`
3. Select event: `checkout.session.completed`
4. Copy webhook secret to `.env`

### 7. Update Wix Confirmation Page
Add this code to your Wix confirmation page:

```javascript
import { fetch } from 'wix-fetch';

$w.onReady(async function () {
  const sessionId = wixLocation.query.session_id;
  
  if (sessionId) {
    try {
      const response = await fetch(
        `https://your-domain.com/api/agent-link/${sessionId}`
      );
      const data = await response.json();
      
      if (data.agentDownloadUrl) {
        $w('#downloadLink').link = data.agentDownloadUrl;
        $w('#downloadLink').show();
      }
    } catch (error) {
      console.error('Failed to get agent link:', error);
    }
  }
});
```

## API Endpoints

### POST /webhook/stripe
Stripe webhook endpoint
- **Trigger**: `checkout.session.completed`
- **Action**: Creates Datto site, stores portal URL

### GET /api/agent-link/:sessionId
Get agent download link for a Stripe session
- **Returns**: `{ agentDownloadUrl: "https://..." }`
- **Used by**: Wix confirmation page

## Token Management

### Automatic Refresh
- Tokens last 100 hours (~4 days)
- `datto-auth.js` automatically refreshes when needed
- Uses Playwright to automate OAuth flow
- No manual intervention required

### Manual Refresh
If needed, run:
```bash
node datto-auth.js
```

## Monitoring

### Check Token Status
```bash
node -e "console.log(require('./.datto-token.json'))"
```

### Test API Access
```bash
node test-token.js
```

### View Logs
```bash
# If using pm2
pm2 logs stripe-datto-webhook
```

## Troubleshooting

### Token Expired
```bash
# Get new token
node datto-auth.js
```

### Site Creation Fails
- Check Datto API credentials in `.env`
- Verify API access enabled in Datto RMM
- Check token is valid: `node test-token.js`

### Webhook Not Receiving Events
- Verify webhook URL in Stripe dashboard
- Check webhook secret in `.env`
- Test with Stripe CLI: `stripe trigger checkout.session.completed`

## Customer Experience

1. **Customer subscribes** via Stripe pricing table on Wix
2. **Webhook fires** → Creates Datto site automatically
3. **Confirmation page** shows agent download link
4. **Customer clicks link** → Goes to Datto portal
5. **Customer logs in** → Downloads agent installer
6. **Agent installs** → Device appears in Datto RMM

## Next Steps

### Optional Enhancements
1. **Email Notifications**: Send agent download link via email
2. **Custom Branding**: White-label the portal URL
3. **Direct Download**: Investigate direct agent download without login
4. **Monitoring**: Add health checks and alerting
5. **Multi-Platform**: Support different Datto platforms

### Production Checklist
- [ ] Deploy webhook handler to production server
- [ ] Configure Stripe webhook with production URL
- [ ] Update Wix confirmation page with production API endpoint
- [ ] Set up monitoring and logging
- [ ] Test end-to-end with real subscription
- [ ] Document customer onboarding process
- [ ] Train support team on troubleshooting

## Support

### Datto RMM
- Portal: https://vidal.rmm.datto.com
- API Docs: https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm
- Support: Contact Datto support for API issues

### Stripe
- Dashboard: https://dashboard.stripe.com
- Webhooks: https://dashboard.stripe.com/webhooks
- Docs: https://stripe.com/docs/webhooks

## Success Metrics

✅ **Authentication**: Working with automated OAuth
✅ **Site Creation**: Tested and confirmed
✅ **Agent Links**: Portal URLs generated
✅ **Webhook Handler**: Ready for deployment
✅ **Token Management**: Automatic refresh implemented

**Status**: READY FOR PRODUCTION 🚀
