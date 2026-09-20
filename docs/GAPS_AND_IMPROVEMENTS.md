# Technical Gap Analysis & Architectural Improvement Roadmap
**Application**: Adilabad Application (Backend API & Frontend SPA)

This document highlights technical gaps, security vulnerabilities, performance bottlenecks, and resilience improvements identified in the `AdilabadBackEnd` and `AdilabadFrontEnd` codebases.

---

## 1. Security & Authentication Gaps

| Severity | Gap Identified | Risk / Impact | Recommended Fix |
| :---: | :--- | :--- | :--- |
| 🔴 **High** | **No Rate Limiting on Auth/OTP Endpoints** | Brute-force attacks against user login, admin login, and Fast2SMS OTP endpoints. | Add `express-rate-limit` middleware on `/api/user/login`, `/api/admin/login`, and `/api/user/send-otp` (max 5 requests per 15 mins). |
| 🟡 **Medium** | **Unparameterized SQL Queries in Some Controllers** | Potential SQL injection if user inputs are concatenated directly into SQL strings. | Replace string concatenation in queries with parameterized array syntax: `pool.query(sql, [param1, param2], callback)`. |
| 🟡 **Medium** | **Hardcoded JWT Secret Fallbacks** | Fallback secret keys in code if `.env` variable is missing. | Enforce startup validation in `config.js`: throw error and stop process if `JWT_KEY_SECRET` is not set in production. |
| 🟢 **Low** | **CORS Open Origin Transition Mode** | Cross-Origin resource sharing permits requests during initial transition. | Lock down `allowedOrigins` array in `index.js` strictly to `https://www.adilabadapp.com` in production. |

---

## 2. Backend Reliability & Error Handling Gaps

| Severity | Gap Identified | Risk / Impact | Recommended Fix |
| :---: | :--- | :--- | :--- |
| 🔴 **High** | **Plaintext Error Response in Express Middleware** | `app.use((err, req, res, next) => res.status(500).send('Something broke!'))` sends HTML/text, causing client-side JSON parser crashes. | Standardize Express error handler to return structured JSON: `{ status: false, message: 'Internal Server Error' }`. |
| 🟡 **Medium** | **Missing Process Exception Handlers** | Unhandled Promise Rejections in async controllers can crash the Node process. | Add `process.on('unhandledRejection')` and `process.on('uncaughtException')` logging handlers in `index.js`. |
| 🟡 **Medium** | **In-Band Database Backup Triggering** | Triggering MySQL dumps during HTTP API request execution causes CPU/disk I/O spikes. | Ensure database backup logic in `database/db.js` is completely removed from runtime query execution paths and executed solely via cron job. |

---

## 3. Media Storage & Upload Gaps

| Severity | Gap Identified | Risk / Impact | Recommended Fix |
| :---: | :--- | :--- | :--- |
| 🔴 **High** | **Multer DiskStorage for Uploads** | Controllers currently write uploaded files to local `/uploads` folder. In containerized cloud environments (Render, Cloud Run, Heroku), files are wiped on redeploy. | Update upload controllers (product, banner, store) to use `utils/cloudStorage.js` (Sharp WebP compression + Cloudflare R2 / Oracle Object Storage). |
| 🟡 **Medium** | **MIME Type & File Size Validation** | No strict file extension or size cap enforcement on uploaded files. | Configure Multer file filter: enforce `image/jpeg`, `image/png`, `image/webp` and set `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB max). |

---

## 4. Database Sizing & Query Performance Gaps

| Severity | Gap Identified | Risk / Impact | Recommended Fix |
| :---: | :--- | :--- | :--- |
| 🔴 **High** | **Missing Foreign Key Indexes** | Tables like `products` (`store_id`) or `stores` (`user_id`) lacking indexes will perform full table scans on large datasets (100GB+). | Add explicit MySQL indexes: `CREATE INDEX idx_products_store ON product(store_id);` and `CREATE INDEX idx_stores_user ON store(user_id);`. |
| 🟡 **Medium** | **Unbounded SELECT Queries** | Endpoints fetching lists without mandatory pagination (`LIMIT / OFFSET`) can overload API memory when data grows. | Enforce pagination parameters on all list routes: `LIMIT ? OFFSET ?` (default 20 items per page). |

---

## 5. Frontend Resilience & UX Gaps

| Severity | Gap Identified | Risk / Impact | Recommended Fix |
| :---: | :--- | :--- | :--- |
| 🟡 **Medium** | **Missing React Error Boundaries** | JavaScript runtime errors in a component unmount the entire application screen. | Wrap `App.js` routes in a custom React `ErrorBoundary` component to display a friendly fallback screen. |
| 🟡 **Medium** | **Monolithic Bundle Size** | Heavy libraries like `@ckeditor/ckeditor5-react` and `react-google-charts` loaded upfront on initial page load. | Implement code splitting using `React.lazy()` and `React.Suspense` for vendor/admin routes. |
| 🟢 **Low** | **HTTP Request Timeouts** | Fetch calls without timeout controllers can hang indefinitely on poor networks. | Add `AbortController` signal with 10-second timeout to all frontend API fetch utilities. |

---

## Summary Priority Action Matrix

```mermaid
quadrantChart
    title Gap Resolution Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    "Rate Limiting (express-rate-limit)": [0.25, 0.90]
    "JSON Error Middleware": [0.15, 0.85]
    "Integrate Sharp/R2 Uploads": [0.45, 0.95]
    "MySQL Database Indexes": [0.30, 0.90]
    "React Error Boundaries": [0.35, 0.60]
    "Frontend Code Splitting (React.lazy)": [0.70, 0.55]
```
