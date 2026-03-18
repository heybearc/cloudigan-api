#!/bin/bash
# Check Datto OAuth token health and send alerts if needed

TOKEN_FILE="/opt/cloudigan-api/.datto-token.json"
ALERT_THRESHOLD_HOURS=24  # Alert if less than 24 hours remaining

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ ERROR: No token file found at $TOKEN_FILE"
    echo "Datto OAuth token missing on $(hostname)" | \
        mail -s "CRITICAL: Datto Token Missing" cory@cloudigan.com
    exit 1
fi

# Parse token expiration
EXPIRES_AT=$(cat "$TOKEN_FILE" | grep -o '"expires_at":[0-9]*' | cut -d':' -f2)
NOW=$(date +%s)000
HOURS_LEFT=$(( ($EXPIRES_AT - $NOW) / 3600000 ))

echo "Datto OAuth Token Status:"
echo "  Expires in: $HOURS_LEFT hours"
echo "  Status: $([ $HOURS_LEFT -gt $ALERT_THRESHOLD_HOURS ] && echo '✅ Healthy' || echo '⚠️  Expiring Soon')"

# Alert if token is expiring soon
if [ $HOURS_LEFT -lt $ALERT_THRESHOLD_HOURS ]; then
    echo "⚠️  WARNING: Token expires in $HOURS_LEFT hours (threshold: $ALERT_THRESHOLD_HOURS hours)"
    echo "Datto OAuth token on $(hostname) expires in $HOURS_LEFT hours. Please refresh manually or check cron job." | \
        mail -s "WARNING: Datto Token Expiring Soon" cory@cloudigan.com
    exit 1
fi

exit 0
