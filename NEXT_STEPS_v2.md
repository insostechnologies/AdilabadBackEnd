# Step-by-Step Deployment Runbook v2 (Next Steps)
**Application**: Adilabad App (React SPA + Express Node API + 120GB MySQL DB + Cloudflare R2 Media)  
**Budget**: **~$17.50 – $20.00 / Month** (Well within $25.00/mo ceiling)  
**Publication Date**: October 25, 2026  
**Status**: Production Execution Blueprint  

---

## Architecture Overview

* **Frontend**: React SPA deployed on **Cloudflare Pages** or **Vercel** ($0.00/mo).
* **Media & Uploads**: **Cloudflare R2** with Custom Domain `media.adilabadapp.com` ($2.10/mo, $0 egress).
* **Compute & Database**: **Dedicated Cloud VPS (Hetzner CPX31 or Hostinger KVM 4)** running Ubuntu 24.04 LTS, Nginx, Node.js 20 LTS (PM2), and MySQL 8.0.
* **DNS & SSL**: Cloudflare DNS + Automated Let's Encrypt SSL.

---

## Phase 1: Cloudflare R2 Object Storage Setup

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, click **R2 Storage** > **Create bucket**:
   * **Bucket Name**: `adilabad-media`
   * **Location**: Automatic (or closest region)
   * Click **Create Bucket**.
3. Create a second bucket for database backups:
   * **Bucket Name**: `adilabad-backups`
   * Under bucket settings > **Lifecycle Rules**, add rule: Delete objects older than **30 days**.
4. Configure Custom Domain for `adilabad-media`:
   * In `adilabad-media` > **Settings** > **Public Access** > **Connect Domain**.
   * Enter: `media.adilabadapp.com`.
   * Click **Continue** > **Connect Domain** (Cloudflare manages the SSL certificate and global edge caching automatically).
5. Generate R2 S3 API Credentials:
   * Go to **R2 Storage** > **Manage R2 API Tokens** > **Create API Token**.
   * **Permissions**: *Object Read & Write*.
   * **Apply to**: *Specify buckets* -> Select `adilabad-media` and `adilabad-backups`.
   * Click **Create API Token**.
   * **Save safely**:
     * **Access Key ID**
     * **Secret Access Key**
     * **Endpoint URL** (e.g., `https://<account_id>.r2.cloudflarestorage.com`)

---

## Phase 2: Provision Cloud VPS Server

