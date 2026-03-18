# Cloudigan API

**Stripe to Datto RMM Webhook Integration**

Automatically creates Datto RMM sites and sends customer notifications when Stripe subscriptions are created through Stripe.

## Workflow

1. Customer completes checkout on Stripe pricing table
2. Stripe sends `checkout.session.completed` webhook
3. Webhook handler creates a site in Datto RMM
4. Handler retrieves agent download link
5. Link is stored in Stripe customer metadata
6. Customer is redirected to confirmation page with download link

## Setup Instructions

### 1. Get Datto RMM API Credentials

1. Log into your Datto RMM account
2. Navigate to **Setup > Global Settings > Access Control**
3. Enable "Enable API Access"
4. Navigate to **Setup > Users**
5. Select or create a user for API access
6. Click "Generate API Keys"
7. Save the API Key, API Secret Key, and API URL

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values.

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/webhook/stripe`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret to your `.env` file

### 5. Update Stripe Pricing Table

In your Stripe pricing table settings, add custom metadata fields:
- `company_name` - Customer's company name
- `product_id` - Product identifier

### 6. Run the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Confirmation Page Integration

On your Wix confirmation page (`https://cloudigan.com/checkoutconfirmation`), add JavaScript to fetch the download link:

```javascript
// Get customer ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get('customer_id');

if (customerId) {
  fetch(`https://yourdomain.com/api/agent-download/${customerId}`)
    .then(response => response.json())
    .then(data => {
      // Display download link to customer
      document.getElementById('download-link').href = data.downloadUrl;
      document.getElementById('download-link').style.display = 'block';
    })
    .catch(error => {
      console.error('Error fetching download link:', error);
    });
}
```

## Testing

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
stripe trigger checkout.session.completed
```

## Deployment

Deploy to your preferred hosting platform:
- **Heroku**: `git push heroku main`
- **AWS Lambda**: Use serverless framework
- **DigitalOcean**: Deploy as Node.js app
- **Your server**: Run with PM2 or systemd

## Security Notes

- Never commit `.env` file
- Use HTTPS in production
- Verify webhook signatures
- Implement rate limiting
- Monitor API usage to stay within Datto rate limits

## Troubleshooting

### Webhook not receiving events
- Check Stripe webhook endpoint is active
- Verify webhook secret is correct
- Check server logs for errors

### Datto API errors
- Verify API credentials are correct
- Check token hasn't expired
- Ensure API user has proper permissions
- Review Datto API rate limits

### Agent download link not found
- Check Datto API endpoint for installation packages
- Verify site was created successfully
- Review Datto API documentation for correct endpoint

## Next Steps

1. **Email Integration**: Send download link via email using SendGrid/Mailgun
2. **Database**: Store site mappings in PostgreSQL/MySQL
3. **Monitoring**: Add logging with Winston or Datadog
4. **Error Handling**: Implement retry logic for failed API calls
5. **Customer Portal**: Build interface for customers to re-download agents
