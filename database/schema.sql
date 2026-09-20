-- ==============================================================================
-- Adilabad Application Database Master Provisioning Schema (adilabadDb)
-- Compatible with MySQL 8.0 / MariaDB 10.5+
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `adilabadDb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `adilabadDb`;

-- 1. Users Table (Customers, Merchants/Vendors, Platform Admins)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(64) UNIQUE NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('customer', 'vendor', 'admin') DEFAULT 'customer',
    `vendor_status` ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none',
    `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    `otp_code` VARCHAR(10) DEFAULT NULL,
    `otp_expires_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_phone` (`phone`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Business Categories Table
CREATE TABLE IF NOT EXISTS `category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(150) NOT NULL,
    `icon_url` VARCHAR(500) DEFAULT NULL,
    `parent_id` INT DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_category_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Merchant Stores Table
CREATE TABLE IF NOT EXISTS `store` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `store_name` VARCHAR(200) NOT NULL,
    `category_id` INT NOT NULL,
    `address` TEXT DEFAULT NULL,
    `city` VARCHAR(100) DEFAULT 'Adilabad',
    `phone` VARCHAR(20) DEFAULT NULL,
    `logo_url` VARCHAR(500) DEFAULT NULL,
    `banner_url` VARCHAR(500) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'active', 'rejected', 'suspended') DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_store_user_id` (`user_id`),
    INDEX `idx_store_category_id` (`category_id`),
    INDEX `idx_store_status` (`status`),
    CONSTRAINT `fk_store_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Products Catalog Table
CREATE TABLE IF NOT EXISTS `product` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `store_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_price` DECIMAL(10, 2) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `stock_quantity` INT DEFAULT 0,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_product_store_id` (`store_id`),
    INDEX `idx_product_category_id` (`category_id`),
    INDEX `idx_product_status` (`status`),
    CONSTRAINT `fk_product_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Promotional Banners Table
CREATE TABLE IF NOT EXISTS `banner` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) DEFAULT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `link_url` VARCHAR(500) DEFAULT NULL,
    `banner_type` ENUM('home_hero', 'category_top', 'vendor_promo') DEFAULT 'home_hero',
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_banner_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Merchant Promotions & Flash Sales Table
CREATE TABLE IF NOT EXISTS `promotions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `store_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `discount_percent` INT DEFAULT 0,
    `start_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `end_date` DATETIME DEFAULT NULL,
    `status` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_promotions_store_id` (`store_id`),
    CONSTRAINT `fk_promotions_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Search Keywords & Tagging Table
CREATE TABLE IF NOT EXISTS `keywords` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `keyword` VARCHAR(100) NOT NULL,
    `store_id` INT DEFAULT NULL,
    `product_id` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_keywords_word` (`keyword`),
    INDEX `idx_keywords_store` (`store_id`),
    INDEX `idx_keywords_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Customer Orders & Order Details Tables
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(64) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `store_id` INT NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    `order_status` ENUM('placed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'placed',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_orders_user_id` (`user_id`),
    INDEX `idx_orders_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data: Default Master Category
INSERT INTO `category` (`category_name`, `icon_url`, `parent_id`, `status`) 
VALUES 
('General Merchants', 'uploads/categories/general.webp', 0, 1),
('Textiles & Clothing', 'uploads/categories/clothing.webp', 0, 1),
('Electronics & Mobile', 'uploads/categories/electronics.webp', 0, 1)
ON DUPLICATE KEY UPDATE `id`=`id`;
