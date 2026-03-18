#!/bin/bash

# Deployment script for Stripe to Datto integration

echo "🚀 Deploying Stripe to Datto Integration"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize project if needed
if [ ! -f ".railway" ]; then
    echo "📦 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "⚙️  Setting environment variables..."
echo "Enter your Stripe secret key (sk_live_...):"
read STRIPE_SECRET_KEY
railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo "Enter your Datto API URL (https://vidal-api.centrastage.net):"
read DATTO_API_URL
railway variables set DATTO_API_URL="$DATTO_API_URL"

echo "Enter your Datto API Key:"
read DATTO_API_KEY
railway variables set DATTO_API_KEY="$DATTO_API_KEY"

echo "Enter your Datto API Secret Key:"
read DATTO_API_SECRET_KEY
railway variables set DATTO_API_SECRET_KEY="$DATTO_API_SECRET_KEY"

railway variables set PORT="3000"

# Deploy
echo "🚢 Deploying to Railway..."
railway up

# Get domain
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get your webhook URL:"
echo "   railway domain"
echo ""
echo "2. Configure Stripe webhook:"
echo "   - Go to https://dashboard.stripe.com/webhooks"
echo "   - Add endpoint: https://your-app.up.railway.app/webhook/stripe"
echo "   - Select event: checkout.session.completed"
echo "   - Copy webhook secret and run:"
echo "     railway variables set STRIPE_WEBHOOK_SECRET=\"whsec_...\""
echo ""
echo "3. Update Wix confirmation page with your Railway URL"
echo ""
echo "4. Test with: stripe trigger checkout.session.completed"
echo ""
