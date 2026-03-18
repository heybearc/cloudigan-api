# Deployment Guide - Stripe to Datto Integration

## Quick Deploy to Railway (Recommended)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. You get $5/month free credit

### Step 2: Deploy This Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set DATTO_API_URL="https://vidal-api.centrastage.net"
railway variables set DATTO_API_KEY="BCE6247DP69R8OBFHVE37EMET4IH6325"
railway variables set DATTO_API_SECRET_KEY="C9CEDEUVO476DF9IKAP3MK33I0QBUCAV"
railway variables set PORT="3000"

# Deploy
railway up
```

### Step 3: Get Your Webhook URL
```bash
# Get the public URL
railway domain
```

Your webhook URL will be: `https://your-app.up.railway.app/webhook/stripe`

### Step 4: Configure Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-app.up.railway.app/webhook/stripe`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret
6. Update Railway: `railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."`

### Step 5: Test the Integration
1. Create a test subscription in Stripe
2. Check Railway logs: `railway logs`
3. Verify site created in Datto RMM

---

## Alternative: Deploy to Render.com

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repo or upload this folder
3. Configure:
   - **Name**: stripe-datto-webhook
   - **Environment**: Node
   - **Build Command**: `npm install && npx playwright install chromium`
   - **Start Command**: `node webhook-handler.js`
   - **Instance Type**: Free

### Step 3: Add Environment Variables
In Render dashboard, add:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATTO_API_URL`
- `DATTO_API_KEY`
- `DATTO_API_SECRET_KEY`
- `PORT` = `3000`

### Step 4: Deploy
Click "Create Web Service" - Render will deploy automatically

Your webhook URL: `https://stripe-datto-webhook.onrender.com/webhook/stripe`

---

## Alternative: Deploy to Your Own Server

### Requirements
- Ubuntu/Debian server with public IP
- Node.js 18+
- PM2 for process management

### Steps
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone/upload your project
cd /var/www
git clone <your-repo> stripe-datto-integration
cd stripe-datto-integration

# 5. Install dependencies
npm install
npx playwright install chromium --with-deps

# 6. Create .env file
nano .env
# Add all your environment variables

# 7. Start with PM2
pm2 start webhook-handler.js --name stripe-datto-webhook
pm2 save
pm2 startup

# 8. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/webhook
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Stripe Configuration

### 1. Create Pricing Table (if not done)
1. Go to https://dashboard.stripe.com/test/products
2. Create a product (e.g., "RMM Monitoring")
3. Add pricing (e.g., $99/month)
4. Go to "Payment Links" → "Pricing Tables"
5. Create pricing table
6. Copy embed code for Wix

### 2. Configure Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-deployed-url.com/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
4. Copy webhook signing secret
5. Add to environment variables

### 3. Test Mode vs Live Mode
- **Test Mode**: Use test API keys (sk_test_...)
- **Live Mode**: Use live API keys (sk_live_...)
- Configure separate webhooks for each mode

---

## Wix Integration

### Update Confirmation Page

Add this code to your Wix confirmation page:

```javascript
import { fetch } from 'wix-fetch';
import wixLocation from 'wix-location';

$w.onReady(async function () {
  const sessionId = wixLocation.query.session_id;
  
  if (sessionId) {
    // Show loading state
    $w('#loadingText').show();
    $w('#downloadSection').hide();
    
    try {
      // Fetch agent download link from your webhook server
      const response = await fetch(
        `https://your-deployed-url.com/api/agent-link/${sessionId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.agentDownloadUrl) {
          // Show download link
          $w('#downloadLink').link = data.agentDownloadUrl;
          $w('#downloadLink').text = "Download RMM Agent";
          $w('#downloadSection').show();
          $w('#loadingText').hide();
        } else {
          $w('#errorText').text = "Agent link not available yet. Check your email.";
          $w('#errorText').show();
          $w('#loadingText').hide();
        }
      } else {
        throw new Error('Failed to fetch agent link');
      }
    } catch (error) {
      console.error('Error fetching agent link:', error);
      $w('#errorText').text = "Unable to load download link. Please contact support.";
      $w('#errorText').show();
      $w('#loadingText').hide();
    }
  }
});
```

### Wix Page Elements Needed
- `#loadingText` - Text element (shown while loading)
- `#downloadSection` - Container for download link
- `#downloadLink` - Button or link element
- `#errorText` - Text element for errors

---

## Testing

### 1. Test Webhook Locally (Before Deploy)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhook/stripe

# In another terminal, start your server
npm start

# Trigger test event
stripe trigger checkout.session.completed
```

### 2. Test Deployed Webhook
```bash
# Use Stripe CLI to send test event to deployed URL
stripe trigger checkout.session.completed --webhook-endpoint https://your-url.com/webhook/stripe
```

### 3. End-to-End Test
1. Go to your Wix site
2. Click subscribe button
3. Complete test payment (use test card: 4242 4242 4242 4242)
4. Check confirmation page shows download link
5. Verify site created in Datto RMM

---

## Monitoring

### Check Logs

**Railway:**
```bash
railway logs
```

**Render:**
View logs in Render dashboard

**PM2 (own server):**
```bash
pm2 logs stripe-datto-webhook
```

### Health Check Endpoint
Test your webhook is running:
```bash
curl https://your-url.com/health
```

Should return: `{"status":"ok"}`

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check Stripe webhook configuration
2. Verify webhook URL is correct
3. Check server logs for errors
4. Test with Stripe CLI

### OAuth Token Issues
```bash
# SSH into server and refresh token
cd /path/to/app
node datto-auth.js
pm2 restart stripe-datto-webhook
```

### Site Creation Fails
1. Check Datto API credentials
2. Verify token is valid
3. Check Datto RMM API access is enabled
4. Review server logs

---

## Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Railway/Render)
- [ ] Verify Stripe webhook signatures
- [ ] Use live API keys only in production
- [ ] Restrict CORS if needed
- [ ] Monitor for failed requests
- [ ] Set up error alerting

---

## Cost Estimate

### Railway (Recommended)
- Free: $5/month credit
- After credit: ~$5-10/month for small usage
- Scales automatically

### Render
- Free tier available
- Paid: $7/month for always-on service

### Own Server
- VPS: $5-20/month (DigitalOcean, Linode, etc.)
- More control, more maintenance

---

## Next Steps

1. ✅ Choose deployment platform
2. ✅ Deploy webhook handler
3. ✅ Configure Stripe webhook
4. ✅ Update Wix confirmation page
5. ✅ Test end-to-end
6. ✅ Go live!

**Recommended: Start with Railway for easiest setup**
