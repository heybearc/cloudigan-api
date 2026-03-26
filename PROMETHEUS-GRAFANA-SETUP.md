# Prometheus & Grafana Setup Guide

## Current Status

✅ **Metrics Endpoint**: Working - `http://cloudigan-api-blue.cloudigan.net:3000/metrics`
❌ **Prometheus**: Not installed
❌ **Grafana**: Not installed

## Quick Setup (Recommended)

### Option 1: Install on Proxmox Host (Recommended)

Install Prometheus and Grafana on your Proxmox host to monitor all containers.

#### 1. Install Prometheus

```bash
ssh pve

# Install Prometheus
apt update
apt install -y prometheus

# Configure Prometheus to scrape cloudigan-api
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'cloudigan-api-blue'
    static_configs:
      - targets: ['10.92.3.181:3000']  # CT181 IP
    metrics_path: '/metrics'
    
  - job_name: 'cloudigan-api-green'
    static_configs:
      - targets: ['10.92.3.182:3000']  # CT182 IP (if exists)
    metrics_path: '/metrics'
EOF

# Start Prometheus
systemctl enable prometheus
systemctl restart prometheus

# Verify
systemctl status prometheus
curl http://localhost:9090/api/v1/targets
```

#### 2. Install Grafana

```bash
# Add Grafana repository
apt install -y software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
apt update
apt install -y grafana

# Start Grafana
systemctl enable grafana-server
systemctl start grafana-server

# Verify
systemctl status grafana-server
```

#### 3. Access Grafana

```
URL: http://your-proxmox-ip:3000
Default credentials: admin / admin
```

---

### Option 2: Install in LXC Container

Create a dedicated monitoring container.

```bash
ssh pve

# Create monitoring container
pct create 190 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname monitoring \
  --memory 2048 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=10.92.3.190/24,gw=10.92.3.1 \
  --storage local-lvm \
  --rootfs local-lvm:8

# Start container
pct start 190

# Enter container
pct enter 190

# Install Prometheus & Grafana (same commands as Option 1)
```

---

### Option 3: Docker Compose (Fastest)

```bash
ssh pve
pct enter 181  # Or create new container

# Create monitoring directory
mkdir -p /opt/monitoring
cd /opt/monitoring

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"  # Use 3001 to avoid conflict with cloudigan-api
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
EOF

# Create Prometheus config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'cloudigan-api'
    static_configs:
      - targets: ['host.docker.internal:3000']  # If on same host
      # OR
      # - targets: ['10.92.3.181:3000']  # If on different host
    metrics_path: '/metrics'
EOF

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access**:
- Prometheus: `http://your-ip:9090`
- Grafana: `http://your-ip:3001`

---

## Configure Grafana Data Source

1. **Login to Grafana**
   - URL: `http://your-grafana-url:3000` (or `:3001` for Docker)
   - Username: `admin`
   - Password: `admin` (change on first login)

2. **Add Prometheus Data Source**
   - Click **⚙️ Configuration** → **Data Sources**
   - Click **Add data source**
   - Select **Prometheus**
   - Configure:
     ```
     Name: Prometheus
     URL: http://localhost:9090  (or http://prometheus:9090 for Docker)
     Access: Server (default)
     ```
   - Click **Save & Test**
   - Should see: ✅ "Data source is working"

---

## Import Dashboards

1. **Download dashboard files**
   ```bash
   scp pve:/opt/cloudigan-api/grafana-dashboard-import.json ~/Downloads/
   scp pve:/opt/cloudigan-api/monitoring/grafana-dashboard-import.json ~/Downloads/
   ```

2. **Import in Grafana**
   - Click **+** → **Import**
   - Click **Upload JSON file**
   - Select `grafana-dashboard-import.json`
   - Choose **Prometheus** data source
   - Click **Import**

3. **Verify Data**
   - You should now see:
     - Token expiration: ~96 hours
     - Signup metrics (if you've had signups)
     - API request metrics

---

## Verify Metrics Are Being Scraped

### Check Prometheus Targets

```bash
# Via curl
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastScrape: .lastScrape}'

# Or visit in browser
http://your-prometheus-url:9090/targets
```

Should show:
```json
{
  "job": "cloudigan-api",
  "health": "up",
  "lastScrape": "2026-03-26T22:45:00Z"
}
```

### Test Metrics Query

In Grafana **Explore** or Prometheus UI:

```promql
cloudigan_api_datto_token_hours_until_expiry
```

Should return: `96.58` (or current hours remaining)

---

## Troubleshooting

### Dashboard Shows "No Data"

**1. Check metrics endpoint is accessible**
```bash
curl http://10.92.3.181:3000/metrics | grep cloudigan_api
```

**2. Check Prometheus is scraping**
```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check if metrics are in Prometheus
curl 'http://localhost:9090/api/v1/query?query=cloudigan_api_datto_token_hours_until_expiry'
```

**3. Check Grafana data source**
- Go to **Configuration** → **Data Sources** → **Prometheus**
- Click **Save & Test**
- Should see green checkmark

**4. Check time range**
- In dashboard, check time range (top right)
- Try "Last 1 hour" or "Last 6 hours"

### Prometheus Not Scraping

**Check firewall**
```bash
# On Proxmox host
iptables -L -n | grep 3000

# If blocked, allow
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

**Check container networking**
```bash
# From Prometheus host, test connectivity
curl http://10.92.3.181:3000/metrics
```

### Metrics Not Updating

**Restart cloudigan-api**
```bash
ssh pve
pct enter 181
systemctl restart cloudigan-api
systemctl status cloudigan-api
```

**Check logs**
```bash
tail -f /opt/cloudigan-api/logs/combined.log
```

---

## Recommended Setup

For your homelab, I recommend:

1. **Install Prometheus on Proxmox host** (monitors all containers)
2. **Install Grafana on Proxmox host** (centralized dashboards)
3. **Configure Prometheus to scrape**:
   - cloudigan-api-blue (CT181)
   - cloudigan-api-green (CT182)
   - Node exporter on Proxmox
   - Other services

This gives you:
- ✅ Centralized monitoring
- ✅ Survives container restarts
- ✅ Can monitor multiple services
- ✅ Easy to access from anywhere

---

## Quick Start Commands

```bash
# Option 1: Install on Proxmox host
ssh pve
apt update && apt install -y prometheus grafana
# Configure prometheus.yml (see above)
systemctl enable prometheus grafana-server
systemctl start prometheus grafana-server

# Option 2: Docker Compose
ssh pve && pct enter 181
cd /opt/monitoring
docker-compose up -d

# Verify
curl http://localhost:9090/api/v1/targets
curl http://localhost:3000  # Grafana login page
```

---

## Next Steps

1. ✅ Choose installation method (Proxmox host recommended)
2. ✅ Install Prometheus
3. ✅ Install Grafana
4. ✅ Configure Prometheus to scrape cloudigan-api
5. ✅ Add Prometheus data source in Grafana
6. ✅ Import dashboards
7. ✅ Verify metrics are showing
8. ✅ Set up alerts (optional)

Once Prometheus is scraping metrics, your Grafana dashboards will show:
- 🟢 Token expiration countdown
- 📊 Signup success rates
- ⚡ API performance metrics
- 📈 Historical trends
