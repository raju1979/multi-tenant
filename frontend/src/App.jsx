import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { SubmitterView } from './components/SubmitterView';
import { ApproverView } from './components/ApproverView';
import { AdminView } from './components/AdminView';
import { ArchitectureDrawer } from './components/ArchitectureDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { 
  Building2, 
  Receipt, 
  ShieldCheck, 
  Users, 
  Database,
  Lock
} from 'lucide-react';

const MainApp = () => {
  const { user, tenantId, role, loading, tenantInfo } = useAuth();
  
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-300 font-medium">Resolving Tenant Session & Cryptographic Token...</p>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, render the dedicated separate Login Screen
  if (!user) {
    return (
      <>
        <LoginScreen 
          onOpenArchitecture={() => setShowArchitecture(true)}
          onOpenOnboard={() => setShowOnboard(true)}
        />

        {/* Floating Architecture Drawer */}
        <ArchitectureDrawer
          isOpen={showArchitecture}
          onClose={() => setShowArchitecture(false)}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboard}
          onClose={() => setShowOnboard(false)}
        />
      </>
    );
  }

  // 2. If authenticated, render the role-exclusive screen
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Top Header: Clean, no dropdown */}
      <Header
        onOpenArchitecture={() => setShowArchitecture(true)}
      />

      {/* Main Workspace: Exclusively renders the user's role screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Role Workspace Banner */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm ${
              role === 'admin' 
                ? 'bg-purple-600' 
                : role === 'approver' 
                ? 'bg-blue-600' 
                : 'bg-emerald-600'
            }`}>
              {role === 'admin' && <Users className="h-6 w-6" />}
              {role === 'approver' && <ShieldCheck className="h-6 w-6" />}
              {role === 'submitter' && <Receipt className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
                  {role === 'admin' && 'Tenant Administrator Console'}
                  {role === 'approver' && 'Expense Approver Portal'}
                  {role === 'submitter' && 'Employee Expense Submissions'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  Role: {role}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-700">{user.email}</strong> • Organization: <strong className="text-slate-700">{tenantInfo?.name || tenantId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>Partition: {tenantId}</span>
          </div>
        </div>

        {/* Role-Exclusive Workspace Rendering */}
        <div className="transition-all duration-200">
          {role === 'submitter' && <SubmitterView />}
          {role === 'approver' && <ApproverView />}
          {role === 'admin' && <AdminView />}
          
          {/* Fallback if user has no assigned role */}
          {role !== 'submitter' && role !== 'approver' && role !== 'admin' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
              <Lock className="h-8 w-8 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-amber-900">Pending Role Assignment</h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Your user account is registered in <code className="font-mono font-bold">{tenantId}</code>, but no active operational role has been assigned yet. Please contact your tenant administrator.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Educational Architecture Deep Dive Drawer */}
      <ArchitectureDrawer
        isOpen={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />

      {/* Control Plane Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboard}
        onClose={() => setShowOnboard(false)}
      />

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Multi-Tenant SaaS Architecture • Tod Golding Architectural Framework • Remote MySQL Pooled Isolation & Signed JWTs
      </footer>

    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
