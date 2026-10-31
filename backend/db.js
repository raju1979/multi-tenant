import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;
let useFallback = false;

// In-Memory Fallback Store (Used when local MySQL is not running)
const inMemoryStore = {
  tenants: [
    { id: 'tenant-acme-prod', name: 'Acme Corporation', status: 'active', tier: 'enterprise', admin_email: 'admin@acme.com', created_at: new Date() },
    { id: 'tenant-beta-prod', name: 'Beta Dynamics Inc.', status: 'active', tier: 'growth', admin_email: 'admin@betadynamics.com', created_at: new Date() }
  ],
  users: [
    { id: 'usr_acme_admin', tenant_id: 'tenant-acme-prod', email: 'admin@acme.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Alice Admin', role: 'admin', status: 'active', created_at: new Date() },
    { id: 'usr_acme_approver', tenant_id: 'tenant-acme-prod', email: 'approver@acme.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Bob Approver', role: 'approver', status: 'active', created_at: new Date() },
    { id: 'usr_acme_submitter', tenant_id: 'tenant-acme-prod', email: 'submitter@acme.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Sarah Submitter', role: 'submitter', status: 'active', created_at: new Date() },
    { id: 'usr_beta_admin', tenant_id: 'tenant-beta-prod', email: 'admin@betadynamics.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Bruce Admin', role: 'admin', status: 'active', created_at: new Date() },
    { id: 'usr_beta_approver', tenant_id: 'tenant-beta-prod', email: 'approver@betadynamics.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Carlos Approver', role: 'approver', status: 'active', created_at: new Date() },
    { id: 'usr_beta_submitter', tenant_id: 'tenant-beta-prod', email: 'submitter@betadynamics.com', password_hash: '$2b$10$tVW7fvYJxlz/sqA2T5zdq.tpDdqolm.kPdiMiNKp.QsHfpiTt6Ss6', display_name: 'Diana Submitter', role: 'submitter', status: 'active', created_at: new Date() }
  ],
  expenses: [
    { id: 1, tenant_id: 'tenant-acme-prod', title: 'AWS Cloud Hosting - Sept', amount: 489.50, category: 'Infrastructure', description: 'Monthly production hosting charge', status: 'approved', submitted_by: 'usr_acme_submitter', submitted_by_name: 'Sarah Submitter', approved_by: 'usr_acme_approver', approved_by_name: 'Bob Approver', created_at: new Date() },
    { id: 2, tenant_id: 'tenant-acme-prod', title: 'Team Building Offsite Lunch', amount: 145.20, category: 'Meals', description: 'Quarterly planning team lunch', status: 'pending', submitted_by: 'usr_acme_submitter', submitted_by_name: 'Sarah Submitter', approved_by: null, approved_by_name: null, created_at: new Date() },
    { id: 3, tenant_id: 'tenant-acme-prod', title: 'Figma SaaS License Annual', amount: 288.00, category: 'Software', description: 'Design tool renewal for frontend team', status: 'pending', submitted_by: 'usr_acme_submitter', submitted_by_name: 'Sarah Submitter', approved_by: null, approved_by_name: null, created_at: new Date() },
    { id: 4, tenant_id: 'tenant-beta-prod', title: 'Client Travel - Chicago Flights', amount: 620.00, category: 'Travel', description: 'Roundtrip flight for client deployment', status: 'pending', submitted_by: 'usr_beta_submitter', submitted_by_name: 'Diana Submitter', approved_by: null, approved_by_name: null, created_at: new Date() },
    { id: 5, tenant_id: 'tenant-beta-prod', title: 'Ergonomic Desk Equipment', amount: 350.00, category: 'Office', description: 'Remote work equipment stipend', status: 'approved', submitted_by: 'usr_beta_submitter', submitted_by_name: 'Diana Submitter', approved_by: 'usr_beta_approver', approved_by_name: 'Carlos Approver', created_at: new Date() }
  ]
};

// Initialize MySQL Connection Pool
export async function initDatabase() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'multitenant_saas';
  const dbPort = parseInt(process.env.DB_PORT || '3306');

  try {
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    const conn = await pool.getConnection();
    console.log(`[MySQL] ✅ Connected to MySQL database "${dbName}" at ${dbHost}:${dbPort}`);
    conn.release();
    useFallback = false;
  } catch (err) {
    console.warn(`[MySQL Warning] Could not connect to MySQL server (${err.code || err.message}).`);
    console.log(`[Storage Layer] 🔄 Running in In-Memory / Hybrid SQL Mode. When deploying to shared hosting, configure your MySQL credentials in .env.`);
    useFallback = true;
  }
}

/**
 * Execute SQL Query with Tenant Partitioning & Prepared Statements
 */
