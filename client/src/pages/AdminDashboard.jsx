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
    setLoading(true); setError('');
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(data);
    } catch (e) { setError('Không tải được danh sách người dùng'); } finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
      setAuditLogs(data);
    } catch (e) { setError('Không tải được audit logs'); } finally { setLoading(false); }
  };

  const fetchLoans = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/loans', { headers: { Authorization: `Bearer ${token}` } });
      setAllLoans(data);
    } catch (e) { setError('Không tải được danh sách khoản vay'); } finally { setLoading(false); }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    if (!confirm(`Đặt trạng thái "${newStatus}" cho user này?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Cập nhật thất bại'); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'logs') fetchAuditLogs();
    else if (activeTab === 'loans') fetchLoans();
  }, [activeTab]);

  const totalPrincipal = allLoans.reduce((s, l) => s + parseFloat(l.principal || 0), 0);
  const lockedUsers = users.filter(u => u.status === 'locked').length;

  return (
    <div className="max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            className="text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider mono"
          >
            Admin
          </span>
        </div>
        <h1
          style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
          className="text-2xl font-semibold mb-1"
        >
          Quản trị hệ thống
        </h1>
        <p className="text-sm text-sand-dim">Xin chào, {user?.full_name}</p>
      </div>

      {/* Stats strip */}
      <div className="card-elevated p-6 mb-8">
        <div className="grid grid-cols-3 gap-0 divide-x divide-white/[0.06]">
          {[
            { label: 'Tổng người dùng', value: users.length || '—', color: '#eef0f8' },
            { label: 'Tài khoản khóa', value: lockedUsers || '—', color: lockedUsers > 0 ? '#f87171' : '#6b7494' },
            { label: 'Tổng khoản vay', value: allLoans.length || '—', color: '#d4aa64' },
          ].map(({ label, value, color }, i) => (
            <div key={label} className={`${i === 0 ? 'pr-8' : i === 1 ? 'px-8' : 'pl-8'}`}>
              <p className="text-xs uppercase tracking-wider text-sand-dim font-medium mb-2">{label}</p>
              <p
                style={{ fontFamily: 'Sora, sans-serif', color, letterSpacing: '-0.03em' }}
                className="text-3xl font-semibold"
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {[
          { key: 'users', label: 'Người dùng', icon: 'group' },
          { key: 'logs', label: 'Audit Logs', icon: 'history' },
          { key: 'loans', label: 'Khoản vay', icon: 'account_balance' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: `'FILL' ${activeTab === tab.key ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 20` }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-14"><span className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="py-14 text-center text-sand-dim text-sm">Chưa có người dùng nào</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><span className="mono text-xs text-sand">{u.username}</span></td>
                    <td><span className="text-sm text-sand">{u.full_name}</span></td>
                    <td>
                      <span
                        style={{
                          background: u.role === 'admin' ? 'rgba(239,68,68,0.08)' : 'rgba(212,170,100,0.08)',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(212,170,100,0.2)'}`,
                          color: u.role === 'admin' ? '#f87171' : '#d4aa64',
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded mono font-medium uppercase"
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.status === 'active'
                        ? <span className="badge-success">Hoạt động</span>
                        : <span className="badge-danger">Đã khóa</span>
                      }
                    </td>
                    <td><span className="text-xs text-sand-dim">{new Date(u.created_at).toLocaleDateString('vi-VN')}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={u.status === 'active' ? 'btn-danger text-xs py-1.5 px-3' : 'btn-secondary text-xs py-1.5 px-3'}
                      >
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
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-14"><span className="spinner" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="py-14 text-center text-sand-dim text-sm">Chưa có audit log nào</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Bảng</th>
                  <th>Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div className="text-xs text-sand">{new Date(log.changed_at).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[10px] text-sand-dim mono">{new Date(log.changed_at).toLocaleTimeString('vi-VN')}</div>
                    </td>
                    <td>
                      {log.action === 'INSERT' && <span className="badge-success">INSERT</span>}
                      {log.action === 'UPDATE' && <span className="badge-warning">UPDATE</span>}
                      {log.action === 'DELETE' && <span className="badge-danger">DELETE</span>}
                      {!['INSERT','UPDATE','DELETE'].includes(log.action) && (
                        <span className="badge-neutral">{log.action}</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
                        className="text-[10px] px-1.5 py-0.5 rounded text-sand-dim mono"
                      >
                        {log.table_name}
                      </span>
                    </td>
                    <td><span className="text-sm text-sand-dim">{log.changed_by || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-14"><span className="spinner" /></div>
          ) : allLoans.length === 0 ? (
            <div className="py-14 text-center text-sand-dim text-sm">Chưa có khoản vay nào</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Tài khoản</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                  <th>Lãi suất</th>
                  <th>Kỳ hạn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {allLoans.map(loan => (
                  <tr key={loan.id}>
                    <td><span className="text-sm text-sand">{loan.username}</span></td>
                    <td><span className="mono text-xs text-sand-dim">{loan.account_number}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Sora, sans-serif', color: '#d4aa64' }} className="text-sm font-semibold">
                      ${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td><span className="text-sm text-sand">{parseFloat(loan.interest_rate).toFixed(2)}%</span></td>
                    <td><span className="text-sm text-sand">{loan.term_months} tháng</span></td>
                    <td>
                      {loan.status === 'active'
                        ? <span className="badge-success">Hoạt động</span>
                        : loan.status === 'closed'
                        ? <span className="badge-neutral">Đã đóng</span>
                        : <span className="badge-danger">Quá hạn</span>
                      }
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