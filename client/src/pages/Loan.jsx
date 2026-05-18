import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Loan = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({ accountId: '', principal: '', interestRate: '', termMonths: '', startDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchLoans(); fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/accounts', { headers: { Authorization: `Bearer ${token}` } });
      setAccounts(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, accountId: data[0].id }));
    } catch (err) { console.error(err); }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/loans', { headers: { Authorization: `Bearer ${token}` } });
      setLoans(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/loans', {
        ...formData, principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate), termMonths: parseInt(formData.termMonths)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Đăng ký khoản vay thành công!');
      setFormData({ ...formData, principal: '', interestRate: '', termMonths: '', startDate: '' });
      setShowForm(false);
      fetchLoans();
    } catch (err) { setError(err.response?.data?.message || 'Đăng ký không thành công'); }
  };

  const handleDelete = async (loanId) => {
    if (!confirm('Xóa khoản vay này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/loans/${loanId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchLoans();
    } catch (err) { alert(err.response?.data?.message || 'Xóa không thành công'); }
  };

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalPrincipal = activeLoans.reduce((s, l) => s + parseFloat(l.principal || 0), 0);

  return (
    <div className="max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
            className="text-2xl font-semibold mb-1"
          >
            Khoản vay
          </h1>
          <p className="text-sm text-sand-dim">Quản lý các khoản vay của bạn</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className={showForm ? 'btn-secondary flex items-center gap-2 text-sm' : 'btn-primary flex items-center gap-2 text-sm'}
        >
          <span
            className="material-symbols-outlined text-base"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
          >
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? 'Hủy' : 'Đăng ký vay'}
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert-error mb-5">{error}</div>}
      {success && (
        <div className="alert-success mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
          {success}
        </div>
      )}

      {/* Loan form */}
      {showForm && (
        <div className="card p-6 mb-8 animate-slide-up" style={{ borderColor: 'rgba(212,170,100,0.15)' }}>
          <h2
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
            className="text-base font-semibold mb-6"
          >
            Đơn đăng ký vay
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
                Tài khoản liên kết
              </label>
              <select name="accountId" value={formData.accountId} onChange={handleChange} className="input-field" required>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number} — ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
                  Số tiền vay
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="principal"
                    value={formData.principal}
                    onChange={handleChange}
                    className="input-field pr-14"
                    placeholder="100"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sand-dim mono pointer-events-none">$</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
                  Lãi suất
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleChange}
                    className="input-field pr-8"
                    placeholder="5.5"
                    step="0.01"
                    min="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sand-dim pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
                  Kỳ hạn (tháng)
                </label>
                <input
                  type="number"
                  name="termMonths"
                  value={formData.termMonths}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={accounts.length === 0}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>check</span>
              Gửi đơn đăng ký
            </button>
          </form>
        </div>
      )}

      {/* Summary stats */}
      {loans.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng khoản vay', value: loans.length, color: '#eef0f8' },
            { label: 'Đang hoạt động', value: activeLoans.length, color: '#34d399' },
            { label: 'Tổng nợ gốc', value: totalPrincipal > 0 ? '$' + totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—', color: '#d4aa64' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-5">
              <p className="text-xs text-sand-dim uppercase tracking-wider font-medium mb-2">{label}</p>
              <p style={{ fontFamily: 'Sora, sans-serif', color, letterSpacing: '-0.02em' }} className="text-xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loans list */}
      {loading ? (
        <div className="card flex justify-center py-14">
          <span className="spinner" />
        </div>
      ) : loans.length === 0 ? (
        <div className="card p-12 text-center">
          <span
            className="material-symbols-outlined text-3xl text-sand-dim block mb-3"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
          >
            account_balance
          </span>
          <p className="text-sand-dim text-sm mb-1">Chưa có khoản vay nào</p>
          <p className="text-xs text-sand-muted">Nhấn "Đăng ký vay" để tạo khoản vay đầu tiên</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th style={{ textAlign: 'right' }}>Số tiền</th>
                <th>Lãi suất</th>
                <th>Kỳ hạn</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td><span className="mono text-xs text-sand">{loan.account_number || loan.account_id?.slice(0, 8)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Sora, sans-serif', color: '#d4aa64' }} className="text-sm font-semibold">
                      ${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td><span className="text-sm text-sand">{parseFloat(loan.interest_rate).toFixed(2)}%</span></td>
                  <td><span className="text-sm text-sand">{loan.term_months} tháng</span></td>
                  <td><span className="text-xs text-sand-dim">{new Date(loan.start_date).toLocaleDateString('vi-VN')}</span></td>
                  <td><span className="text-xs text-sand-dim">{new Date(loan.end_date).toLocaleDateString('vi-VN')}</span></td>
                  <td>
                    {loan.status === 'active'
                      ? <span className="badge-success">Hoạt động</span>
                      : loan.status === 'closed'
                      ? <span className="badge-neutral">Đã đóng</span>
                      : <span className="badge-danger">Quá hạn</span>
                    }
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="text-sand-muted hover:text-danger transition-colors"
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                        delete
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Loan;