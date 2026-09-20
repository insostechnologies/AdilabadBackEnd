# Step-by-Step Deployment & Execution Runbook (Next Steps)
**Application**: Adilabad App (React SPA + Express Node API + 100GB MySQL DB + Heavy Media Layer)  
**Target Monthly Budget**: **$0 to $3.57 / Month**

---

## Phase 1: Merge GitHub Pull Requests

1. **Backend Pull Request**:
   * Open [https://github.com/insostechnologies/AdilabadBackEnd/pull/new/feature/cloud-migration](https://github.com/insostechnologies/AdilabadBackEnd/pull/new/feature/cloud-migration).
   * Click **Create Pull Request** -> **Merge Pull Request** -> **Confirm Merge**.
2. **Frontend Pull Request**:
   * Open [https://github.com/insostechnologies/AdilabadFrontEnd/pull/new/feature/cloud-migration](https://github.com/insostechnologies/AdilabadFrontEnd/pull/new/feature/cloud-migration).
   * Click **Create Pull Request** -> **Merge Pull Request** -> **Confirm Merge**.

---

## Phase 2: Oracle Cloud Account & Always Free VM Setup (Database)

1. **Register Account**:
   * Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
   * Enter registration details and provide a valid credit/debit card for identity verification ($1 temporary authorization hold, refunded immediately).
2. **Launch Always Free Ampere Instance**:
   * In Oracle Console, go to **Compute > Instances > Create Instance**.
   * **Name**: `adilabad-mysql-db`
   * **Image**: `Ubuntu 22.04 LTS` (ARM64)
   * **Shape**: `VM.Standard.A1.Flex` -> Select **4 OCPUs, 24 GB RAM** (Look for the "Always Free Eligible" tag).
   * **Boot Volume**: Select **Customize Boot Volume Size** and set to **180 GB**.
   * **SSH Keys**: Download and save your Private Key file as `oracle.key`.
   * Click **Create**. Note your assigned **Public IP Address** (e.g. `129.146.x.x`).
3. **Configure VCN Network Security Rules**:
   * In Oracle Console, go to **Networking > Virtual Cloud Networks > Default Security List > Ingress Rules**.
   * Click **Add Ingress Rules**:
     * **Source CIDR**: `0.0.0.0/0`
     * **IP Protocol**: `TCP`
     * **Destination Port Range**: `3306`
   * Click **Add Ingress Rules**.

---

## Phase 3: Oracle VM Configuration, MySQL 8.0 Tuning & Data Import

1. **SSH into Oracle VM**:
   ```bash
   chmod 400 oracle.key
   ssh -i oracle.key ubuntu@<ORACLE_PUBLIC_IP>
   ```

2. **Add Swap Space (4GB)**:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
   ```

3. **Install MySQL 8.0**:
   ```bash
   sudo apt update && sudo apt install -y mysql-server
   ```

4. **Tune MySQL 8.0 Configuration for 100GB+ Data**:
   Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   ```
   Add/Update these settings under `[mysqld]`:
   ```ini
   [mysqld]
   bind-address            = 0.0.0.0
   max_connections         = 250
   innodb_buffer_pool_size = 16G
   innodb_buffer_pool_instances = 8
   innodb_log_file_size    = 2G
   innodb_flush_log_at_trx_commit = 2
   innodb_flush_method     = O_DIRECT
   ```
   Save and restart MySQL:
   ```bash
   sudo systemctl restart mysql
   ```

5. **Create Production Database & User**:
   ```bash
   sudo mysql
   ```
   Execute SQL statements:
   ```sql
   CREATE DATABASE adilabadDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'adilabaduser'@'%' IDENTIFIED BY 'YourStrongDBPassword123!';
   GRANT ALL PRIVILEGES ON adilabadDb.* TO 'adilabaduser'@'%';
   FLUSH PRIVILEGES;
   EXIT;
   ```

6. **Configure Ubuntu OS Firewall (iptables)**:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3306 -j ACCEPT
   sudo netfilter-persistent save
   ```

7. **Export Local Database & Stream to Oracle VM**:
   From your local development machine:
   ```bash
   # Export local database to compressed dump
   mysqldump -u root -p --single-transaction --quick --routines --triggers adilabadDb | gzip > adilabad_dump.sql.gz

   # Transfer dump file to Oracle VM
   rsync -P -e "ssh -i oracle.key" adilabad_dump.sql.gz ubuntu@<ORACLE_PUBLIC_IP>:/home/ubuntu/

   # Import dump on Oracle VM
   ssh -i oracle.key ubuntu@<ORACLE_PUBLIC_IP>
   gunzip -c adilabad_dump.sql.gz | mysql -u adilabaduser -pYourStrongDBPassword123! adilabadDb
   ```

---

## Phase 4: Deploy Express Backend API to Render

1. Sign up / Log in at [Render.com](https://render.com).
2. Click **New + > Web Service** and select `insostechnologies/AdilabadBackEnd`.
3. Configure settings:
   * **Name**: `adilabad-backend`
   * **Region**: Oregon (US West) or closest region
   * **Branch**: `master` (or `main`)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node index.js`
4. Go to **Environment Variables** and add:
   * `ENV` = `prod`
   * `PORT` = `5000`
   * `DB_HOST` = `<ORACLE_PUBLIC_IP>`
   * `DB_USER` = `adilabaduser`
   * `DB_PASSWORD` = `YourStrongDBPassword123!`
   * `DB_NAME` = `adilabadDb`
   * `JWT_KEY_SECRET` = `7208c08d8aba1f11a6b6e49a36a25d89`
   * `URL_FRONTEND` = `https://www.adilabadapp.com`
   * `URL_BACKEND` = `https://adilabad-backend.onrender.com`
5. Click **Create Web Service**. Render will deploy your API.
6. Verify live backend health check endpoint in browser: `https://adilabad-backend.onrender.com/` (should return JSON `{ status: true, message: "Adilabad API server running [prod]" }`).

---

## Phase 5: Deploy React SPA Frontend to Vercel

1. Sign up / Log in at [Vercel.com](https://vercel.com).
2. Click **Add New > Project** and import `insostechnologies/AdilabadFrontEnd`.
3. Configure settings:
   * **Framework Preset**: `Create React App`
   * **Build Command**: `npm run build`
   * **Output Directory**: `build`
4. Expand **Environment Variables** and add:
   * `REACT_APP_API_URL` = `https://adilabad-backend.onrender.com/`
   * `REACT_APP_FRONTEND_URL` = `https://www.adilabadapp.com/`
5. Click **Deploy**. Vercel will build and deploy your React app.
6. Configure Custom Domain in Vercel:
   * Go to **Project Settings > Domains** and add `adilabadapp.com` & `www.adilabadapp.com`.
   * Update your Domain DNS registrar (GoDaddy, Namecheap, Cloudflare DNS, etc.):
     * **CNAME Record**: `www` -> `cname.vercel-dns.com`
     * **A Record**: `@` -> `76.76.21.21`

---

## Phase 6: Keep-Alive Monitor, Object Storage & Backups

1. **Set Up 24/7 Keep-Alive Uptime Monitor (Prevents Render Sleep)**:
   * Sign up at [UptimeRobot.com](https://uptimerobot.com) (100% Free).
   * Create New Monitor: `HTTP(s)`
   * URL: `https://adilabad-backend.onrender.com/`
   * Interval: **Every 5 minutes**.
   * *Result*: Render backend stays awake 24/7 with zero latency cold starts!

2. **Configure Oracle Object Storage / Cloudflare R2 for Uploads**:
   * Create bucket `adilabad-media` in Oracle Cloud Console or Cloudflare Dashboard.
   * Add bucket name and keys to Render Environment Variables (`STORAGE_PROVIDER`, `STORAGE_BUCKET_NAME`, etc.).

3. **Set Up Daily Automated MySQL Backup Cron Job**:
   On your Oracle VM, create backup script `/home/ubuntu/backup.sh`:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/ubuntu/backups"
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   mkdir -p $BACKUP_DIR

   mysqldump -u adilabaduser -p'YourStrongDBPassword123!' --single-transaction adilabadDb | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz
   find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
   ```
   Add execute permissions & crontab entry:
   ```bash
   chmod +x /home/ubuntu/backup.sh
   (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh > /dev/null 2>&1") | crontab -
   ```

---

## Summary Checklist

- [ ] Phase 1: Merge PRs on GitHub
- [ ] Phase 2: Provision Oracle Always Free VM (4 Core ARM, 24GB RAM, 180GB SSD)
- [ ] Phase 3: Tune MySQL 8.0, open port 3306, and import database dump
- [ ] Phase 4: Deploy Render Backend API & verify HTTP 200 health check
- [ ] Phase 5: Deploy Vercel Frontend SPA & configure DNS domain
- [ ] Phase 6: Enable 5-minute UptimeRobot ping & daily backup cron job
