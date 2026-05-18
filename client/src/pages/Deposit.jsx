import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Deposit = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    reference: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
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
          setFormData(prev => ({ ...prev, accountId: data[0].id }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/accounts/deposit', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Deposit completed successfully!');
      setFormData({ ...formData, amount: '', reference: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Deposit Money</h1>
      
      <div className="card">
        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">To Account</label>
            <select
              name="accountId"
              value={formData.accountId}
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
            className="btn-primary w-full mt-4 py-3 text-lg bg-green-600 hover:bg-green-700 focus:ring-green-500"
            disabled={loading || accounts.length === 0}
          >
            {loading ? 'Processing...' : 'Deposit Money'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Deposit;
