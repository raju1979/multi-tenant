import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  History,
  FileCheck2,
  Lock,
  RefreshCw,
  Database
} from 'lucide-react';

export const ApproverView = () => {
  const { user, tenantId, role, rawToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  const fetchExpenses = async () => {
    if (!rawToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        headers: { 'Authorization': `Bearer ${rawToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch expenses');
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setActionError(`Database Isolation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [tenantId, rawToken]);

  const handleDecision = async (expense, newStatus) => {
    setActionError(null);
    setActionSuccess(null);

    // Segregation of Duties Check (Tod Golding):
    // Approvers cannot approve their own expenses
    const myId = user?.id || user?.userId;
    if (expense.submitted_by === myId && role !== 'admin') {
      setActionError(
        `Segregation of Duties Enforced: You cannot ${newStatus} your own expense. Another approver or tenant admin must review this.`
      );
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${expense.id}/decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${newStatus} expense`);

      setActionSuccess(`Expense "${expense.title}" was ${newStatus} successfully!`);
      await fetchExpenses();
    } catch (err) {
      console.error('Error updating approval status:', err);
      setActionError(err.message);
    }
  };

  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const decidedExpenses = expenses.filter(e => e.status !== 'pending');

  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalApprovedAmount = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Role Context Notification */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-blue-950 text-sm">Approver Workspace (MySQL Tenant Boundary)</h2>
            <span className="text-xs bg-blue-200 text-blue-800 font-medium px-2 py-0.5 rounded font-mono">
              tenant_id = '{tenantId}'
            </span>
          </div>
          <p className="text-xs text-blue-800 mt-0.5">
            Querying MySQL pool with Segregation of Duties logic. Approvers review submitted team expenses while prevented from approving their own submissions.
          </p>
        </div>
        <button
          onClick={fetchExpenses}
          className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
          title="Refresh Queue"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs">
            <span>Pending In Queue</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{pendingExpenses.length}</span>
            <span className="text-xs text-slate-500 font-mono">(${totalPendingAmount.toFixed(2)})</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs">
            <span>Total Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {expenses.filter(e => e.status === 'approved').length}
            </span>
            <span className="text-xs text-slate-500 font-mono">(${totalApprovedAmount.toFixed(2)})</span>
          </div>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs">
            <span>Total Rejected</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {expenses.filter(e => e.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Authorization / SOD Policy:</span> {actionError}
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Review Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Expense Approvals</h3>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Queue</span>
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                {pendingExpenses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Decided History</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                {decidedExpenses.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Queue */}
        {activeTab === 'pending' && (
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Querying pending records from MySQL...</div>
            ) : pendingExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                🎉 No pending expenses awaiting approval in this tenant.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingExpenses.map((exp) => {
                  const myId = user?.id || user?.userId;
                  const isSelfSubmitted = exp.submitted_by === myId;

                  return (
                    <div key={exp.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Details */}
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-semibold text-slate-900 text-sm">{exp.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {exp.category}
                          </span>
                          {isSelfSubmitted && (
                            <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              <Lock className="h-2.5 w-2.5 mr-1" /> Self-Submitted
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600">{exp.description}</p>

                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>Submitted by: <strong className="text-slate-700">{exp.submitted_by_name}</strong></span>
                          <span>•</span>
                          <span>MySQL ID: <code className="font-mono text-slate-500">#{exp.id}</code></span>
                        </div>
                      </div>

                      {/* Right: Amount & Decision Actions */}
                      <div className="flex items-center justify-between md:justify-end space-x-5">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 font-mono">${parseFloat(exp.amount || 0).toFixed(2)}</p>
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Awaiting Review
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDecision(exp, 'approved')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            title="Approve this expense"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => handleDecision(exp, 'rejected')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all"
                            title="Reject this expense"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Decision History */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-5">
            {decidedExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No decision history recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {decidedExpenses.map((exp) => (
                  <div key={exp.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">{exp.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted by <span className="text-slate-600">{exp.submitted_by_name}</span> • 
                        Reviewed by <span className="text-slate-700 font-medium">{exp.approved_by_name || 'Approver'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 font-mono">${parseFloat(exp.amount || 0).toFixed(2)}</p>
                      <div className="mt-0.5">
                        {exp.status === 'approved' ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3 mr-1" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