1. **Choose Provider & Launch Instance**:
   * **Option A (Hetzner Cloud - Recommended for Performance)**:
     * Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud).
     * Add Server: Location **Falkenstein/Nuremberg** or **Hillsboro (US)**.
     * Image: **Ubuntu 24.04 LTS x64**.
     * Type: **Standard / Dedicated** -> Select **CPX31** (4 vCPU AMD, 8 GB RAM, 160 GB NVMe) or **CX32** (~$14.80/mo).
     * Backups: Check **Enable Backups** (+20%, ~$2.90/mo).
     * SSH Key: Upload your public SSH key (`~/.ssh/id_rsa.pub` or `~/.ssh/id_ed25519.pub`).
     * Click **Create & Buy Now**. Note the assigned **Server Public IP** (e.g., `159.69.x.x`).
   * **Option B (Hostinger KVM 4 - Recommended for Indian Local Latency)**:
     * Sign up at [hostinger.in](https://www.hostinger.in/vps-hosting).
     * Select **KVM 4** (4 vCPU, 16 GB RAM, 200 GB NVMe) with **Mumbai, India** location.
     * Note your assigned **Server Public IP**.

2. **Configure DNS Records** in your domain registrar (or Cloudflare DNS):
   * `A` Record: `api.adilabadapp.com` -> `<SERVER_PUBLIC_IP>` (Proxy status: DNS only / Grey cloud during initial SSL setup).
   * `A` Record: `@` -> Points to Vercel/Cloudflare Pages (or `cname.vercel-dns.com`).

---

## Phase 3: Server OS Hardening & Security

1. **SSH into the Server**:
   ```bash
   ssh root@<SERVER_PUBLIC_IP>
   ```

2. **Update Packages & Install Core Utilities**:
   ```bash
   apt update && apt upgrade -y
   apt install -y ufw curl wget git htop iotop rsync unzip ca-certificates gnupg lsb-release
   ```

3. **Configure Swap Space (4 GB Buffer)**:
   ```bash
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
   sysctl vm.swappiness=10
   echo 'vm.swappiness=10' >> /etc/sysctl.conf
   ```

4. **Configure UFW Firewall (Strict Inbound Policy)**:
   *MySQL port 3306 is explicitly NOT opened to the public internet.*
   ```bash
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 22/tcp       # SSH
   ufw allow 80/tcp       # HTTP (Certbot & Web)
   ufw allow 443/tcp      # HTTPS
   ufw --force enable
   ufw status verbose
   ```

---

## Phase 4: Install & Tune MySQL 8.0 for 120GB Database

1. **Install MySQL Server**:
   ```bash
   apt install -y mysql-server
   ```

2. **Tune InnoDB Configuration for High Performance**:
   Open `/etc/mysql/mysql.conf.d/mysqld.cnf`:
   ```bash
   nano /etc/mysql/mysql.conf.d/mysqld.cnf
   ```
   Add or update these settings under `[mysqld]`:
   ```ini
   [mysqld]
   # Bind strictly to localhost (Zero public attack surface)
   bind-address                   = 127.0.0.1
   port                           = 3306

   # Memory & Buffer Pool (Adjust to 5G-6G for 8GB RAM VPS; 10G for 16GB RAM VPS)
   innodb_buffer_pool_size        = 6G
   innodb_buffer_pool_instances  = 6
   innodb_log_file_size           = 1G
   innodb_log_buffer_size         = 64M

   # Fast NVMe I/O Settings
   innodb_flush_log_at_trx_commit = 2
   innodb_flush_method            = O_DIRECT
   innodb_file_per_table          = 1
   innodb_stats_on_metadata       = 0

   # Connection & Thread Limits
   max_connections                = 300
   max_connect_errors             = 10000
   thread_cache_size              = 32
   table_open_cache               = 4000
   open_files_limit               = 65535

   # Character Set
   character-set-server           = utf8mb4
   collation-server               = utf8mb4_unicode_ci
   ```
   Save the file (`Ctrl+O`, `Enter`, `Ctrl+X`) and restart MySQL:
   ```bash
   systemctl restart mysql
   systemctl enable mysql
   ```

3. **Create Database & Production User**:
   ```bash
   mysql -u root
   ```
   Run the SQL statements:
   ```sql
   CREATE DATABASE adilabadDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'adilabaduser'@'127.0.0.1' IDENTIFIED BY 'StrongProductionPassword2026!';
   GRANT ALL PRIVILEGES ON adilabadDb.* TO 'adilabaduser'@'127.0.0.1';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## Phase 5: Export Local Database & Stream to Production VPS

1. **From your local machine (where the local database currently resides)**:
   ```bash
   # Export database with single transaction and quick streaming
   mysqldump -u root -p --single-transaction --quick --routines --triggers --set-gtid-purged=OFF adilabadDb | gzip > adilabad_prod_dump.sql.gz

   # Transfer compressed dump via rsync (shows progress bar and resumes if interrupted)
   rsync -avP adilabad_prod_dump.sql.gz root@<SERVER_PUBLIC_IP>:/root/
   ```

2. **On the Server, import the compressed dump directly**:
   ```bash
   ssh root@<SERVER_PUBLIC_IP>
   gunzip -c /root/adilabad_prod_dump.sql.gz | mysql -u adilabaduser -p'StrongProductionPassword2026!' adilabadDb
   
   # Verify table counts
   mysql -u adilabaduser -p'StrongProductionPassword2026!' -e "SELECT count(*) FROM information_schema.tables WHERE table_schema='adilabadDb';"
   
   # Remove dump file to save disk space
   rm /root/adilabad_prod_dump.sql.gz
   ```

---

## Phase 6: Install Node.js 20 LTS & Deploy Backend API

1. **Install Node.js 20 LTS & PM2 Process Manager**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   npm install -g pm2
   ```

2. **Clone Backend Repository**:
   ```bash
   mkdir -p /var/www
   cd /var/www
   git clone https://github.com/insostechnologies/AdilabadBackEnd.git adilabad-backend
   cd adilabad-backend
   npm install --production
   ```

3. **Configure Production Environment File (`.env`)**:
   ```bash
   nano /var/www/adilabad-backend/.env
   ```
   Add production configuration:
   ```ini
   ENV=prod
   PORT=5000
   
   # Database (Localhost connection with 0ms latency)
   DB_HOST=127.0.0.1
   DB_USER=adilabaduser
   DB_PASSWORD=StrongProductionPassword2026!
   DB_NAME=adilabadDb
   
   # Authentication & URLs
   JWT_KEY_SECRET=7208c08d8aba1f11a6b6e49a36a25d89
   URL_FRONTEND=https://www.adilabadapp.com
   URL_BACKEND=https://api.adilabadapp.com
   
   # Cloudflare R2 Media Storage
   STORAGE_PROVIDER=r2
   STORAGE_BUCKET_NAME=adilabad-media
   STORAGE_ENDPOINT=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
   STORAGE_ACCESS_KEY_ID=<YOUR_R2_ACCESS_KEY_ID>
   STORAGE_SECRET_ACCESS_KEY=<YOUR_R2_SECRET_ACCESS_KEY>
   STORAGE_PUBLIC_DOMAIN=https://media.adilabadapp.com
   ```

4. **Launch API with PM2 Cluster**:
   ```bash
   pm2 start index.js -i 2 --name "adilabad-api" --max-memory-restart 1500M
   pm2 save
   pm2 startup
   # Run the command output by 'pm2 startup' to enable auto-start on server reboot
   ```

---

## Phase 7: Configure Nginx Reverse Proxy & Let's Encrypt SSL

1. **Install Nginx & Certbot**:
   ```bash
   apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Create Nginx Configuration**:
   ```bash
   nano /etc/nginx/sites-available/api.adilabadapp.com
   ```
   Paste the following:
   ```nginx
   server {
       listen 80;
       server_name api.adilabadapp.com;

       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 90;
       }
   }
   ```

3. **Enable Site & Test Nginx**:
   ```bash
   ln -s /etc/nginx/sites-available/api.adilabadapp.com /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

