import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  AlertCircle,
  FileText,
  RefreshCw,
  Database
} from 'lucide-react';

export const SubmitterView = () => {
  const { user, tenantId, role, rawToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch expenses isolated strictly to this tenant via SQL backend
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
      setErrorMsg(`Database Isolation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [tenantId, rawToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid title and positive dollar amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          category,
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit expense');

      setSuccessMsg(`Expense "${title}" submitted to MySQL for approval!`);
      setTitle('');
      setAmount('');
      setDescription('');
      await fetchExpenses();
    } catch (err) {
      console.error('Error submitting expense:', err);
      setErrorMsg(`Submission Denied by MySQL Layer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, status, submittedBy) => {
    if (status !== 'pending') {
      alert('Only pending expenses can be withdrawn.');
      return;
    }
    if (!confirm('Are you sure you want to withdraw this expense?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${rawToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      await fetchExpenses();
    } catch (err) {
      alert(`Deletion denied by MySQL tenant boundary: ${err.message}`);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filter === 'all') return true;
    return exp.status === filter;
  });

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Role Context Notification */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-emerald-950 text-sm">Submitter Workspace (MySQL Partitioned)</h2>
            <span className="text-xs bg-emerald-200 text-emerald-800 font-medium px-2 py-0.5 rounded font-mono">
              WHERE tenant_id = '{tenantId}'
            </span>
          </div>
          <p className="text-xs text-emerald-800 mt-0.5">
            Operating within MySQL pooled table <code className="font-mono bg-emerald-100 px-1 rounded">expenses</code>. 
            All SQL statements are parameterized with your cryptographically verified tenant ID.
          </p>
        </div>
        <button
          onClick={fetchExpenses}
          className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
          title="Refresh from MySQL"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Submissions</span>
            <FileText className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{expenses.length}</p>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">${totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs">
            <span>Approved Total</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">${totalApproved.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Create Expense Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-24">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Raise New Expense</h3>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Cloud Hosting / Offsite Lunch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount ($) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full text-xs pl-6 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Software">Software</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Office">Office Supplies</option>
                    <option value="Training">Training & Certs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business Justification</label>
                <textarea
                  rows={3}
                  placeholder="Describe why this expense was incurred..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Executing SQL INSERT...</span>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Submit for Approval</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Submitted Expenses List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Tenant Expense Records</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                  {filteredExpenses.length} items
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                      filter === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Expenses List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Querying MySQL database...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No expenses found matching the current filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const isMine = exp.submitted_by === user?.id || exp.submitted_by === user?.userId;
                  return (
                    <div key={exp.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">{exp.title}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {exp.category}
                          </span>
                          {isMine && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              You
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1">{exp.description}</p>
                        
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                          <span>By: <span className="text-slate-600 font-medium">{exp.submitted_by_name}</span></span>
                          {exp.approved_by_name && (
                            <span>• Decision by: <span className="text-slate-600 font-medium">{exp.approved_by_name}</span></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 font-mono">${parseFloat(exp.amount || 0).toFixed(2)}</p>
                          <div className="mt-0.5">
                            {exp.status === 'approved' && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                              </span>
                            )}
                            {exp.status === 'rejected' && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <XCircle className="h-3 w-3 mr-1" /> Rejected
                              </span>
                            )}
                            {exp.status === 'pending' && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3 mr-1" /> Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Withdraw button for pending items */}
                        {exp.status === 'pending' && (isMine || role === 'admin') && (
                          <button
                            onClick={() => handleDelete(exp.id, exp.status, exp.submitted_by)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Withdraw pending expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
