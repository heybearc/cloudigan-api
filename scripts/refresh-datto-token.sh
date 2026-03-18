#!/bin/bash
# Automated Datto OAuth Token Refresh
# Runs every 4 days to keep token fresh

set -e

LOG_FILE="/opt/cloudigan-api/logs/token-refresh.log"
TOKEN_FILE="/opt/cloudigan-api/.datto-token.json"
APP_DIR="/opt/cloudigan-api"

echo "$(date): Starting Datto token refresh..." >> "$LOG_FILE"

cd "$APP_DIR"

# Check current token expiration
if [ -f "$TOKEN_FILE" ]; then
    EXPIRES_AT=$(cat "$TOKEN_FILE" | grep -o '"expires_at":[0-9]*' | cut -d':' -f2)
    NOW=$(date +%s)000
    HOURS_LEFT=$(( ($EXPIRES_AT - $NOW) / 3600000 ))
    echo "$(date): Current token expires in $HOURS_LEFT hours" >> "$LOG_FILE"
fi

# Refresh token
if node datto-auth.js >> "$LOG_FILE" 2>&1; then
    echo "$(date): ✅ Token refresh successful" >> "$LOG_FILE"
    
    # Copy to other server
    scp -i ~/.ssh/homelab_root "$TOKEN_FILE" root@10.92.3.182:/opt/cloudigan-api/ >> "$LOG_FILE" 2>&1
    echo "$(date): ✅ Token copied to standby server" >> "$LOG_FILE"
    
    # Send success notification (optional)
    # curl -X POST https://api.cloudigan.net/internal/token-refresh-success
else
    echo "$(date): ❌ Token refresh failed" >> "$LOG_FILE"
    
    # Send alert email
    echo "Datto OAuth token refresh failed on $(hostname). Check logs at $LOG_FILE" | \
        mail -s "ALERT: Datto Token Refresh Failed" cory@cloudigan.com
    
    exit 1
fi

echo "$(date): Token refresh complete" >> "$LOG_FILE"
