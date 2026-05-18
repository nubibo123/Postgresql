import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Withdraw = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({ accountId: '', amount: '', reference: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAccounts(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, accountId: data[0].id }));
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/accounts/withdraw', formData, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Rút tiền thành công!');
      setFormData({ ...formData, amount: '', reference: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Rút tiền không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-lg">Rút tiền</h1>
      <div className="glass-card p-stack-lg rounded-2xl">
        {error && <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        {success && <div className="bg-success-glow/10 border border-success-glow/30 text-success-glow px-4 py-3 rounded-xl mb-6 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Tài khoản nguồn</label>
            <select name="accountId" value={formData.accountId} onChange={handleChange} className="input-field" required>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_number} — ${parseFloat(acc.balance).toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Số tiền (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-on-surface-variant">$</span>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field pl-8" placeholder="0.00" step="0.01" min="0.01" required />
            </div>
          </div>
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Ghi chú</label>
            <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="input-field" placeholder="Rút tiền mặt" />
          </div>
          <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 mt-2" disabled={loading || accounts.length === 0}>
            <span className="material-symbols-outlined">payments</span>
            {loading ? 'Đang xử lý...' : 'Rút tiền'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Withdraw;