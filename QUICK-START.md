# Quick Start - Deploy in 10 Minutes

## What You're Building
When a customer subscribes on your Wix site:
1. ✅ Stripe processes payment
2. ✅ Webhook creates Datto RMM site automatically
3. ✅ Customer gets agent download link on confirmation page

## Prerequisites
- Stripe account with API keys
- Datto RMM account with API access
- Wix site with pricing table

## Step 1: Deploy to Railway (5 minutes)

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Deploy
```bash
cd /Users/cory/Projects/cloudigan/projects/stripe-datto-integration

# Login to Railway
railway login

# Create new project
railway init

# Set environment variables
railway variables set STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET_KEY_HERE"
railway variables set DATTO_API_URL="https://vidal-api.centrastage.net"
railway variables set DATTO_API_KEY="BCE6247DP69R8OBFHVE37EMET4IH6325"
railway variables set DATTO_API_SECRET_KEY="C9CEDEUVO476DF9IKAP3MK33I0QBUCAV"
railway variables set PORT="3000"

# Deploy
railway up

# Get your public URL
railway domain
```

**Save your URL**: `https://your-app.up.railway.app`

## Step 2: Configure Stripe Webhook (2 minutes)

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter: `https://your-app.up.railway.app/webhook/stripe`
4. Select event: **`checkout.session.completed`**
5. Click **"Add endpoint"**
6. Copy the **webhook signing secret** (starts with `whsec_`)
7. Add to Railway:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

## Step 3: Update Wix Confirmation Page (3 minutes)

1. Open your Wix site editor
2. Go to your confirmation page (after checkout)
3. Add these elements:
   - Text element: ID = `loadingText`, text = "Loading your download link..."
   - Button element: ID = `downloadButton`, text = "Download RMM Agent"
   - Text element: ID = `errorText`, hidden by default

4. Add this code to the page:

```javascript
import { fetch } from 'wix-fetch';
import wixLocation from 'wix-location';

$w.onReady(async function () {
  const sessionId = wixLocation.query.session_id;
  
  if (!sessionId) {
    $w('#loadingText').text = "No session found";
    return;
  }
  
  try {
    const response = await fetch(
      `https://your-app.up.railway.app/api/agent-link/${sessionId}`
    );
    
    const data = await response.json();
    
    if (data.agentDownloadUrl) {
      $w('#downloadButton').link = data.agentDownloadUrl;
      $w('#downloadButton').show();
      $w('#loadingText').hide();
    } else {
      $w('#loadingText').text = "Processing your order...";
    }
  } catch (error) {
    $w('#errorText').text = "Error loading download link. Please contact support.";
    $w('#errorText').show();
    $w('#loadingText').hide();
  }
});
```

**Replace** `your-app.up.railway.app` with your actual Railway URL!

## Step 4: Test It! (2 minutes)

### Test with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Send test event to your deployed webhook
stripe trigger checkout.session.completed --webhook-endpoint https://your-app.up.railway.app/webhook/stripe
```

### Or Test with Real Payment
1. Go to your Wix site
2. Click subscribe
3. Use test card: `4242 4242 4242 4242`
4. Any future date, any CVC
5. Complete checkout
6. Check confirmation page for download link
7. Verify site created in Datto RMM

## Verify Deployment

### Check webhook is running
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-03-16T..."}
```

### Check Railway logs
```bash
railway logs
```

Look for:
- "Webhook server running on port 3000"
- "Stripe webhook received"
- "Datto site created"

## Troubleshooting

### Webhook not receiving events
```bash
# Check Stripe webhook status
stripe listen --forward-to https://your-app.up.railway.app/webhook/stripe
```

### OAuth token issues
The first time the webhook runs, it will automatically get an OAuth token using Playwright. Check logs for:
- "🤖 Starting automated OAuth flow..."
- "✅ Token obtained and saved!"

### Site creation fails
Check Railway logs for errors. Common issues:
- Datto API credentials incorrect
- API access not enabled in Datto RMM
- Token expired (will auto-refresh)

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys (not test keys)
- [ ] Update Stripe webhook with live mode endpoint
- [ ] Test with real payment
- [ ] Verify site created in Datto RMM
- [ ] Confirm download link works
- [ ] Set up monitoring alerts

## What Happens When Customer Subscribes

1. **Customer fills form** on Wix pricing table
2. **Stripe processes payment** (validates card, charges customer)
3. **Stripe sends webhook** to your Railway app
4. **Webhook handler**:
   - Verifies webhook signature
   - Extracts customer info (name, email)
   - Creates site in Datto RMM
   - Gets portal URL for agent download
   - Stores URL in Stripe customer metadata
5. **Confirmation page** fetches and displays download link
6. **Customer clicks link** → Downloads RMM agent

## Support

### Railway Issues
- Logs: `railway logs`
- Restart: `railway restart`
- Dashboard: https://railway.app/dashboard

### Stripe Issues
- Dashboard: https://dashboard.stripe.com
- Webhook logs: https://dashboard.stripe.com/webhooks
- Test events: `stripe trigger checkout.session.completed`

### Datto Issues
- Portal: https://vidal.rmm.datto.com
- Check API access enabled
- Verify sites created

## Next Steps

Once deployed and tested:

1. **Monitor** - Check Railway logs regularly
2. **Scale** - Railway auto-scales as needed
3. **Enhance** - Add email notifications, custom branding
4. **Support** - Train team on troubleshooting

**You're done! 🎉**

Your Stripe → Datto integration is live and automated.
