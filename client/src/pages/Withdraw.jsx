import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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

  const selectedAccount = accounts.find(a => a.id === formData.accountId || a.id === parseInt(formData.accountId));
  const presetAmounts = [50, 100, 200, 500];

  return (
    <div className="max-w-xl animate-slide-up">
      <div className="mb-8">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-sand-dim hover:text-sand mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            arrow_back
          </span>
          Quay lại
        </Link>
        <h1
          style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
          className="text-2xl font-semibold mb-1"
        >
          Rút tiền
        </h1>
        <p className="text-sm text-sand-dim">Rút tiền từ tài khoản của bạn</p>
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}
      {success && (
        <div className="alert-success mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Tài khoản nguồn
          </label>
          <select
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            className="input-field"
            required
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_number} — ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </option>
            ))}
          </select>
          {selectedAccount && (
            <p className="text-xs text-sand-dim mt-1.5">
              Số dư khả dụng:{' '}
              <span className="text-amber font-medium">
                ${parseFloat(selectedAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Số tiền
          </label>
          <div className="relative">
            <input
              type="number"
              name="amount"
              id="withdraw-amount"
              value={formData.amount}
              onChange={handleChange}
              className="input-field pr-14"
              placeholder="0"
              step="0.01"
              min="0.01"
              required
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-sand-dim font-medium pointer-events-none"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              USD
            </span>
          </div>
          <div className="flex gap-2 mt-2.5">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                className="flex-1 text-xs py-1.5 rounded-lg text-sand-dim hover:text-amber hover:border-amber-border transition-all duration-150"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Ghi chú <span className="normal-case tracking-normal">(tùy chọn)</span>
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="input-field"
            placeholder="Rút tiền mặt"
          />
        </div>

        <button
          type="submit"
          id="withdraw-submit"
          className="btn-primary w-full flex justify-center items-center gap-2"
          disabled={loading || accounts.length === 0}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Đang xử lý...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                remove_circle
              </span>
              Rút tiền
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Withdraw;