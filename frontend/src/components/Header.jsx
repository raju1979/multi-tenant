import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  LogOut, 
  BookOpen, 
  Layers
} from 'lucide-react';

export const Header = ({ onOpenArchitecture }) => {
  const { user, tenantId, role, tenantInfo, logout } = useAuth();

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
            Tenant Admin
          </span>
        );
      case 'approver':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
            Approver
          </span>
        );
      case 'submitter':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            Expense Submitter
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {r || 'Member'}
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo & Multi-Tenant Architecture Badge */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">TenantVault</span>
                <span className="text-xs px-2 py-0.5 font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  Multi-Tenant SaaS
                </span>
              </div>
              <p className="text-xs text-slate-500">Tod Golding Reference Architecture • MySQL Isolated</p>
            </div>
          </div>

          {/* Active Tenant Context Pill */}
          {user && (
            <div className="hidden md:flex items-center space-x-3 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="font-bold">{tenantInfo?.name || tenantId}</span>
              </div>
              <div className="h-3.5 w-px bg-slate-300" />
              <div className="text-[11px] font-mono text-slate-400">
                Partition: <span className="text-slate-600 font-semibold">{tenantId}</span>
              </div>
              <div className="h-3.5 w-px bg-slate-300" />
              {getRoleBadge(role)}
            </div>
          )}

          {/* Right Action Controls: Architecture Guide + User Profile + Logout */}
          <div className="flex items-center space-x-3">
            
            {/* Architecture Spec Sheet Button */}
            <button
              onClick={onOpenArchitecture}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
              title="View Tod Golding Multi-Tenancy Architecture Guide"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Architecture Deep Dive</span>
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user.displayName || user.name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-xs"
                  title="Sign Out of Session"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
