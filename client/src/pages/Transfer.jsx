import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      .then(({ data }) => { setAccounts(data); if (data.length > 0) setFormData(prev => ({ ...prev, fromAccountId: data[0].id })); })
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
      // Simple QR decode via jsqr if available
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          const raw = code.data.replace(/\D/g, '').slice(-10);
          setFormData(prev => ({ ...prev, toAccountNumber: raw }));
          setError('');
        } else setError('Không đọc được mã QR');
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

  return (
    <div className="max-w-2xl">
      <canvas ref={canvasRef} className="hidden" />
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-lg">Chuyển tiền</h1>
      <div className="glass-card p-stack-lg rounded-2xl">
        {error && <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        {success && <div className="bg-success-glow/10 border border-success-glow/30 text-success-glow px-4 py-3 rounded-xl mb-6 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Tài khoản nguồn</label>
            <select name="fromAccountId" value={formData.fromAccountId} onChange={handleChange} className="input-field" required>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_number} — ${parseFloat(acc.balance).toFixed(2)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Số tài khoản người nhận</label>
            <div className="flex gap-2">
              <input type="text" name="toAccountNumber" value={formData.toAccountNumber} onChange={handleChange} className="input-field font-mono flex-1" placeholder="Nhập số tài khoản hoặc quét QR" required />
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleQRFileChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 border border-glass-border bg-white/5 hover:bg-primary/10 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer" title="Quét mã QR">
                <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Số tiền (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-on-surface-variant">$</span>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field pl-8" placeholder="0.00" step="0.01" min="0.01" required />
            </div>
          </div>

          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Nội dung</label>
            <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="input-field" placeholder="Chuyển tiền" />
          </div>

          <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 mt-2" disabled={loading || accounts.length === 0}>
            <span className="material-symbols-outlined">send</span>
            {loading ? 'Đang xử lý...' : 'Chuyển tiền'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Transfer;