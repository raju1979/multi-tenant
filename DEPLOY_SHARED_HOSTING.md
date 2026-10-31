# Shared Hosting Deployment Guide (MySQL Edition)

This guide walks you through deploying the **Multi-Tenant SaaS Expense Application** to standard **Shared Hosting (cPanel, Hostinger, Bluehost, Namecheap, Plesk, etc.)** using MySQL / MariaDB and phpMyAdmin.

---

## 🏛️ Relational Multi-Tenancy Architecture (Tod Golding Reference)

In relational databases (MySQL), this application implements the **Pooled Discriminator Column Architecture** (Chapters 7, 8, & 9 of *Building Multi-Tenant SaaS Architectures*):

1. **Control Plane (`tenants` table)**:
   - Stores tenant registration, status, and subscription tier.
2. **Application Plane (`users` & `expenses` tables)**:
   - Every row contains a non-nullable `tenant_id` foreign key.
   - Indexed composite keys: `KEY idx_expenses_tenant_created (tenant_id, created_at)`.
3. **Data Access Layer Tenant Isolation**:
   - Every single SQL query is parameterized with `WHERE tenant_id = ?` using the cryptographically verified JWT claim.
   - Cross-tenant data leakage is structurally impossible.
4. **Segregation of Duties (SOD)**:
   - The SQL update query enforces:
     ```sql
     UPDATE expenses 
     SET status = ?, approved_by = ? 
     WHERE id = ? AND tenant_id = ? AND submitted_by != ?;
     ```
     Approvers cannot approve their own submissions.

---

## 📋 Step 1: Database Setup in phpMyAdmin

1. Log into your shared hosting control panel (e.g., **cPanel**).
2. Go to **MySQL® Databases**:
   - Create a new database: e.g. `youruser_expensesaas`
   - Create a database user: e.g. `youruser_dbuser` with a strong password.
   - Under **Add User To Database**, select the user and database, click **Add**, and check **ALL PRIVILEGES**.
3. Open **phpMyAdmin**:
   - Select your new database on the left sidebar.
   - Click the **Import** tab.
   - Choose the file [`backend/database/schema.sql`](file:///Volumes/outside/learning/venx/vensureone-venex-prismatic-web-develop-upto-sprint-9-end/backend/database/schema.sql) and click **Import**.
   - (Optional) Import [`backend/database/seed.sql`](file:///Volumes/outside/learning/venx/vensureone-venex-prismatic-web-develop-upto-sprint-9-end/backend/database/seed.sql) to populate demo tenants (Acme Corp & Beta Dynamics) with test users and expenses.

---

## 🚀 Step 2: Deploy Backend to Shared Hosting

### Method A: cPanel "Setup Node.js App" (Recommended)
Most modern shared hosts (cPanel with CloudLinux) support Node.js:
1. In cPanel, click **Setup Node.js App** -> **Create Application**.
2. Settings:
   - **Node.js version**: 18.x, 20.x, or 22.x
   - **Application mode**: Production
   - **Application root**: `backend` (or `api`)
   - **Application startup file**: `server.js`
3. Upload the contents of the `backend/` folder into that directory using File Manager or FTP.
4. In the Node.js App settings, under **Environment variables**, click **Add Variable**:
   - `DB_HOST`: `localhost`
   - `DB_PORT`: `3306`
   - `DB_USER`: `youruser_dbuser`
   - `DB_PASSWORD`: `your_database_password`
   - `DB_NAME`: `youruser_expensesaas`
   - `JWT_SECRET`: `your_random_secure_jwt_secret_key`
5. Click **Run NPM Install**, then click **Restart**.

### Method B: Standalone VPS / Shared Node Process
If your shared hosting only supports static frontend files and you run the Node API on a VPS or subdomain, update the database host and enable remote MySQL access in cPanel under **Remote MySQL**.

---

## 🎨 Step 3: Deploy Frontend (React SPA)

1. Build the production assets:
   ```bash
   cd frontend
   npm run build
   ```
   *The optimized static assets are created in `frontend/dist/`.*
2. In your shared hosting File Manager, open **`public_html/`** (or your subdomain directory).
3. Upload all files from `frontend/dist/` directly into `public_html/` (including `index.html`, `assets/`, and `.htaccess`).
4. The included [`.htaccess`](file:///Volumes/outside/learning/venx/vensureone-venex-prismatic-web-develop-upto-sprint-9-end/frontend/dist/.htaccess) ensures Apache routes all client-side navigation smoothly to `index.html`.

---

## 🧪 Testing Your Shared Hosting Deployment

1. Visit your domain in your browser.
2. Log in using the seeded demo credentials:
   - **Acme Corp Submitter**: `submitter@acme.com` / `Password123!`
   - **Acme Corp Approver**: `approver@acme.com` / `Password123!`
   - **Acme Corp Admin**: `admin@acme.com` / `Password123!`
   - **Beta Dynamics Submitter**: `submitter@betadynamics.com` / `Password123!`
3. Verify that Acme Corp users never see Beta Dynamics records in your MySQL database!
