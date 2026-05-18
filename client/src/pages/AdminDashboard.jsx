import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(data);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllLoans(data);
    } catch (err) {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    if (!confirm(`Set user to "${newStatus}"?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const s = {
      active: 'bg-green-900/50 text-green-400 border-green-800',
      locked: 'bg-red-900/50 text-red-400 border-red-800',
      active_loan: 'bg-green-900/50 text-green-400 border-green-800',
      closed: 'bg-gray-700/50 text-gray-400 border-gray-600',
      defaulted: 'bg-red-900/50 text-red-400 border-red-800',
    };
    return s[status] || s.closed;
  };

  const getActionBadge = (action) => {
    const colors = { INSERT: 'text-green-400', UPDATE: 'text-yellow-400', DELETE: 'text-red-400' };
    return <span className={`font-medium ${colors[action] || ''}`}>{action}</span>;
  };

  const totalBalance = users.reduce((acc, u) => {
    return acc;
  }, 0);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'logs') fetchAuditLogs();
    else if (activeTab === 'loans') fetchLoans();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome, {user?.full_name} ({user?.role})</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card py-5 px-6 text-center">
          <p className="text-gray-400 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-white mt-1">{users.length || '—'}</p>
        </div>
        <div className="card py-5 px-6 text-center">
          <p className="text-gray-400 text-sm font-medium">Total Loans</p>
          <p className="text-3xl font-bold text-brand-accent mt-1">{allLoans.length || '—'}</p>
        </div>
        <div className="card py-5 px-6 text-center">
          <p className="text-gray-400 text-sm font-medium">Loans Total Principal</p>
          <p className="text-3xl font-bold text-white mt-1">
            {allLoans.length
              ? '$' + allLoans.reduce((s, l) => s + parseFloat(l.principal), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
              : '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-0">
        {[
          { key: 'users', label: 'Users' },
          { key: 'logs', label: 'Audit Logs' },
          { key: 'loans', label: 'All Loans' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t border-b-2 transition ${
              activeTab === tab.key
                ? 'border-brand-accent text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-x-auto">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
          {loading ? (
            <div className="text-center text-gray-400 py-10">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No users found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Username</th>
                  <th className="py-3 px-4 font-medium">Full Name</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition text-white">
                    <td className="py-3 px-4 font-mono text-sm">{u.username}</td>
                    <td className="py-3 px-4">{u.full_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded border ${
                        u.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border-purple-800' : 'bg-blue-900/50 text-blue-300 border-blue-800'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(u.status)}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`text-sm px-3 py-1 rounded border transition ${
                          u.status === 'active'
                            ? 'border-red-700 text-red-400 hover:bg-red-900/30'
                            : 'border-green-700 text-green-400 hover:bg-green-900/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Lock' : 'Unlock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card overflow-x-auto">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
          {loading ? (
            <div className="text-center text-gray-400 py-10">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No audit logs found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Time</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-4 font-medium">Table</th>
                  <th className="py-3 px-4 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition text-white">
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-700">{log.table_name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{log.changed_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All Loans Tab */}
      {activeTab === 'loans' && (
        <div className="card overflow-x-auto">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
          {loading ? (
            <div className="text-center text-gray-400 py-10">Loading...</div>
          ) : allLoans.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No loans found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Account</th>
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Principal</th>
                  <th className="py-3 px-4 font-medium">Interest</th>
                  <th className="py-3 px-4 font-medium">Term</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {allLoans.map(loan => (
                  <tr key={loan.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition text-white">
                    <td className="py-3 px-4 font-mono text-sm">{loan.account_number}</td>
                    <td className="py-3 px-4">{loan.username}</td>
                    <td className="py-3 px-4">${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                    <td className="py-3 px-4">{loan.term_months} mo</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(loan.status)}`}>
                        {loan.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;