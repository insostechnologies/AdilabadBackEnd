-- Database Performance Optimization Migration
-- Adds index keys to foreign key and frequently queried columns to prevent full table scans on large datasets (100GB+)

USE adilabadDb;

-- Add index on Product -> Store relationship
CREATE INDEX IF NOT EXISTS idx_product_store_id ON product(store_id);

-- Add index on Store -> User relationship
CREATE INDEX IF NOT EXISTS idx_store_user_id ON store(user_id);

-- Add index on Store -> Category relationship
CREATE INDEX IF NOT EXISTS idx_store_category_id ON store(category_id);

-- Add index on Product -> Category relationship
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);

-- Add index on Banner active status
CREATE INDEX IF NOT EXISTS idx_banner_status ON banner(status);

-- Add index on Promotions store_id
CREATE INDEX IF NOT EXISTS idx_promotions_store_id ON promotions(store_id);
