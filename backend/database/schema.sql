-- ===============================================================
-- Multi-Tenant SaaS Database Schema (MySQL / MariaDB)
-- Reference: Tod Golding's "Building Multi-Tenant SaaS Architectures"
-- Architecture: Pooled Multi-Tenancy with Tenant Discriminator Key
-- Compatible with: cPanel Shared Hosting, phpMyAdmin, MySQL 5.7+ / 8.0+, MariaDB 10.3+
-- ===============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Control Plane: Tenants Table
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `status` ENUM('active', 'trialing', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
  `tier` ENUM('standard', 'growth', 'enterprise') NOT NULL DEFAULT 'standard',
  `admin_email` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenant User Directory Table (Application Plane with Tenant Isolation)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'approver', 'submitter') NOT NULL DEFAULT 'submitter',
  `status` ENUM('active', 'disabled', 'invited') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_user_email` (`tenant_id`, `email`),
  KEY `idx_users_tenant` (`tenant_id`),
  KEY `idx_users_role` (`tenant_id`, `role`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Application Plane: Expenses Table (Pooled Partitioning)
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `submitted_by` VARCHAR(64) NOT NULL,
  `submitted_by_name` VARCHAR(100) NOT NULL,
  `approved_by` VARCHAR(64) DEFAULT NULL,
  `approved_by_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_tenant_created` (`tenant_id`, `created_at`),
  KEY `idx_expenses_tenant_status` (`tenant_id`, `status`),
  KEY `idx_expenses_submitted_by` (`tenant_id`, `submitted_by`),
  CONSTRAINT `fk_expenses_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expenses_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
