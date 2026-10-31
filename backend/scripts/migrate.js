import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.DB_HOST || 'srv1674.hstgr.io',
  user: process.env.DB_USER || 'u409673832_multitenant',
  password: process.env.DB_PASSWORD || '2180450_aA',
  database: process.env.DB_NAME || 'u409673832_multitenant',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true
};

async function migrate() {
  console.log(`Connecting to remote MySQL at ${config.host} (database: ${config.database})...`);
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected successfully!');

  // 1. Create Tables
  console.log('Creating tables: tenants, users, expenses...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id VARCHAR(64) NOT NULL,
      name VARCHAR(150) NOT NULL,
      status ENUM('active', 'trialing', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
      tier ENUM('standard', 'growth', 'enterprise') NOT NULL DEFAULT 'standard',
      admin_email VARCHAR(150) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      email VARCHAR(150) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      role ENUM('admin', 'approver', 'submitter') NOT NULL DEFAULT 'submitter',
      status ENUM('active', 'disabled', 'invited') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_tenant_user_email (tenant_id, email),
      KEY idx_users_tenant (tenant_id),
      KEY idx_users_role (tenant_id, role),
      CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      title VARCHAR(200) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      submitted_by VARCHAR(64) NOT NULL,
      submitted_by_name VARCHAR(100) NOT NULL,
      approved_by VARCHAR(64) DEFAULT NULL,
      approved_by_name VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_expenses_tenant_created (tenant_id, created_at),
      KEY idx_expenses_tenant_status (tenant_id, status),
      KEY idx_expenses_submitted_by (tenant_id, submitted_by),
      CONSTRAINT fk_expenses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
      CONSTRAINT fk_expenses_submitter FOREIGN KEY (submitted_by) REFERENCES users (id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Tables created or verified.');

  // 2. Seed Initial Demo Data
  console.log('Seeding initial demo data...');
  
  // Tenants
  await conn.query(`
    INSERT INTO tenants (id, name, status, tier, admin_email) VALUES
    ('tenant-acme-prod', 'Acme Corporation', 'active', 'enterprise', 'admin@acme.com'),
    ('tenant-beta-prod', 'Beta Dynamics Inc.', 'active', 'growth', 'admin@betadynamics.com')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `);

  // Users (password: Password123!)
  const passwordHash = '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6';
  await conn.query(`
    INSERT INTO users (id, tenant_id, email, password_hash, display_name, role, status) VALUES
    ('usr_acme_admin', 'tenant-acme-prod', 'admin@acme.com', '${passwordHash}', 'Alice Admin', 'admin', 'active'),
    ('usr_acme_approver', 'tenant-acme-prod', 'approver@acme.com', '${passwordHash}', 'Bob Approver', 'approver', 'active'),
    ('usr_acme_submitter', 'tenant-acme-prod', 'submitter@acme.com', '${passwordHash}', 'Sarah Submitter', 'submitter', 'active'),
    ('usr_beta_admin', 'tenant-beta-prod', 'admin@betadynamics.com', '${passwordHash}', 'Bruce Admin', 'admin', 'active'),
    ('usr_beta_approver', 'tenant-beta-prod', 'approver@betadynamics.com', '${passwordHash}', 'Carlos Approver', 'approver', 'active'),
    ('usr_beta_submitter', 'tenant-beta-prod', 'submitter@betadynamics.com', '${passwordHash}', 'Diana Submitter', 'submitter', 'active')
    ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);
  `);

  // Sample Expenses
  await conn.query(`
    INSERT INTO expenses (id, tenant_id, title, amount, category, description, status, submitted_by, submitted_by_name, approved_by, approved_by_name) VALUES
    (1, 'tenant-acme-prod', 'AWS Cloud Hosting - Sept', 489.50, 'Infrastructure', 'Monthly production hosting charge', 'approved', 'usr_acme_submitter', 'Sarah Submitter', 'usr_acme_approver', 'Bob Approver'),
    (2, 'tenant-acme-prod', 'Team Building Offsite Lunch', 145.20, 'Meals', 'Quarterly planning team lunch', 'pending', 'usr_acme_submitter', 'Sarah Submitter', NULL, NULL),
    (3, 'tenant-acme-prod', 'Figma SaaS License Annual', 288.00, 'Software', 'Design tool renewal for frontend team', 'pending', 'usr_acme_submitter', 'Sarah Submitter', NULL, NULL),
    (4, 'tenant-beta-prod', 'Client Travel - Chicago Flights', 620.00, 'Travel', 'Roundtrip flight for client deployment', 'pending', 'usr_beta_submitter', 'Diana Submitter', NULL, NULL),
    (5, 'tenant-beta-prod', 'Ergonomic Desk Equipment', 350.00, 'Office', 'Remote work equipment stipend', 'approved', 'usr_beta_submitter', 'Diana Submitter', 'usr_beta_approver', 'Carlos Approver')
    ON DUPLICATE KEY UPDATE title=VALUES(title);
  `);

  console.log('✅ Demo data seeded successfully.');

  // Verification
  const [tenants] = await conn.query('SELECT count(*) as count FROM tenants');
  const [users] = await conn.query('SELECT count(*) as count FROM users');
  const [expenses] = await conn.query('SELECT count(*) as count FROM expenses');

  console.log(`\n🎉 Remote MySQL Database Ready!`);
  console.log(`   - Tenants: ${tenants[0].count}`);
  console.log(`   - Users: ${users[0].count}`);
  console.log(`   - Expenses: ${expenses[0].count}`);

  await conn.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
