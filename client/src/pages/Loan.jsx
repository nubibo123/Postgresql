import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Loan = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountId: '',
    principal: '',
    interestRate: '',
    termMonths: '',
    startDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoans();
    fetchAccounts();
  }, []);

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
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoans(data);
    } catch (err) {
      console.error('Failed to fetch loans', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/loans', {
        ...formData,
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        termMonths: parseInt(formData.termMonths)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Loan application submitted successfully!');
      setFormData({
        ...formData,
        principal: '',
        interestRate: '',
        termMonths: '',
        startDate: ''
      });
      setShowForm(false);
      fetchLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit loan application');
    }
  };

  const handleDelete = async (loanId) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete loan');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-900/50 text-green-400 border-green-800',
      closed: 'bg-gray-700/50 text-gray-400 border-gray-600',
      defaulted: 'bg-red-900/50 text-red-400 border-red-800'
    };
    return styles[status] || styles.closed;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Loans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-primary px-6 ${showForm ? 'bg-gray-700 hover:bg-gray-600' : 'bg-brand-accent hover:opacity-90'}`}
        >
          {showForm ? 'Cancel' : '+  Apply for Loan'}
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 text-sm">{success}</div>}

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Loan Application</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Linked Account</label>
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className="input-field"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_number} - ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Principal (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                  <input
                    type="number"
                    name="principal"
                    value={formData.principal}
                    onChange={handleChange}
                    className="input-field pl-8"
                    placeholder="10000"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Interest Rate (%)</label>
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
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Term (Months)</label>
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
              <label className="block text-gray-400 text-sm font-medium mb-2">Start Date</label>
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
              className="btn-primary w-full mt-4 py-3 bg-brand-accent hover:opacity-90"
              disabled={accounts.length === 0}
            >
              Submit Application
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : loans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-2">No loans found.</p>
          <p className="text-gray-500 text-sm">Apply for a loan using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="py-3 px-4 font-medium">Account</th>
                <th className="py-3 px-4 font-medium">Principal</th>
                <th className="py-3 px-4 font-medium">Interest</th>
                <th className="py-3 px-4 font-medium">Term</th>
                <th className="py-3 px-4 font-medium">Start</th>
                <th className="py-3 px-4 font-medium">End</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition text-white">
                  <td className="py-3 px-4 font-mono text-sm">{loan.account_number}</td>
                  <td className="py-3 px-4">${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                  <td className="py-3 px-4">{loan.term_months} mo</td>
                  <td className="py-3 px-4">{new Date(loan.start_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{new Date(loan.end_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(loan.status)}`}>
                      {loan.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition"
                    >
                      Delete
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