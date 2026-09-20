# End-to-End System & User Functional Flow Documentation
**Application**: Adilabad Application (React SPA + Node.js Express API + MySQL 8.0)

This document details the functional user journeys, network communications, data lifecycle, and backend-frontend interaction sequences across both services.

---

## 1. User Registration & Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Customer
    participant React as React SPA (Frontend)
    participant Express as Express API (Backend)
    participant SMS as Fast2SMS Gateway
    participant MySQL as MySQL Database (Oracle VM)

    Customer->>React: Enters Phone Number & Clicks Send OTP
    React->>Express: POST /api/user/send-otp { phone: "9876543210" }
    Note over Express: Rate limiter checks request threshold (max 5/10min)
    Express->>SMS: Triggers SMS API with generated 6-digit OTP
    SMS-->>Customer: Delivers SMS with OTP code
    Customer->>React: Inputs 6-digit OTP code & Password
    React->>Express: POST /api/user/verify-otp { phone, otp, password }
    Express->>MySQL: SELECT * FROM users WHERE phone = ?
    Express->>Express: Verifies Bcrypt hash / OTP token
    Express->>Express: Generates JWT Token (signed with secret)
    Express-->>React: HTTP 200 { status: true, token: "eyJhbGci...", user: {...} }
    React->>React: Saves JWT to localStorage & sets Auth Context
    React-->>Customer: Redirects to Customer Home Marketplace
```

---

## 2. Merchant Store Onboarding & Admin Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Vendor
    actor Admin as Platform Admin
    participant React as Vendor Portal (React SPA)
    participant Express as Express API (Backend)
    participant Storage as Cloud Storage (Oracle/R2)
    participant MySQL as MySQL Database

    Merchant->>React: Fills Business Form & Uploads Store Logo
    React->>Express: POST /api/store/create (Multipart Form Data)
    Note over Express: Emoji guard sanitizes string inputs
    Express->>Express: Sharp converts logo to WebP (80% quality)
    Express->>Storage: Streams WebP buffer to S3 Bucket
    Storage-->>Express: Returns Public CDN URL
    Express->>MySQL: INSERT INTO store (user_id, store_name, status)
    Express-->>React: HTTP 200 { status: true, message: "Store submitted for review" }
    
    Admin->>React: Opens Admin Dashboard -> Pending Stores
    React->>Express: GET /api/admin/stores/pending (Bearer JWT)
    Express->>MySQL: SELECT * FROM store WHERE status = 'pending'
    MySQL-->>Express: Returns pending stores list
    Express-->>React: Renders Material React Table
    Admin->>React: Clicks Approve Store
    React->>Express: PUT /api/admin/store/approve { store_id: 123 }
    Express->>MySQL: UPDATE store SET status = 'active' WHERE id = 123
    Express-->>React: HTTP 200 { status: true, message: "Store approved" }
```

---

## 3. Product Catalog Upload & Sharp Optimization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Approved Merchant
    participant React as Vendor Portal (React SPA)
    participant Express as Express API (Backend)
    participant Sharp as Sharp WebP Processor
    participant Storage as Cloud Storage (Oracle/R2)
    participant MySQL as MySQL Database

    Merchant->>React: Clicks Add Product (Enters Details & Photo)
    React->>Express: POST /api/product/add (Multipart Form)
    Express->>Sharp: Passes raw file buffer
    Sharp->>Sharp: Resizes to max 1200px width & compresses to WebP
    Sharp-->>Express: Returns WebP buffer
    Express->>Storage: Stream WebP buffer to Bucket
    Storage-->>Express: Returns Public Image URL
    Express->>MySQL: INSERT INTO product (store_id, category_id, product_name, price, image_url)
    MySQL-->>Express: Returns inserted product ID
    Express-->>React: HTTP 200 { status: true, product: {...} }
    React-->>Merchant: Toast Notification "Product Added Successfully"
```

---

## 4. Customer Marketplace Search & Catalog Browsing Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as End User
    participant React as Customer Portal (React SPA)
    participant Express as Express API (Backend)
    participant CDN as Vercel / Cloudflare CDN
    participant MySQL as MySQL Database

    Customer->>CDN: Navigates to adilabadapp.com
    CDN-->>Customer: Serves static React HTML/JS bundle
    React->>Express: GET /api/banner/active & GET /api/category/list
    Express->>MySQL: SELECT * FROM banner, SELECT * FROM category
    MySQL-->>Express: Active banners & category tree
    Express-->>React: HTTP 200 JSON payload
    React-->>Customer: Displays Hero Banner Carousel & Category Grid
    
    Customer->>React: Types Sarees in Search Bar
    React->>Express: GET /api/keywords/search?q=Sarees
    Express->>MySQL: SELECT * FROM product JOIN store WHERE MATCH(...)
    Note over MySQL: Uses idx_product_store_id index for fast query
    MySQL-->>Express: Matching product rows
    Express-->>React: HTTP 200 { status: true, products: [...] }
    React-->>Customer: Displays Product Grid with Price & WebP Images
```

---

## 5. Summary Matrix of Core Data Workflows

| Functional Journey | Initiated By | Key API Endpoint | Primary Data Store | Output Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **Account Creation** | Customer / Merchant | `POST /api/user/verify-otp` | MySQL `users` table | JWT Token stored in localStorage |
| **Store Setup** | Merchant | `POST /api/store/create` | MySQL `store` + Object Storage | Store profile marked `pending` |
| **Admin Moderation**| Admin | `PUT /api/admin/store/approve` | MySQL `store` table | Store status updated to `active` |
| **Product Publishing**| Merchant | `POST /api/product/add` | MySQL `product` + Object Storage | WebP Image URL + Indexed catalog row |
| **Ad Banner Campaign**| Admin / Merchant | `POST /api/banner/create` | MySQL `banner` + Object Storage | Displayed on Customer Homepage Carousel |
| **Marketplace Search**| Customer | `GET /api/keywords/search` | MySQL `product` & `store` indexes | Filtered product & store cards |
