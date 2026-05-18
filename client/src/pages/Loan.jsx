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

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-success-glow/10 text-success-glow border border-success-glow/30';
    if (status === 'closed') return 'bg-white/5 text-on-surface-variant border border-outline-variant';
    return 'bg-danger-glow/10 text-danger-glow border border-danger-glow/30';
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Khoản vay của tôi</h1>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary px-6 ${showForm ? 'bg-surface-container hover:opacity-80' : ''}`}>
          <span className="material-symbols-outlined mr-1">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Hủy' : 'Đăng ký vay'}
        </button>
      </div>

      {error && <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      {success && <div className="bg-success-glow/10 border border-success-glow/30 text-success-glow px-4 py-3 rounded-xl mb-6 text-sm">{success}</div>}

      {showForm && (
        <div className="glass-card p-stack-lg rounded-2xl mb-stack-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Đơn đăng ký vay</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-on-surface-variant text-label-md mb-2">Tài khoản liên kết</label>
              <select name="accountId" value={formData.accountId} onChange={handleChange} className="input-field" required>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_number} — ${parseFloat(acc.balance).toFixed(2)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-on-surface-variant text-label-md mb-2">Số tiền vay (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-on-surface-variant">$</span>
                  <input type="number" name="principal" value={formData.principal} onChange={handleChange} className="input-field pl-8" placeholder="10000" step="0.01" min="0.01" required />
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant text-label-md mb-2">Lãi suất (%)</label>
                <div className="relative">
                  <input type="number" name="interestRate" value={formData.interestRate} onChange={handleChange} className="input-field pr-8" placeholder="5.5" step="0.01" min="0" required />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant">%</span>
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant text-label-md mb-2">Kỳ hạn (tháng)</label>
                <input type="number" name="termMonths" value={formData.termMonths} onChange={handleChange} className="input-field" placeholder="12" min="1" required />
              </div>
            </div>
            <div>
              <label className="block text-on-surface-variant text-label-md mb-2">Ngày bắt đầu</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input-field" required />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={accounts.length === 0}>
              <span className="material-symbols-outlined mr-1">check</span>
              Gửi đơn đăng ký
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-on-surface-variant py-10">Đang tải...</div>
      ) : loans.length === 0 ? (
        <div className="glass-card p-stack-lg rounded-2xl text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">payments</span>
          <p className="text-on-surface-variant mb-2">Chưa có khoản vay nào.</p>
          <p className="text-on-surface-variant text-sm">Đăng ký khoản vay bằng nút bên trên.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
              <th className="px-stack-md py-3 font-medium">Tài khoản</th>
              <th className="px-stack-md py-3 font-medium text-right">Số tiền</th>
              <th className="px-stack-md py-3 font-medium">Lãi suất</th>
              <th className="px-stack-md py-3 font-medium">Kỳ hạn</th>
              <th className="px-stack-md py-3 font-medium">Bắt đầu</th>
              <th className="px-stack-md py-3 font-medium">Kết thúc</th>
              <th className="px-stack-md py-3 font-medium">Trạng thái</th>
              <th className="px-stack-md py-3 font-medium"></th>
            </tr></thead>
            <tbody className="divide-y divide-glass-border">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-white/5 transition text-on-surface">
                  <td className="px-stack-md py-4 font-mono text-sm">{loan.account_number || loan.account_id?.slice(0, 8)}</td>
                  <td className="px-stack-md py-4 text-right font-label-md text-primary">${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-stack-md py-4 text-label-md">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                  <td className="px-stack-md py-4 text-label-md">{loan.term_months} tháng</td>
                  <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(loan.start_date).toLocaleDateString()}</td>
                  <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(loan.end_date).toLocaleDateString()}</td>
                  <td className="px-stack-md py-4"><span className={`px-2 py-1 text-[10px] rounded-full border ${getStatusBadge(loan.status)}`}>{loan.status.toUpperCase()}</span></td>
                  <td className="px-stack-md py-4">
                    <button onClick={() => handleDelete(loan.id)} className="text-danger-glow hover:text-danger-glow/70 text-sm transition cursor-pointer">
                      <span className="material-symbols-outlined text-lg">delete</span>
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