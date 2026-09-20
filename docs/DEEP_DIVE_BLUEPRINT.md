# Comprehensive Deep-Dive Architecture & Implementation Blueprint
**Application**: Adilabad Application (React SPA + Node.js Express API + 100GB MySQL DB + Heavy Media Layer)  
**Target Budget**: **$0 to $1.35/month**  
**Target Architecture**: Vercel (Frontend) + Render (Backend API) + Oracle Cloud Always Free (100GB MySQL DB) + Cloudflare R2 / Oracle Object Storage

---

## Table of Contents
1. [Module 1: End-to-End Architecture & Network Traffic Flow](#module-1-end-to-end-architecture--network-traffic-flow)
2. [Module 2: 100 GB MySQL Database Deep-Dive (Oracle Cloud VM)](#module-2-100-gb-mysql-database-deep-dive-oracle-cloud-vm)
3. [Module 3: Heavy Media Optimization & CDN Pipeline](#module-3-heavy-media-optimization--cdn-pipeline)
4. [Module 4: Codebase Refactoring Specifications](#module-4-codebase-refactoring-specifications)
5. [Module 5: Step-by-Step Deployment Runbook](#module-5-step-by-step-deployment-runbook)
6. [Module 6: Operations, Backups & Disaster Recovery](#module-6-operations-backups--disaster-recovery)

---

## Module 1: End-to-End Architecture & Network Traffic Flow

### 1. Architectural Topology

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        Browser["User Browser / Mobile Device"]
    end

    subgraph Edge["Global Edge & CDN Layer ($0/mo)"]
        VercelCDN["Vercel Global Edge CDN<br/>Serves Compiled React SPA<br/>Auto SSL / TLS 1.3"]
        CloudflareCDN["Cloudflare Global CDN<br/>Serves WebP Images from R2<br/>Cache-Control: 1 Year"]
    end

    subgraph Application["Compute Layer ($0/mo)"]
        RenderAPI["Render Web Service<br/>Node.js 20 Express API<br/>Sharp WebP Image Pipeline<br/>Keep-Alive via UptimeRobot"]
    end

    subgraph Storage["Storage & Database Layer ($0 to $1.35/mo)"]
        OracleVM["Oracle Cloud Always Free VM<br/>4 OCPU ARM Ampere A1 | 24 GB RAM<br/>180 GB NVMe SSD<br/>MySQL 8.0 Engine (16GB Buffer Pool)"]
        R2Storage["Cloudflare R2 Object Storage<br/>10 GB Free | $0.015/GB beyond<br/>$0.00 Egress Bandwidth Fees"]
    end

    Browser -->|1. Load HTML/JS/CSS| VercelCDN
    Browser -->|2. REST API Requests HTTPS| RenderAPI
    RenderAPI -->|3. TCP Connection Pool 3306| OracleVM
    RenderAPI -->|4. Stream WebP Uploads| R2Storage
    Browser -->|5. Load Images HTTPS| CloudflareCDN
    CloudflareCDN -->|Cache Miss| R2Storage
```

### 2. Request & Connection Lifecycle

1. **Static SPA Delivery**: User navigates to `https://adilabadapp.com`. Vercel's Edge Network serves static HTML, JS, and CSS in `<15ms`.
2. **CORS Handshake & Authentication**: Frontend sends `OPTIONS` / `POST /api/user/login` to Render API (`https://adilabad-backend.onrender.com`). Render responds with CORS headers allowing `https://adilabadapp.com`.
3. **Database Queries**: Express uses a persistent MySQL connection pool (`mysql.createPool`) connecting over TCP to Oracle VM Public IP on port `3306`.
4. **Media Fetching**: Image URLs point to Cloudflare CDN (`https://media.adilabadapp.com/uploads/xyz.webp`). Images are served directly from edge memory, bypassing backend servers entirely.

---

## Module 2: 100 GB MySQL Database Deep-Dive (Oracle Cloud VM)

Hosting a **100 GB production MySQL database for $0/month** requires leveraging Oracle Cloud's **Ampere A1 Compute Core (4 OCPUs, 24 GB RAM)** and applying database kernel tuning.

### 1. Oracle VM Hardware & System Configuration
* **OS**: Ubuntu 22.04 LTS (ARM64).
* **vCPU**: 4 OCPUs (dedicated ARM 64-bit cores).
* **RAM**: 24 GB RAM.
* **Disk**: 180 GB NVMe Block Storage.

### 2. System Level Sizing & Swap Tuning
Add 4 GB Swap space to prevent Out-Of-Memory (OOM) killer during heavy spikes:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

Increase system file handle limits in `/etc/security/limits.conf`:
```ini
mysql soft nofile 65535
mysql hard nofile 65535
```

### 3. Production MySQL 8.0 `my.cnf` Configuration (Tuned for 100GB Data)
File path: `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
[mysqld]
# Networking
user                    = mysql
pid-file                = /var/run/mysqld/mysqld.pid
socket                  = /var/run/mysqld/mysqld.sock
port                    = 3306
bind-address            = 0.0.0.0

# Connection Sizing
max_connections         = 250
max_connect_errors      = 10000
thread_cache_size       = 32
table_open_cache        = 4000
open_files_limit        = 65535

# Memory Optimization for 24GB RAM Node
# Allocate 16GB RAM specifically to InnoDB Buffer Pool to cache 100GB indexes/hot rows
innodb_buffer_pool_size         = 16G
innodb_buffer_pool_instances    = 8
innodb_log_file_size            = 2G
innodb_log_buffer_size          = 64M
innodb_flush_log_at_trx_commit  = 2
innodb_flush_method             = O_DIRECT
innodb_file_per_table           = 1

# I/O Capacity for NVMe SSD
innodb_io_capacity              = 2000
innodb_io_capacity_max          = 4000
innodb_read_io_threads          = 8
innodb_write_io_threads         = 8

# Query & Sort Buffers
tmp_table_size                  = 128M
max_heap_table_size             = 128M
sort_buffer_size                = 2M
read_buffer_size                = 2M
join_buffer_size                = 4M

# Character Set
character-set-server            = utf8mb4
collation-server                = utf8mb4_unicode_ci
```

---

## Module 3: Heavy Media Optimization & CDN Pipeline

If raw images are uploaded directly, a 100GB media library will incur high bandwidth costs on AWS/GCP. Using **Cloudflare R2** or **Oracle Object Storage** and **Sharp WebP Compression** slashes storage needs by 80% and eliminates bandwidth bills.

### 1. Cost Comparison Architecture

```
Raw Camera Upload (5.0 MB JPEG)
            │
            ▼
[Node.js Express + Sharp Pipeline]
            │
            ├────► Converts to WebP format (80% quality)
            ├────► Resizes to max 1200px width
            │
            ▼
Compressed Upload (220 KB WebP) ──► Saved to Cloudflare R2 / Oracle Storage
                                    (Zero Bandwidth Egress Fees!)
```

---

## Module 4: Operations, Backups & Disaster Recovery

### 1. Automated Rolling Database Backups

On Oracle VM, create backup script `/home/ubuntu/scripts/db_backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y-%m-%d_%H%M%S")
mkdir -p $BACKUP_DIR

mysqldump -u adilabaduser -p'ProductionPass123!' --single-transaction --quick adilabadDb | gzip > $BACKUP_DIR/adilabadDb_$DATE.sql.gz

find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
```

Add execute permissions & crontab entry (Runs every night at 2:00 AM):
```bash
chmod +x /home/ubuntu/scripts/db_backup.sh
crontab -e
```
Add line:
```cron
0 2 * * * /home/ubuntu/scripts/db_backup.sh > /dev/null 2>&1
```
