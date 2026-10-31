import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  Key, 
  Database, 
  Server, 
  Lock
} from 'lucide-react';

export const ArchitectureDrawer = ({ isOpen, onClose }) => {
  const { user, tenantId, role, rawToken } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Multi-Tenant Architecture Guide (MySQL Edition)</h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Tod Golding's "Building Multi-Tenant SaaS Architectures"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm">
            
            {/* Live JWT Tenant Context Inspector */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-inner border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-amber-400">
                    Live JWT Tenant Context (Decoded Claims)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Shared Hosting Compatible</span>
              </div>
              
              <p className="text-xs text-slate-400 mb-2">
                Every request to the Node.js / MySQL backend carries this signed token in the <code className="text-indigo-400">Authorization: Bearer</code> header:
              </p>

              <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
{JSON.stringify({
  userId: user?.id || user?.userId || "unauthenticated",
  email: user?.email || "none",
  displayName: user?.displayName || user?.display_name || "none",
  tenantId: tenantId || "no_tenant_assigned",
  role: role || "no_role_assigned"
}, null, 2)}
              </pre>
            </div>

            {/* Pillar 1: Separation of Planes */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <Server className="h-4 w-4" />
                <span>1. Separation of Control Plane & Application Plane (Ch. 3 & 6)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                Tod Golding emphasizes that multi-tenant SaaS must decouple the <strong>Control Plane</strong> (which manages the business of SaaS, like tenant registration and tier billing) from the <strong>Application Plane</strong> (which executes tenant workloads).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-indigo-600 font-bold block mb-1">Control Plane</span>
                  <ul className="text-slate-500 space-y-1 list-disc pl-3">
                    <li><code>POST /api/onboard-tenant</code></li>
                    <li><code>POST /api/create-tenant-user</code></li>
                    <li>Table: <code>tenants</code></li>
                  </ul>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-emerald-600 font-bold block mb-1">Application Plane</span>
                  <ul className="text-slate-500 space-y-1 list-disc pl-3">
                    <li>Submitter & Approver workflows</li>
                    <li>Table: <code>expenses</code></li>
                    <li>Table: <code>users</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pillar 2: Pooled Partitioning in MySQL */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <Database className="h-4 w-4" />
                <span>2. Pooled Partitioning with Discriminator Column (Ch. 7 & 8)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                In relational MySQL on shared hosting, creating a separate database or schema per tenant is restricted by host quotas. Instead, we use the <strong>Discriminator Column Pattern</strong>:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div className="text-emerald-300">CREATE TABLE `expenses` (</div>
                <div className="pl-4 text-amber-200">`id` INT AUTO_INCREMENT PRIMARY KEY,</div>
                <div className="pl-4 text-emerald-400 font-bold">`tenant_id` VARCHAR(64) NOT NULL, -- Tenant Discriminator Key</div>
                <div className="pl-4 text-slate-300">`title` VARCHAR(200) NOT NULL,</div>
                <div className="pl-4 text-slate-300">`amount` DECIMAL(10, 2) NOT NULL,</div>
                <div className="pl-4 text-slate-300">`status` ENUM('pending', 'approved', 'rejected'),</div>
                <div className="pl-4 text-amber-200">KEY `idx_tenant_expenses` (`tenant_id`, `created_at`)</div>
                <div className="text-emerald-300">);</div>
              </div>
            </div>

            {/* Pillar 3: Tenant-Aware SQL Isolation */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>3. Tenant Context Data Access Layer (Ch. 9)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                Every SQL query executed by the backend is parameterized with <code className="font-mono bg-rose-50 text-rose-700 px-1 rounded">WHERE tenant_id = ?</code>.
                The value is injected exclusively from the verified JWT token (<code className="font-mono">req.tenantId</code>), never from unverified request parameters:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                <div className="text-slate-400">-- Reading expenses with guaranteed tenant isolation:</div>
                <div className="text-emerald-300">SELECT * FROM expenses <span className="text-amber-300 font-bold">WHERE tenant_id = ?</span> ORDER BY created_at DESC;</div>
                <div className="text-slate-400 mt-2">-- Updating expense:</div>
                <div className="text-emerald-300">UPDATE expenses SET status = ? <span className="text-amber-300 font-bold">WHERE id = ? AND tenant_id = ?</span>;</div>
              </div>
            </div>

            {/* Pillar 4: Segregation of Duties */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
                <Lock className="h-4 w-4" />
                <span>4. Role Segregation & Segregation of Duties (SOD)</span>
              </div>
              <ul className="text-slate-600 text-xs space-y-1.5 list-disc pl-4">
                <li><strong>Submitter</strong>: Can raise expenses, but can NEVER approve or alter status.</li>
                <li><strong>Approver</strong>: Can review and approve/reject expenses, but SQL business logic prevents self-approval (<code className="font-mono text-rose-600">submitted_by != req.userId</code>).</li>
                <li><strong>Tenant Admin</strong>: Can onboard new team members and assign roles within their organization.</li>
              </ul>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Reference: Tod Golding (AWS SaaS Factory)</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
