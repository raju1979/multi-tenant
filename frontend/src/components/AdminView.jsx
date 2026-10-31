import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Key, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';

export const AdminView = () => {
  const { user, tenantId, rawToken, setSession, tenantInfo } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // User Onboarding Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [roleToAssign, setRoleToAssign] = useState('submitter');
  const [onboarding, setOnboarding] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchTenantUsers = async () => {
    if (!rawToken || !tenantId) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users`, {
        headers: { 'Authorization': `Bearer ${rawToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tenant users');
      setUsersList(data.users || []);
    } catch (err) {
      console.warn("User directory fetch error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchTenantUsers();
  }, [tenantId, rawToken]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessResult(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    setOnboarding(true);
    try {
      const response = await fetch('/api/create-tenant-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          displayName: name.trim(),
          role: roleToAssign
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to onboard user into tenant');
      }

      setSuccessResult({
        email: email.trim(),
        role: roleToAssign,
        token: data.token,
        name: name.trim(),
        user: data.user
      });

      // Clear form
      setName('');
      setEmail('');
      setPassword('Password123!');
      setRoleToAssign('submitter');
      await fetchTenantUsers();
    } catch (err) {
      console.error('Error creating tenant user:', err);
      setErrorMsg(err.message);
    } finally {
      setOnboarding(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'approver':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Approver</span>;
      case 'submitter':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Submitter</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{r}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Role Context Notification */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-purple-950 text-sm">Tenant Administrator Workspace (Control Plane)</h2>
            <span className="text-xs bg-purple-200 text-purple-800 font-medium px-2 py-0.5 rounded font-mono">
              MySQL Pooled Partitioning
            </span>
          </div>
          <p className="text-xs text-purple-800 mt-0.5">
            You hold administrative authority over organization <code className="font-mono bg-purple-100 px-1 rounded">{tenantId}</code>. 
            Onboarding employees executes an <code className="font-mono">INSERT INTO users</code> bounded to this tenant's partition.
          </p>
        </div>
        <button
          onClick={fetchTenantUsers}
          className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
          title="Refresh Directory"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tenant Metadata Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Organization</span>
            <Building2 className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">{tenantInfo?.name || tenantId}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{tenantId}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Onboarded Members</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{usersList.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active in MySQL partition</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Relational Isolation</span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-emerald-700 mt-2 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" /> Discriminator Column
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">WHERE tenant_id = ? on all queries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Onboard New User & Assign Role */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-24">
            
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Onboard New Member</h3>
                <p className="text-[11px] text-slate-500">Assign role and provision in MySQL</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successResult && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-2">
                <div className="flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>User Provisioned in Database!</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  <strong>{successResult.name}</strong> was assigned role: <span className="font-mono bg-purple-200 px-1 rounded">{successResult.role}</span>
                </p>
                <button
                  onClick={() => setSession(successResult.token, successResult.user)}
                  className="w-full mt-2 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
                >
                  <span>Test Login as {successResult.name}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employee Full Name *</label>
                <div className="relative">
                  <User className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. David Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    placeholder="david@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Password *</label>
                <div className="relative">
                  <Key className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assign Multi-Tenant Role *</label>
                <select
                  value={roleToAssign}
                  onChange={(e) => setRoleToAssign(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium"
                >
                  <option value="submitter">Submitter (Can raise expenses)</option>
                  <option value="approver">Approver (Can review & approve expenses)</option>
                  <option value="admin">Tenant Admin (Can manage users & roles)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enforces RBAC in MySQL: <code className="font-mono text-purple-600">WHERE tenant_id = '{tenantId}' AND role = '{roleToAssign}'</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={onboarding}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {onboarding ? (
                  <span>Inserting into MySQL users table...</span>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Provision & Assign Role</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>

        {/* Right Column: Tenant User Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Tenant User Directory</h3>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-mono">
                  {usersList.length} members
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                SELECT * FROM users WHERE tenant_id = ?
              </span>
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-slate-400 text-xs">Querying tenant directory from MySQL...</div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No users found in this tenant directory.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const myId = user?.id || user?.userId;
                  const isCurrentUser = u.id === myId || u.email === user?.email;

                  return (
                    <div key={u.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                          {(u.display_name || u.email || 'U').substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {u.display_name || u.email.split('@')[0]}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                Current User
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {u.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getRoleBadge(u.role)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
