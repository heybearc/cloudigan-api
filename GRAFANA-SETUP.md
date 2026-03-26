# Grafana Dashboard Setup Guide

## Available Dashboards

### 1. Cloudigan API - Customer Signup Flow & Token Monitoring
**File**: `grafana-dashboard.json`

**Panels**:
1. **Datto Token Expiration** (Gauge) - Hours remaining until token expires
2. **Token Refresh Status** (Stat) - Last refresh success/failure
3. **Signup Success Rate** (Gauge) - Percentage of successful signups
4. **Signup Flow by Stage** (Time Series) - Success/failure by stage (Datto, Wix, Email)
5. **Signup Duration P95** (Time Series) - 95th percentile latency per stage
6. **Total Signups** (Stat) - Total count of signup attempts
7. **Failed Signups** (Time Series) - Failed signups over time
8. **Signup Flow Breakdown** (Pie Chart) - Business vs Personal signups
9. **Recent Errors** (Table) - Last 10 errors with details
10. **API Request Rate** (Time Series) - Requests per second

**Metrics Used**:
- `cloudigan_api_datto_token_hours_until_expiry`
- `cloudigan_api_token_refresh_status`
- `cloudigan_api_signup_flow_total`
- `cloudigan_api_signup_flow_duration_seconds`
- `cloudigan_api_webhooks_total`
- `cloudigan_api_errors_total`

---

### 2. Enhanced Monitoring Dashboard
**File**: `monitoring/grafana-dashboard.json`

**Panels**:
- Comprehensive API metrics
- Error tracking
- Performance monitoring
- Resource utilization

---

## How to Import Dashboards into Grafana

### Method 1: Via Grafana UI (Recommended)

1. **Access Grafana**
   ```
   http://your-grafana-url:3000
   ```
   Default credentials: `admin` / `admin`

2. **Navigate to Dashboards**
   - Click the **"+"** icon in the left sidebar
   - Select **"Import"**

3. **Import Dashboard**
   - Click **"Upload JSON file"**
   - Select `grafana-dashboard.json` from your local machine
   - OR paste the JSON content directly into the text area

4. **Configure Data Source**
   - Select your **Prometheus** data source from the dropdown
   - Click **"Import"**

5. **Repeat for Additional Dashboards**
   - Import `monitoring/grafana-dashboard.json` using the same steps

---

### Method 2: Via Grafana API

```bash
# Set your Grafana credentials
GRAFANA_URL="http://your-grafana-url:3000"
GRAFANA_USER="admin"
GRAFANA_PASS="admin"

# Import main dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASS" \
  -d @grafana-dashboard.json \
  "$GRAFANA_URL/api/dashboards/db"

# Import monitoring dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASS" \
  -d @monitoring/grafana-dashboard.json \
  "$GRAFANA_URL/api/dashboards/db"
```

---

### Method 3: Via File Provisioning (Automatic)

1. **Create provisioning directory**
   ```bash
   sudo mkdir -p /etc/grafana/provisioning/dashboards
   ```

2. **Create dashboard provider config**
   ```bash
   sudo nano /etc/grafana/provisioning/dashboards/cloudigan.yaml
   ```

   Add:
   ```yaml
   apiVersion: 1
   
   providers:
     - name: 'Cloudigan API'
       orgId: 1
       folder: 'Cloudigan'
       type: file
       disableDeletion: false
       updateIntervalSeconds: 10
       allowUiUpdates: true
       options:
         path: /var/lib/grafana/dashboards/cloudigan
   ```

3. **Copy dashboard files**
   ```bash
   sudo mkdir -p /var/lib/grafana/dashboards/cloudigan
   sudo cp grafana-dashboard.json /var/lib/grafana/dashboards/cloudigan/
   sudo cp monitoring/grafana-dashboard.json /var/lib/grafana/dashboards/cloudigan/
   sudo chown -R grafana:grafana /var/lib/grafana/dashboards
   ```

4. **Restart Grafana**
   ```bash
   sudo systemctl restart grafana-server
   ```

---

## Prometheus Data Source Setup

Before importing dashboards, ensure Prometheus is configured as a data source:

1. **Navigate to Configuration**
   - Click the **gear icon** (⚙️) in the left sidebar
   - Select **"Data Sources"**

2. **Add Prometheus**
   - Click **"Add data source"**
   - Select **"Prometheus"**

3. **Configure Connection**
   ```
   Name: Prometheus
   URL: http://localhost:9090
   Access: Server (default)
   ```

4. **Save & Test**
   - Click **"Save & Test"**
   - Should see: "Data source is working"

---

## Recommended Dashboard List

### Essential Dashboards

