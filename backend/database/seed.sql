-- ===============================================================
-- Multi-Tenant SaaS Demo Seed Data (MySQL / MariaDB)
-- Contains 2 Isolated Tenants, 6 Users (Admin, Approver, Submitter),
-- and sample isolated expense transactions.
-- All user passwords are: Password123!
-- ===============================================================

-- 1. Insert Tenants (Control Plane)
INSERT INTO `tenants` (`id`, `name`, `status`, `tier`, `admin_email`) VALUES
('tenant-acme-prod', 'Acme Corporation', 'active', 'enterprise', 'admin@acme.com'),
('tenant-beta-prod', 'Beta Dynamics Inc.', 'active', 'growth', 'admin@betadynamics.com')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Insert Users (Application Plane with Tenant Isolation)
INSERT INTO `users` (`id`, `tenant_id`, `email`, `password_hash`, `display_name`, `role`, `status`) VALUES
-- Acme Corporation Users
('usr_acme_admin', 'tenant-acme-prod', 'admin@acme.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Alice Admin', 'admin', 'active'),
('usr_acme_approver', 'tenant-acme-prod', 'approver@acme.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Bob Approver', 'approver', 'active'),
('usr_acme_submitter', 'tenant-acme-prod', 'submitter@acme.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Sarah Submitter', 'submitter', 'active'),

-- Beta Dynamics Inc. Users
('usr_beta_admin', 'tenant-beta-prod', 'admin@betadynamics.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Bruce Admin', 'admin', 'active'),
('usr_beta_approver', 'tenant-beta-prod', 'approver@betadynamics.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Carlos Approver', 'approver', 'active'),
('usr_beta_submitter', 'tenant-beta-prod', 'submitter@betadynamics.com', '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', 'Diana Submitter', 'submitter', 'active')
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`);

-- 3. Insert Sample Expenses (Pooled Partitioned Records)
INSERT INTO `expenses` (`id`, `tenant_id`, `title`, `amount`, `category`, `description`, `status`, `submitted_by`, `submitted_by_name`, `approved_by`, `approved_by_name`) VALUES
-- Acme Expenses
(1, 'tenant-acme-prod', 'AWS Cloud Hosting - Sept', 489.50, 'Infrastructure', 'Monthly production hosting charge', 'approved', 'usr_acme_submitter', 'Sarah Submitter', 'usr_acme_approver', 'Bob Approver'),
(2, 'tenant-acme-prod', 'Team Building Offsite Lunch', 145.20, 'Meals', 'Quarterly planning team lunch', 'pending', 'usr_acme_submitter', 'Sarah Submitter', NULL, NULL),
(3, 'tenant-acme-prod', 'Figma SaaS License Annual', 288.00, 'Software', 'Design tool renewal for frontend team', 'pending', 'usr_acme_submitter', 'Sarah Submitter', NULL, NULL),

-- Beta Dynamics Expenses
(4, 'tenant-beta-prod', 'Client Travel - Chicago Flights', 620.00, 'Travel', 'Roundtrip flight for client deployment', 'pending', 'usr_beta_submitter', 'Diana Submitter', NULL, NULL),
(5, 'tenant-beta-prod', 'Ergonomic Desk Equipment', 350.00, 'Office', 'Remote work equipment stipend', 'approved', 'usr_beta_submitter', 'Diana Submitter', 'usr_beta_approver', 'Carlos Approver')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);
