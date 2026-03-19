#!/bin/bash
# Wix OAuth Token Refresh Script
# Refreshes Wix OAuth access token using refresh token
# Should run every 3 hours via cron

set -e

# Load environment variables
if [ -f /opt/cloudigan-api/.env ]; then
    export $(grep -v '^#' /opt/cloudigan-api/.env | xargs)
fi

TOKEN_FILE="/opt/cloudigan-api/.wix-tokens.json"
LOG_FILE="/opt/cloudigan-api/logs/wix-token-refresh.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if token file exists
if [ ! -f "$TOKEN_FILE" ]; then
    log "ERROR: Token file not found at $TOKEN_FILE"
    exit 1
fi

# Read current tokens
REFRESH_TOKEN=$(jq -r '.refresh_token' "$TOKEN_FILE")
CLIENT_ID=$(jq -r '.client_id' "$TOKEN_FILE")

if [ -z "$REFRESH_TOKEN" ] || [ "$REFRESH_TOKEN" = "null" ]; then
    log "ERROR: No refresh token found"
    exit 1
fi

log "Refreshing Wix OAuth token..."

# Call Wix OAuth token endpoint
RESPONSE=$(curl -s -X POST https://www.wixapis.com/oauth2/token \
    -H "Content-Type: application/json" \
    -d "{
        \"grant_type\": \"refresh_token\",
        \"refresh_token\": \"$REFRESH_TOKEN\",
        \"client_id\": \"$CLIENT_ID\"
    }")

# Check if refresh was successful
if echo "$RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    # Extract new tokens
    NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
    NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')
    EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in')
    
    # Update token file
    jq --arg access_token "$NEW_ACCESS_TOKEN" \
       --arg refresh_token "$NEW_REFRESH_TOKEN" \
       --arg expires_in "$EXPIRES_IN" \
       '.access_token = $access_token | .refresh_token = $refresh_token | .expires_in = ($expires_in | tonumber)' \
       "$TOKEN_FILE" > "${TOKEN_FILE}.tmp"
    
    mv "${TOKEN_FILE}.tmp" "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    
    log "SUCCESS: Token refreshed successfully (expires in ${EXPIRES_IN}s)"
    
    # Restart webhook service to pick up new token
    systemctl restart cloudigan-api
    log "Restarted cloudigan-api service"
else
    log "ERROR: Token refresh failed: $RESPONSE"
    exit 1
fi