1. **Cloudigan API - Customer Signup Flow & Token Monitoring** ⭐
   - File: `grafana-dashboard.json`
   - Purpose: Monitor token expiration and customer signup flow
   - Priority: **CRITICAL**

2. **Enhanced Monitoring Dashboard**
   - File: `monitoring/grafana-dashboard.json`
   - Purpose: Comprehensive API monitoring
   - Priority: **HIGH**

### Additional Recommended Dashboards (Community)

3. **Node Exporter Full** (ID: 1860)
   - Purpose: System metrics (CPU, memory, disk, network)
   - Import: Dashboard ID `1860`

4. **Prometheus Stats** (ID: 2)
   - Purpose: Prometheus server metrics
   - Import: Dashboard ID `2`

5. **Container Monitoring** (ID: 893)
   - Purpose: Docker/LXC container metrics
   - Import: Dashboard ID `893`

---

## Import Community Dashboards

1. **Navigate to Import**
   - Click **"+"** → **"Import"**

2. **Enter Dashboard ID**
   - Enter the dashboard ID (e.g., `1860`)
   - Click **"Load"**

3. **Configure & Import**
   - Select Prometheus data source
   - Click **"Import"**

---

## Verify Dashboards Are Working

### Check Metrics Endpoint

```bash
curl http://cloudigan-api-blue.cloudigan.net:3000/metrics | grep cloudigan_api
```

Expected output:
```
cloudigan_api_datto_token_hours_until_expiry 100
cloudigan_api_token_refresh_status{service="datto"} 1
cloudigan_api_signup_flow_total{stage="datto_site_creation",status="success"} 5
cloudigan_api_signup_flow_duration_seconds_bucket{stage="datto_site_creation",le="5"} 5
```

### Test Prometheus Query

In Grafana, go to **Explore** and run:
```promql
cloudigan_api_datto_token_hours_until_expiry
```

Should return current token expiration hours.

---

## Dashboard Alerts

Configure alerts for critical metrics:

1. **Token Expiration Warning**
   - Metric: `cloudigan_api_datto_token_hours_until_expiry < 24`
   - Severity: Warning
   - Notification: Email

2. **Token Expiration Critical**
   - Metric: `cloudigan_api_datto_token_hours_until_expiry < 1`
   - Severity: Critical
   - Notification: Email + Slack

3. **Signup Failure Rate**
   - Metric: `rate(cloudigan_api_signup_flow_total{status="failed"}[5m]) > 0.1`
   - Severity: Warning
   - Notification: Email

---

## Troubleshooting

### Dashboard Shows "No Data"

1. **Check Prometheus is scraping**
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

2. **Verify metrics endpoint**
   ```bash
   curl http://cloudigan-api-blue.cloudigan.net:3000/metrics
   ```

3. **Check Prometheus config**
   ```bash
   cat /etc/prometheus/prometheus.yml
   ```

   Should include:
   ```yaml
   scrape_configs:
     - job_name: 'cloudigan-api'
       static_configs:
         - targets: ['cloudigan-api-blue.cloudigan.net:3000']
   ```

### Dashboard Import Fails

- **Error**: "Dashboard with same UID already exists"
  - Solution: Edit JSON and change `"uid"` field to a unique value

- **Error**: "Invalid JSON"
  - Solution: Validate JSON at https://jsonlint.com/

### Metrics Not Updating

1. **Restart API service**
   ```bash
   ssh pve
   pct enter 181
   systemctl restart cloudigan-api
   ```

2. **Check service logs**
   ```bash
   tail -f /opt/cloudigan-api/logs/combined.log
   ```

---

## Quick Start Commands

```bash
# Copy dashboard files to your local machine
scp pve:/opt/cloudigan-api/grafana-dashboard.json ~/Downloads/
scp pve:/opt/cloudigan-api/monitoring/grafana-dashboard.json ~/Downloads/

# Or view them directly
ssh pve "pct exec 181 -- cat /opt/cloudigan-api/grafana-dashboard.json"
```

---

## Summary

**Required Dashboards**:
1. ✅ Cloudigan API - Customer Signup Flow & Token Monitoring
2. ✅ Enhanced Monitoring Dashboard

**Recommended Community Dashboards**:
3. Node Exporter Full (ID: 1860)
4. Prometheus Stats (ID: 2)
5. Container Monitoring (ID: 893)

**Next Steps**:
1. Import `grafana-dashboard.json` (main dashboard)
2. Import `monitoring/grafana-dashboard.json` (enhanced monitoring)
3. Configure Prometheus data source
4. Set up email alerts for token expiration
5. Add community dashboards for system monitoring

Your Grafana instance will then have complete visibility into:
- Datto token expiration
- Customer signup flow success/failure
- API performance metrics
- System resource utilization
