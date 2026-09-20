# Multi-City Replication & Expansion Strategy Guide

This document outlines the architectural, database, frontend, and infrastructure blueprint for expanding the **Adilabad App** platform into a **Multi-City Hyper-Local Portal System** (e.g., Hyderabad, Warangal, Nizamabad, Karimnagar).

---

## 🏗️ 1. Architectural Strategy Comparison

To scale from a single city (Adilabad) to multiple cities (Hyderabad, etc.), there are two primary architectural models:

```
                  ┌──────────────────────────────────────────────┐
                  │          GLOBAL VERCEL CDN FRONTEND          │
                  │  (hyderabad.app.com  or  app.com/hyderabad)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             RENDER NODE.JS API               │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       ORACLE CLOUD ALWAYS FREE MYSQL         │
                  │        (Multi-Tenant with city_id)           │
                  └──────────────────────┴───────────────────────┘
```

| Strategy Model | Description | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Model A: Multi-Tenant Shared Core (Recommended)** | Single DB & single API instance; all tables filtered by `city_id` / `city_slug`. | • **$0 Extra Hosting Cost**<br>• Centralized Admin Panel<br>• Instant cross-city analytics | Requires `city_id` index queries. | **BEST FOR STARTUPS (Scale to 50+ Cities at $0/mo)** |
| **Model B: Isolated City Instances (White-Label)** | Deploy separate DB schema / separate Render services per city. | Complete data isolation for city franchise partners. | Higher maintenance overhead & duplicate server setups. | Use only for independent franchise models. |

---

## 🗄️ 2. Database Schema Enhancements for Multi-City

To support Hyderabad and future cities under **Model A (Multi-Tenant)**, execute the following schema migration:

### Step 1: Create `cities` Master Table
```sql
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'hyderabad', 'adilabad'
    state VARCHAR(100) DEFAULT 'Telangana',
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Cities
INSERT INTO cities (id, name, slug, latitude, longitude) VALUES
(1, 'Adilabad', 'adilabad', 19.6641, 78.5320),
(2, 'Hyderabad', 'hyderabad', 17.3850, 78.4867),
(3, 'Warangal', 'warangal', 17.9689, 79.5941);
```

### Step 2: Add `city_id` Foreign Key to Content Tables
```sql
-- Add city_id to merchants, categories, banners, and events
ALTER TABLE merchants ADD COLUMN city_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE merchants ADD CONSTRAINT fk_merchants_city FOREIGN KEY (city_id) REFERENCES cities(id);

ALTER TABLE banners ADD COLUMN city_id INT NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN city_id INT NOT NULL DEFAULT 1;

-- Add High-Performance Multi-City Composite Index
CREATE INDEX idx_merchants_city_cat_status ON merchants(city_id, category_id, status);
CREATE INDEX idx_merchants_city_geo ON merchants(city_id, latitude, longitude);
```

---

## 🌐 3. Frontend Multi-City Adaptations

### A. Dynamic URL Routing Options
1. **Subdomain Model**: `adilabad.mycityapp.com` / `hyderabad.mycityapp.com`
2. **Subpath Model**: `mycityapp.com/adilabad` / `mycityapp.com/hyderabad`
3. **Query / State Model**: `mycityapp.com?city=hyderabad`

### B. Navbar City Switcher Component (`<CitySelector />`)
```jsx
// Example City Selector Dropdown for Navbar
import React from 'react';

export function CitySelector({ currentCity, onCityChange, cities = [] }) {
  return (
    <div className="city-selector">
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A73E8' }}>📍 City:</span>
      <select 
        value={currentCity.slug} 
        onChange={(e) => onCityChange(e.target.value)}
        style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid #1A73E8', fontWeight: '600' }}
      >
        {cities.map(city => (
          <option key={city.id} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### C. Browser GPS Auto-Location Detection
When a user visits the app from Hyderabad, reverse geocode their lat/long to auto-select Hyderabad:
```javascript
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // Call reverse geocoding API or backend GPS endpoint:
        // GET /api/cities/detect?lat=17.3850&lng=78.4867 -> returns { city: 'hyderabad' }
    });
}
```

---

## ⚡ 4. Proximity & Geofencing Queries for Large Cities (Hyderabad)

In large metro cities like Hyderabad, distance-based radius filtering (e.g., "Stores within 5 km of Gachibowli / Madhapur") is critical:

```sql
-- Haversine Formula Query to find stores within 5 km in Hyderabad
SELECT id, name, address, latitude, longitude,
       (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
FROM merchants
WHERE city_id = 2 AND status = 'active'
HAVING distance < 5
ORDER BY distance ASC
LIMIT 20;
```

---

## 📈 5. Cost & Resource Projection for Hyderabad Expansion

| Resource | Single City (Adilabad) | Multi-City (Adilabad + Hyderabad + 5 Cities) | Upgrade Required? |
| :--- | :--- | :--- | :--- |
| **MySQL Server** | Oracle Always Free (24GB RAM) | Oracle Always Free (24GB RAM) | ❌ **No upgrade needed** (Handles 50M+ rows) |
| **Node.js API** | Render Free Tier (512MB) | Render $7/mo Starter (Auto-scaling) | ⚡ Optional $7/mo if traffic hits >10k daily users |
| **Frontend CDN** | Vercel Free Tier (100GB) | Vercel Free Tier (100GB) | ❌ **No upgrade needed** |
| **Media Storage** | Cloudflare R2 Free (10GB) | Cloudflare R2 ($0.015/GB beyond 10GB) | ⚡ ~ $0.50/mo for extra image uploads |
| **Total Monthly Cost** | **$0.00 / mo** | **$0.00 – $7.50 / mo** | **Near-Zero Scale** |

---

## 📋 6. Summary Implementation Roadmap for Hyderabad Launch

1. **Execute DB Migration**: Run the `cities` table DDL & `city_id` ALTER statements on Oracle MySQL.
2. **Add Multi-City API Filter**: Update backend GET endpoints (`/api/stores?city_id=2`) to filter by city.
3. **Add City Selector Component**: Add `<CitySelector />` dropdown to top navbar in React frontend.
4. **Configure DNS**: Point custom domain / subdomains (`hyderabad.mycityapp.com`) to Vercel CDN.
