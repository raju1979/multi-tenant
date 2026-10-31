import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../apiClient';
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Layers, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  PlusCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginScreen = ({ onOpenArchitecture, onOpenOnboard }) => {
  const { loginWithCredentials } = useAuth();

  const [tenants, setTenants] = useState([
    { id: 'tenant-acme-prod', name: 'Acme Corporation' },
    { id: 'tenant-beta-prod', name: 'Beta Dynamics Inc.' }
  ]);
  const [selectedTenantId, setSelectedTenantId] = useState('tenant-acme-prod');
  const [usernameOrEmail, setUsernameOrEmail] = useState('submitter@acme.com');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch available tenants from MySQL backend
  useEffect(() => {
    apiFetch('/api/tenants')
      .then(res => res.json())
      .then(data => {
        if (data.tenants && data.tenants.length > 0) {
          setTenants(data.tenants);
          // If selected tenant not in list, pick first
          if (!data.tenants.some(t => t.id === selectedTenantId)) {
            setSelectedTenantId(data.tenants[0].id);
          }
        }
      })
      .catch(err => console.warn('Could not load tenants list:', err));
  }, []);

  // When selected tenant changes, update suggested email
  const handleTenantChange = (newTenantId) => {
    setSelectedTenantId(newTenantId);
    if (newTenantId === 'tenant-acme-prod') {
      setUsernameOrEmail('submitter@acme.com');
    } else if (newTenantId === 'tenant-beta-prod') {
      setUsernameOrEmail('submitter@betadynamics.com');
    } else {
      setUsernameOrEmail('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTenantId || !usernameOrEmail.trim() || !password) {
      setErrorMsg('Please select your company and enter your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithCredentials(selectedTenantId, usernameOrEmail.trim(), password);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper quick-fill shortcuts for testing
  const quickFill = (tenant, email) => {
    setSelectedTenantId(tenant);
    setUsernameOrEmail(email);
    setPassword('1234');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Graphic Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Architecture Guide */}
      <div className="relative max-w-md w-full mx-auto px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">TenantVault</span>
            <span className="block text-[10px] text-slate-400">Multi-Tenant SaaS</span>
          </div>
        </div>

        <button
          onClick={onOpenArchitecture}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-white/10"
        >
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          <span>Architecture Guide</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="relative max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8 space-y-6">
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your organization to authenticate within your tenant partition.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* 1. Company / Organization Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company / Organization *
              </label>
              <div className="relative">
                <Building2 className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-800"
                  required
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Binds session to MySQL partition: <code className="text-emerald-700">{selectedTenantId}</code>
              </p>
            </div>

            {/* 2. Username / Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username or Corporate Email *
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. submitter@acme.com or Sarah Submitter"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* 3. Password Input (Default: 1234) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password *</label>
                <span className="text-[10px] text-emerald-600 font-medium">Default: 1234</span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Persona Autofills */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Role Autofills (Password: 1234)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => quickFill(selectedTenantId, selectedTenantId === 'tenant-acme-prod' ? 'submitter@acme.com' : 'submitter@betadynamics.com')}
                  className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium border border-emerald-200 transition-colors text-center truncate"
                >
                  Submitter
                </button>
                <button
                  type="button"
                  onClick={() => quickFill(selectedTenantId, selectedTenantId === 'tenant-acme-prod' ? 'approver@acme.com' : 'approver@betadynamics.com')}
                  className="py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium border border-blue-200 transition-colors text-center truncate"
                >
                  Approver
                </button>
                <button
                  type="button"
                  onClick={() => quickFill(selectedTenantId, selectedTenantId === 'tenant-acme-prod' ? 'admin@acme.com' : 'admin@betadynamics.com')}
                  className="py-1 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium border border-purple-200 transition-colors text-center truncate"
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating with MySQL...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

          </form>

          {/* Footer Action: Onboard New Tenant */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need a new organization?</span>
            <button
              onClick={onOpenOnboard}
              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Onboard Company</span>
            </button>
          </div>

        </div>

        {/* Database & VPS Connection Indicator */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>VPS Backend (<code className="font-mono text-emerald-400">65.75.203.202:5001</code>) • MySQL (<code className="font-mono text-slate-300">srv1674.hstgr.io</code>)</span>
        </div>
      </div>

    </div>
  );
};
