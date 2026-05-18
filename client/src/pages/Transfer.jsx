import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({ fromAccountId: '', toAccountNumber: '', amount: '', reference: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAccounts(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, fromAccountId: data[0].id }));
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleQRFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          const raw = code.data.replace(/\D/g, '').slice(-10);
          setFormData(prev => ({ ...prev, toAccountNumber: raw }));
          setError('');
        } else setError('Không đọc được mã QR. Vui lòng nhập thủ công.');
      }
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/accounts/transfer', formData, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Chuyển tiền thành công!');
      setFormData({ ...formData, toAccountNumber: '', amount: '', reference: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Chuyển tiền không thành công');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(a => String(a.id) === String(formData.fromAccountId));
  const presetAmounts = [50, 100, 200, 500];

  return (
    <div className="max-w-xl animate-slide-up">
      <canvas ref={canvasRef} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleQRFileChange} className="hidden" />

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
          Chuyển tiền
        </h1>
        <p className="text-sm text-sand-dim">Chuyển tiền đến tài khoản khác trong hệ thống</p>
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}
      {success && (
        <div className="alert-success mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* From account */}
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Tài khoản nguồn
          </label>
          <select
            name="fromAccountId"
            value={formData.fromAccountId}
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

        {/* Recipient */}
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Số tài khoản người nhận
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="toAccountNumber"
              id="to-account"
              value={formData.toAccountNumber}
              onChange={handleChange}
              className="input-field mono flex-1"
              placeholder="Nhập số tài khoản"
              required
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              className="flex-shrink-0 w-12 rounded-xl flex items-center justify-center hover:bg-white/[0.04] hover:border-amber-border transition-all duration-150"
              title="Quét mã QR"
            >
              <span
                className="material-symbols-outlined text-sand-dim text-base"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                qr_code_scanner
              </span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Số tiền
          </label>
          <div className="relative">
            <input
              type="number"
              name="amount"
              id="transfer-amount"
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

        {/* Reference */}
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Nội dung chuyển tiền <span className="normal-case tracking-normal">(tùy chọn)</span>
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="input-field"
            placeholder="Chuyển tiền"
          />
        </div>

        <button
          type="submit"
          id="transfer-submit"
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
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                send
              </span>
              Xác nhận chuyển tiền
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Transfer;