4. **Obtain Free SSL Certificate via Certbot**:
   ```bash
   certbot --nginx -d api.adilabadapp.com --non-interactive --agree-tos -m admin@adilabadapp.com
   ```

5. **Verify Live Backend API**:
   Open in your browser: `https://api.adilabadapp.com/`  
   Should return: `{"status":true,"message":"Adilabad API server running [prod]"}`.

---

## Phase 8: Deploy React SPA Frontend (Cloudflare Pages or Vercel)

1. **Cloudflare Pages Deployment (Recommended - Unlimited Free Bandwidth)**:
   * Go to Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   * Select `insostechnologies/AdilabadFrontEnd`.
   * **Build Settings**:
     * Framework preset: `Create React App`
     * Build command: `npm run build`
     * Build output directory: `build`
   * **Environment Variables**:
     * `REACT_APP_API_URL` = `https://api.adilabadapp.com/`
     * `REACT_APP_FRONTEND_URL` = `https://www.adilabadapp.com/`
   * Click **Save and Deploy**.
   * Under **Custom domains**, add `adilabadapp.com` and `www.adilabadapp.com`.

*(Alternatively, deploy on Vercel with the same settings if preferred).*

---

## Phase 9: Automated Daily Offsite Backup to Cloudflare R2

1. **Install AWS CLI for lightweight R2 syncing**:
   ```bash
   apt install -y awscli
   ```

2. **Configure AWS CLI credentials for R2**:
   ```bash
   mkdir -p /root/.aws
   cat << 'EOF' > /root/.aws/credentials
   [default]
   aws_access_key_id = <YOUR_R2_ACCESS_KEY_ID>
   aws_secret_access_key = <YOUR_R2_SECRET_ACCESS_KEY>
   EOF

   cat << 'EOF' > /root/.aws/config
   [default]
   region = auto
   output = json
   EOF
   ```

3. **Create the Backup Script**:
   ```bash
   nano /usr/local/bin/backup_db_to_r2.sh
   ```
   Paste the following:
   ```bash
   #!/bin/bash
   set -e

   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_DIR="/tmp/db_backups"
   FILENAME="adilabadDb_${TIMESTAMP}.sql.gz"
   R2_ENDPOINT="https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com"
   R2_BUCKET="s3://adilabad-backups"

   mkdir -p ${BACKUP_DIR}

   # Perform compressed dump
   mysqldump -u adilabaduser -p'StrongProductionPassword2026!' --single-transaction --quick adilabadDb | gzip > ${BACKUP_DIR}/${FILENAME}

   # Upload to Cloudflare R2
   aws --endpoint-url ${R2_ENDPOINT} s3 cp ${BACKUP_DIR}/${FILENAME} ${R2_BUCKET}/${FILENAME}

   # Clean local temp file
   rm ${BACKUP_DIR}/${FILENAME}

   echo "[$(date)] Backup ${FILENAME} successfully pushed to Cloudflare R2."
   ```

4. **Make Executable and Add Cron Schedule**:
   ```bash
   chmod +x /usr/local/bin/backup_db_to_r2.sh
   (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup_db_to_r2.sh >> /var/log/db_backup.log 2>&1") | crontab -
   ```

---

## Phase 10: Production Verification Checklist

- [ ] **Cloudflare R2**: Bucket `adilabad-media` active with domain `media.adilabadapp.com`.
- [ ] **VPS Firewall**: UFW active, ports 22, 80, 443 allowed; MySQL 3306 strictly closed externally.
- [ ] **MySQL 8.0**: Tuned with `innodb_buffer_pool_size = 6G`, 120GB dump imported without errors.
- [ ] **Backend Express API**: Running under PM2 cluster mode on `127.0.0.1:5000` with auto-restart on reboot.
- [ ] **Nginx & SSL**: Valid Let's Encrypt certificate on `https://api.adilabadapp.com`.
- [ ] **Image Upload Test**: Uploading a banner in admin generates an optimized `.webp` file in Cloudflare R2 and serves via `media.adilabadapp.com`.
- [ ] **Frontend React SPA**: Production build live on `https://www.adilabadapp.com` communicating with API.
- [ ] **Automated Backups**: Tested manual run of `/usr/local/bin/backup_db_to_r2.sh`; verified archive appears in `adilabad-backups` bucket.
