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
      const { data } = await axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(data);
    } catch (e) { setError('Khong tai duoc danh sach user'); } finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
      setAuditLogs(data);
    } catch (e) { setError('Khong tai duoc audit logs'); } finally { setLoading(false); }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/loans', { headers: { Authorization: `Bearer ${token}` } });
      setAllLoans(data);
    } catch (e) { setError('Khong tai duoc danh sach khoan vay'); } finally { setLoading(false); }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    if (!confirm(`Đặt trạng thái "${newStatus}" cho user này?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Cap nhat that bai'); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'logs') fetchAuditLogs();
    else if (activeTab === 'loans') fetchLoans();
  }, [activeTab]);

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-success-glow/10 text-success-glow border border-success-glow/30';
    if (status === 'locked') return 'bg-danger-glow/10 text-danger-glow border border-danger-glow/30';
    if (status === 'completed') return 'bg-success-glow/10 text-success-glow border border-success-glow/30';
    if (status === 'closed') return 'bg-white/5 text-on-surface-variant border border-outline-variant';
    if (status === 'defaulted') return 'bg-danger-glow/10 text-danger-glow border border-danger-glow/30';
    return '';
  };

  const getActionBadge = (action) => {
    if (action === 'INSERT') return <span className="text-success-glow font-label-md">INSERT</span>;
    if (action === 'UPDATE') return <span className="text-warning-glow font-label-md">UPDATE</span>;
    if (action === 'DELETE') return <span className="text-danger-glow font-label-md">DELETE</span>;
    return <span className="text-on-surface-variant font-label-md">{action}</span>;
  };

  const totalPrincipal = allLoans.reduce((s, l) => s + parseFloat(l.principal || 0), 0);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Quản trị hệ thống</h1>
        <p className="font-body-md text-on-surface-variant mt-1">Xin chào, {user?.full_name} ({user?.role})</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
        <div className="glass-card py-5 px-6 text-center rounded-xl">
          <p className="text-on-surface-variant text-label-md mb-1">Tổng Users</p>
          <p className="font-headline-md text-headline-md text-on-surface">{users.length || '—'}</p>
        </div>
        <div className="glass-card py-5 px-6 text-center rounded-xl">
          <p className="text-on-surface-variant text-label-md mb-1">Tổng Khoản Vay</p>
          <p className="font-headline-md text-headline-md text-primary">{allLoans.length || '—'}</p>
        </div>
        <div className="glass-card py-5 px-6 text-center rounded-xl">
          <p className="text-on-surface-variant text-label-md mb-1">Tổng Tiền Vay</p>
          <p className="font-headline-md text-headline-md text-on-surface">{totalPrincipal > 0 ? '$' + totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-glass-border pb-0">
        {[{ key: 'users', label: 'Users', icon: 'group' }, { key: 'logs', label: 'Audit Logs', icon: 'history' }, { key: 'loans', label: 'Khoản Vay', icon: 'payments' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2.5 text-label-md font-label-md rounded-t border-b-2 transition flex items-center gap-2 ${
            activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {error && <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
          {loading ? <div className="text-center text-on-surface-variant py-10">Đang tải...</div> : users.length === 0 ? (
            <div className="text-center text-on-surface-variant py-10">Chưa có user nào.</div>
          ) : (
            <table className="w-full text-left">
              <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
                <th className="px-stack-md py-3 font-medium">Username</th>
                <th className="px-stack-md py-3 font-medium">Họ tên</th>
                <th className="px-stack-md py-3 font-medium">Role</th>
                <th className="px-stack-md py-3 font-medium">Trạng thái</th>
                <th className="px-stack-md py-3 font-medium">Ngày tạo</th>
                <th className="px-stack-md py-3 font-medium text-right">Thao tác</th>
              </tr></thead>
              <tbody className="divide-y divide-glass-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition text-on-surface">
                    <td className="px-stack-md py-4 font-mono text-sm">{u.username}</td>
                    <td className="px-stack-md py-4 font-label-md">{u.full_name}</td>
                    <td className="px-stack-md py-4">
                      <span className={`px-2 py-0.5 text-[10px] rounded border ${
                        u.role === 'admin' ? 'bg-tertiary-container/20 text-tertiary border-tertiary-container' : 'bg-primary/10 text-primary border-primary'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-stack-md py-4"><span className={`px-2 py-1 text-[10px] rounded-full border ${getStatusBadge(u.status)}`}>{u.status.toUpperCase()}</span></td>
                    <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-stack-md py-4 text-right">
                      <button onClick={() => handleToggleStatus(u.id, u.status)} className={`px-3 py-1 text-label-sm rounded-lg border transition cursor-pointer ${
                        u.status === 'active' ? 'border-danger-glow/30 text-danger-glow hover:bg-danger-glow/10' : 'border-success-glow/30 text-success-glow hover:bg-success-glow/10'}`}>
                        {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
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
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? <div className="text-center text-on-surface-variant py-10">Đang tải...</div> : auditLogs.length === 0 ? (
            <div className="text-center text-on-surface-variant py-10">Chưa có audit log nào.</div>
          ) : (
            <table className="w-full text-left">
              <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
                <th className="px-stack-md py-3 font-medium">Thời gian</th>
                <th className="px-stack-md py-3 font-medium">Hành động</th>
                <th className="px-stack-md py-3 font-medium">Bảng</th>
                <th className="px-stack-md py-3 font-medium">Người thực hiện</th>
              </tr></thead>
              <tbody className="divide-y divide-glass-border">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition text-on-surface">
                    <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(log.changed_at).toLocaleString()}</td>
                    <td className="px-stack-md py-4">{getActionBadge(log.action)}</td>
                    <td className="px-stack-md py-4"><span className="bg-surface-container px-2 py-0.5 rounded text-[10px] border border-outline-variant">{log.table_name}</span></td>
                    <td className="px-stack-md py-4 text-on-surface-variant text-sm">{log.changed_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? <div className="text-center text-on-surface-variant py-10">Đang tải...</div> : allLoans.length === 0 ? (
            <div className="text-center text-on-surface-variant py-10">Chưa có khoản vay nào.</div>
          ) : (
            <table className="w-full text-left">
              <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
                <th className="px-stack-md py-3 font-medium">User</th>
                <th className="px-stack-md py-3 font-medium">Tài khoản</th>
                <th className="px-stack-md py-3 font-medium text-right">Số tiền</th>
                <th className="px-stack-md py-3 font-medium">Lãi suất</th>
                <th className="px-stack-md py-3 font-medium">Kỳ hạn</th>
                <th className="px-stack-md py-3 font-medium">Trạng thái</th>
              </tr></thead>
              <tbody className="divide-y divide-glass-border">
                {allLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-white/5 transition text-on-surface">
                    <td className="px-stack-md py-4 text-label-md">{loan.username}</td>
                    <td className="px-stack-md py-4 font-mono text-sm text-on-surface-variant">{loan.account_number}</td>
                    <td className="px-stack-md py-4 text-right font-label-md text-primary">${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-stack-md py-4 text-label-md">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                    <td className="px-stack-md py-4 text-label-md">{loan.term_months} tháng</td>
                    <td className="px-stack-md py-4"><span className={`px-2 py-1 text-[10px] rounded-full border ${getStatusBadge(loan.status)}`}>{loan.status.toUpperCase()}</span></td>
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