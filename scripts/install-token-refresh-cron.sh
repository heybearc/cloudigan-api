#!/bin/bash
# Install cron job for Datto token refresh
# Run this once on the LIVE server to set up automated token refresh

CRON_SCHEDULE="0 */96 * * *"  # Every 4 days (96 hours)
SCRIPT_PATH="/opt/cloudigan-api/scripts/refresh-datto-token.sh"

# Make refresh script executable
chmod +x "$SCRIPT_PATH"

# Add cron job (if not already present)
(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "$CRON_SCHEDULE $SCRIPT_PATH") | crontab -

echo "✅ Cron job installed: Token will refresh every 4 days"
echo "Current crontab:"
crontab -l | grep datto
