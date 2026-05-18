import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsqr from 'jsqr';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountNumber: '',
    amount: '',
    reference: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5000/api/accounts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAccounts(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, fromAccountId: data[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch accounts', error);
      }
    };
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQRFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsqr(imageData.data, canvas.width, canvas.height);
      if (code) {
        const raw = code.data.replace(/[^0-9]/g, '');
        if (raw.length >= 10) {
          const accountNumber = raw.replace(/\D/g, '').slice(-10);
          setFormData(prev => ({ ...prev, toAccountNumber: accountNumber }));
          setError('');
        } else {
          setError('Invalid QR code. Please use a SecureBank QR code.');
        }
      } else {
        setError('Could not read QR code. Please try a clearer image.');
      }
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/accounts/transfer', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Transfer completed successfully!');
      setFormData({ ...formData, toAccountNumber: '', amount: '', reference: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Hidden canvas for QR decoding */}
      <canvas ref={canvasRef} className="hidden" />

      <h1 className="text-3xl font-bold text-white mb-8">Transfer Money</h1>

      <div className="card">
        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">From Account</label>
            <select
              name="fromAccountId"
              value={formData.fromAccountId}
              onChange={handleChange}
              className="input-field"
              required
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_number} - Balance: ${parseFloat(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Destination Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="toAccountNumber"
                value={formData.toAccountNumber}
                onChange={handleChange}
                className="input-field font-mono flex-1"
                placeholder="Enter or scan QR"
                required
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleQRFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-brand-accent px-3 rounded transition flex items-center justify-center"
                title="Scan QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zm-2 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zm8-12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zm-1 7a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 011-1h3zm-1 2v1h1v-1h-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1">Click the QR icon to scan a SecureBank QR code</p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field pl-8"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Reference / Note</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="input-field"
              placeholder="What is this for?"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-4 py-3 text-lg"
            disabled={loading || accounts.length === 0}
          >
            {loading ? 'Processing...' : 'Send Money'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Transfer;