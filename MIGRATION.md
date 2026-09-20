# Adilabad Backend Cloud Migration & Deployment Guide

This document contains step-by-step instructions for deploying and running the **Adilabad Backend API** in a cloud environment (Render, Railway, GCP Cloud Run, or Docker Host) connected to an **Oracle Cloud Always Free MySQL 8.0 Instance**.

---

## 1. Environment Variable Reference

Copy `.env.example` to `.env` or set these environment variables in your cloud hosting provider dashboard (e.g. Render Dashboard):

| Key | Description | Example / Default |
| :--- | :--- | :--- |
| `ENV` | Environment identifier (`dev` or `prod`) | `prod` |
| `PORT` | Dynamic web port assigned by cloud PaaS | `5000` |
| `JWT_KEY_SECRET` | Secret key for signing JSON Web Tokens | `your_jwt_secret_key` |
| `DB_HOST` | Public IP or hostname of your MySQL database | `<ORACLE_VM_PUBLIC_IP>` |
| `DB_USER` | MySQL database username | `adilabaduser` |
| `DB_PASSWORD` | MySQL database password | `StrongPassword123!` |
| `DB_NAME` | MySQL database name | `adilabadDb` |
| `URL_BACKEND` | Live backend public API URL | `https://adilabad-backend.onrender.com` |
| `URL_FRONTEND` | Live frontend SPA domain | `https://www.adilabadapp.com` |
| `STORAGE_PROVIDER` | Object storage engine (`oracle`, `r2`, `s3`) | `oracle` |
| `STORAGE_BUCKET_NAME` | Bucket name for media uploads | `adilabad-media` |

---

## 2. Docker Build & Run (Local / Server)

### Build Image
```bash
docker build -t adilabad-backend:latest .
```

### Run Container
```bash
docker run -d \
  --name adilabad-api \
  -p 5000:5000 \
  --env-file .env \
  adilabad-backend:latest
```

---

## 3. Render Web Service Deployment

1. Sign in to [Render.com](https://render.com).
2. Create **New Web Service** and link the `AdilabadBackEnd` repository.
3. Configure runtime:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add all required Environment Variables listed above under **Settings > Environment**.
5. Click **Deploy**.

---

## 4. Oracle Cloud MySQL Database Tuning Guide

When deploying MySQL 8.0 on Oracle Cloud's Always Free Ampere VM (4 OCPUs, 24 GB RAM, 180 GB Disk):

1. Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
   ```ini
   [mysqld]
   bind-address = 0.0.0.0
   max_connections = 250
   innodb_buffer_pool_size = 16G
   innodb_log_file_size = 2G
   innodb_flush_log_at_trx_commit = 2
   ```
2. Restart MySQL: `sudo systemctl restart mysql`
3. Open firewall port `3306`:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3306 -j ACCEPT
   sudo netfilter-persistent save
   ```

---

## 5. Daily Automated MySQL Backup Cron Job

On the Oracle VM, create backup script `/home/ubuntu/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

mysqldump -u adilabaduser -p'StrongPassword123!' --single-transaction adilabadDb | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Retain backups for 7 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
```
Add to `crontab -e`:
```cron
0 2 * * * /bin/bash /home/ubuntu/backup.sh > /dev/null 2>&1
```
