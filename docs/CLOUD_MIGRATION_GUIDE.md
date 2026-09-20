# End-to-End Cloud Migration Blueprint & 5-Provider Cost Sheet
**Application**: Adilabad App (React SPA + Express Node API + 100GB MySQL DB + Heavy Media Layer)  
**Target Budget**: **$0 to Ultra-Low Cost ($0 - $3.57/mo)**

---

## Executive Summary & System Architecture

This guide provides an end-to-end technical roadmap to host the Adilabad application in the cloud for **$0 to $3.57/month**, supporting up to a **120 GB MySQL Database**, 150 GB of heavy media, 600 GB outbound bandwidth, and 25,000 monthly active users.

```mermaid
flowchart TD
    User["End User Browser"]
    
    subgraph frontend_layer["Frontend Layer ($0/mo)"]
        Vercel["Vercel Global CDN<br/>React SPA"]
    end
    
    subgraph backend_layer["Backend API Layer ($0/mo)"]
        Render["Render Web Service<br/>Node.js / Express API<br/>+ Sharp WebP Compression"]
    end

    subgraph media_layer["Oracle Object Storage Layer ($0 to $3.57/mo)"]
        OracleR2["Oracle Object Storage<br/>10GB Free | 140GB = $3.57/mo<br/>10 TB Free Egress Bandwidth<br/>Global CDN Cache"]
    end

    subgraph db_layer["Database Layer ($0/mo)"]
        OracleVM["Oracle Cloud Always Free VM<br/>Ubuntu 22.04 LTS<br/>4 vCPU ARM Ampere A1<br/>24 GB RAM | 200 GB SSD<br/>MySQL 8.0 Engine"]
    end

    User -->|HTTPS static assets| Vercel
    User -->|HTTPS API requests| Render
    Vercel -->|REST API Calls| Render
    Render -->|SQL Connection Pool 3306| OracleVM
    Render -->|Stream & Compress WebP| OracleR2
    User -->|Direct Image URL load| OracleR2
```

---

## Realistic Startup Usecase Scenario & 5-Provider Cost Sheet

### Scenario Parameters (Growth Scale):
* **Monthly Active Users (MAU)**: 25,000 Users
* **Active MySQL Database Size**: 120 GB (Tuned on 180 GB Disk Volume)
* **Media Storage Volume**: 150 GB (Banners, Store Logos, Product Media)
* **Monthly Media Bandwidth (Egress)**: 600 GB of image downloads / month
* **Monthly API Traffic**: 3 Million Requests / month

---

### Line-Item Cost Comparison Across 5 Cloud Architectures

| Line Item / Resource | **Arch A: Oracle Storage + Hybrid (Recommended)** | **Arch B: Cloudflare R2 + Hybrid** | **Arch C: Microsoft Azure** | **Arch D: Amazon Web Services (AWS)** | **Arch E: Google Cloud (GCP)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA Hosting** | **$0.00** (Vercel Free) | **$0.00** (Vercel Free) | **$0.00** (Static Web Apps Free) | **$5.00** (CloudFront/S3) | **$2.00** (Firebase Hosting) |
| **Backend API Compute** | **$0.00** (Render Free) | **$0.00** (Render Free) | **$13.00** (App Service B1) | **$15.00** (EC2 t3.small) | **$8.00** (Cloud Run) |
| **MySQL Database (120GB)** | **$0.00** (Oracle Always Free 24GB RAM VM) | **$0.00** (Oracle Always Free 24GB RAM VM) | **$32.80** (Azure MySQL Flex B1ms) | **$38.00** (RDS MySQL 120GB) | **$45.00** (Cloud SQL 120GB) |
| **Media Storage (150GB)** | **$3.57** (10GB Free + 140GB @ $0.0255/GB) | **$2.10** (10GB Free + 140GB @ $0.015/GB) | **$3.20** (Azure Blob Hot 150GB) | **$3.45** (S3 Standard 150GB) | **$3.00** (GCS Standard 150GB) |
| **Media Egress (600GB)** | **$0.00** (Included in Oracle 10 TB Free Egress!) | **$0.00** (Included in R2 $0 Egress) | **$43.50** (500GB @ $0.087/GB Egress) | **$51.00** ($0.085/GB CloudFront) | **$66.00** ($0.11/GB Egress) |
| **API Requests (3M/mo)** | **$0.00** | **$0.00** | **$0.00** | **$3.00** | **$2.40** |
| **TOTAL MONTHLY COST** | 🏆 **$3.57 / month** | 🥈 **$2.10 / month** | 🥉 **$92.50 / month** | ❌ **$115.45 / month** | ❌ **$126.40 / month** |

---

## 1. Always Free Guarantees & Platform Boundaries

### A. Oracle Cloud Infrastructure (OCI) Always Free Tier
* **200 GB Block Storage** (NVMe SSD backed).
* **4 ARM OCPUs (Ampere A1) + 24 GB RAM**.
* **10 TB / Month Outbound Data Transfer**.
* **10 GB Object Storage Free**.

### B. Vercel (Frontend SPA)
* **100 GB Bandwidth / Month**, 100 custom domains, free automatic SSL certificates.

### C. Render (Express API)
* **750 compute hours/month**, free SSL certificate.