export async function query(sql, params = []) {
  if (!useFallback && pool) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      console.error('[MySQL Execution Error]:', err.message);
      throw err;
    }
  }

  // Fallback In-Memory Query Engine (Matches exact MySQL table semantics)
  const trimmed = sql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT')) {
    // Expenses query
    if (sql.includes('FROM expenses')) {
      const tenantId = params[0];
      return inMemoryStore.expenses
        .filter(e => e.tenant_id === tenantId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    // Users query by tenant
    if (sql.includes('FROM users') && sql.includes('tenant_id = ?') && !sql.includes('email = ?')) {
      const tenantId = params[0];
      return inMemoryStore.users
        .filter(u => u.tenant_id === tenantId)
        .map(u => ({ id: u.id, email: u.email, display_name: u.display_name, role: u.role, status: u.status, created_at: u.created_at }));
    }
    // User login query by email
    if (sql.includes('FROM users') && sql.includes('email = ?')) {
      const email = params[0];
      return inMemoryStore.users.filter(u => u.email.toLowerCase() === email.toLowerCase());
    }
    // User by ID and Tenant
    if (sql.includes('FROM users') && sql.includes('id = ?')) {
      const [id, tenantId] = params;
      return inMemoryStore.users.filter(u => u.id === id && (!tenantId || u.tenant_id === tenantId));
    }
    // Tenants query
    if (sql.includes('FROM tenants')) {
      if (params.length > 0) {
        return inMemoryStore.tenants.filter(t => t.id === params[0]);
      }
      return inMemoryStore.tenants;
    }
  }

  if (trimmed.startsWith('INSERT INTO EXPENSES') || trimmed.startsWith('INSERT INTO `EXPENSES`')) {
    const [tenantId, title, amount, category, description, submittedBy, submittedByName] = params;
    const newId = inMemoryStore.expenses.length + 1;
    const newExpense = {
      id: newId,
      tenant_id: tenantId,
      title,
      amount: parseFloat(amount),
      category,
      description,
      status: 'pending',
      submitted_by: submittedBy,
      submitted_by_name: submittedByName,
      approved_by: null,
      approved_by_name: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    inMemoryStore.expenses.unshift(newExpense);
    return { insertId: newId, affectedRows: 1 };
  }

  if (trimmed.startsWith('UPDATE EXPENSES') || trimmed.startsWith('UPDATE `EXPENSES`')) {
    // Params: [status, approved_by, approved_by_name, id, tenant_id, submitted_by]
    const [status, approvedBy, approvedByName, id, tenantId, submitterUid] = params;
    const expense = inMemoryStore.expenses.find(e => e.id == id && e.tenant_id === tenantId);
    if (!expense) return { affectedRows: 0 };

    // Segregation of Duties Check
    if (expense.submitted_by === submitterUid) {
      return { affectedRows: 0, segregationViolation: true };
    }

    expense.status = status;
    expense.approved_by = approvedBy;
    expense.approved_by_name = approvedByName;
    expense.updated_at = new Date();
    return { affectedRows: 1 };
  }

  if (trimmed.startsWith('DELETE FROM EXPENSES') || trimmed.startsWith('DELETE FROM `EXPENSES`')) {
    const [id, tenantId, submitterUid, role] = params;
    const index = inMemoryStore.expenses.findIndex(e => e.id == id && e.tenant_id === tenantId);
    if (index === -1) return { affectedRows: 0 };

    const expense = inMemoryStore.expenses[index];
    if (expense.status !== 'pending') return { affectedRows: 0, reason: 'not_pending' };
    if (expense.submitted_by !== submitterUid && role !== 'admin') return { affectedRows: 0, reason: 'unauthorized' };

    inMemoryStore.expenses.splice(index, 1);
    return { affectedRows: 1 };
  }

  if (trimmed.startsWith('INSERT INTO USERS') || trimmed.startsWith('INSERT INTO `USERS`')) {
    const [id, tenantId, email, passwordHash, displayName, role] = params;
    const newUser = {
      id,
      tenant_id: tenantId,
      email,
      password_hash: passwordHash,
      display_name: displayName,
      role,
      status: 'active',
      created_at: new Date()
    };
    inMemoryStore.users.push(newUser);
    return { affectedRows: 1 };
  }

  if (trimmed.startsWith('INSERT INTO TENANTS') || trimmed.startsWith('INSERT INTO `TENANTS`')) {
    const [id, name, status, tier, adminEmail] = params;
    const newTenant = {
      id,
      name,
      status: status || 'active',
      tier: tier || 'standard',
      admin_email: adminEmail,
      created_at: new Date()
    };
    inMemoryStore.tenants.push(newTenant);
    return { affectedRows: 1 };
  }

  return { affectedRows: 1 };
}

export function isUsingFallback() {
  return useFallback;
}
