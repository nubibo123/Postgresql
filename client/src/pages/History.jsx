import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CashFlowChart from '../components/CashFlowChart';

const History = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [accountsRes, loansRes] = await Promise.all([
          axios.get('http://localhost:5000/api/accounts', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/loans', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAccounts(accountsRes.data);
        setLoans(loansRes.data);
        if (accountsRes.data.length > 0) {
          setSelectedAccount(accountsRes.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/accounts/${selectedAccount}/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [selectedAccount]);

  const currentAccountData = accounts.find(a => a.id === selectedAccount);

  const calcLoanInterest = (loan) => {
    return (loan.principal * parseFloat(loan.interest_rate) / 100).toFixed(2);
  };

  const calcMonthlyPayment = (loan) => {
    const total = parseFloat(loan.principal) * (1 + parseFloat(loan.interest_rate) / 100);
    return (total / loan.term_months).toFixed(2);
  };

  const getLoanStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-900/50 text-green-400 border-green-800',
      closed: 'bg-gray-700/50 text-gray-400 border-gray-600',
      defaulted: 'bg-red-900/50 text-red-400 border-red-800'
    };
    return styles[status] || styles.closed;
  };

  const totalLoans = loans.reduce((sum, l) => sum + parseFloat(l.principal), 0);
  const activeLoans = loans.filter(l => l.status === 'active').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold text-white">History</h1>

        {accounts.length > 0 && (
          <div className="w-56">
            <label className="block text-gray-400 text-sm font-medium mb-1">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input-field"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_number}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-0">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2 text-sm font-medium rounded-t border-b-2 transition ${
            activeTab === 'transactions'
              ? 'border-brand-accent text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-5 py-2 text-sm font-medium rounded-t border-b-2 transition flex items-center gap-2 ${
            activeTab === 'loans'
              ? 'border-brand-accent text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Loans
          {loans.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'loans' ? 'bg-brand-accent/30 text-brand-accent' : 'bg-gray-800 text-gray-400'
            }`}>
              {loans.length}
            </span>
          )}
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Cash Flow Overview</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : (
              <CashFlowChart transactions={transactions} account={currentAccountData} />
            )}
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No transactions found for this account.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Details</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const currentAccNum = accounts.find(a => a.id === selectedAccount)?.account_number;
                    const isDebit = tx.from_account === currentAccNum;
                    const sign = isDebit ? '-' : '+';
                    const colorClass = isDebit ? 'text-white' : 'text-green-400';

                    return (
                      <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                        <td className="py-4 px-4 text-sm text-gray-300">
                          {new Date(tx.created_at).toLocaleDateString()}<br />
                          <span className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-300 capitalize">
                          <span className="bg-gray-800 px-2 py-1 rounded text-xs border border-gray-700">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="text-gray-300">{tx.reference || 'N/A'}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {isDebit ? `To: ${tx.to_account}` : `From: ${tx.from_account || 'System'}`}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${colorClass}`}>
                          {sign}${parseFloat(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <>
          {/* Loan Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card py-4 px-5">
              <p className="text-gray-400 text-sm font-medium">Total Loans</p>
              <p className="text-2xl font-bold text-white mt-1">{loans.length}</p>
            </div>
            <div className="card py-4 px-5">
              <p className="text-gray-400 text-sm font-medium">Active Loans</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{activeLoans}</p>
            </div>
            <div className="card py-4 px-5">
              <p className="text-gray-400 text-sm font-medium">Total Principal</p>
              <p className="text-2xl font-bold text-brand-accent mt-1">
                ${totalLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Loans Table */}
          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading loans...</div>
            ) : loans.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="mb-2">No loans found.</p>
                <p className="text-sm text-gray-500">Apply for a loan via the Loans page.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Account</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Principal</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Interest</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm text-right">Monthly</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Start</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">End</th>
                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition text-white">
                      <td className="py-4 px-4 font-mono text-sm">{loan.account_number || loan.account_id?.slice(0, 8)}</td>
                      <td className="py-4 px-4 font-medium">
                        ${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        {parseFloat(loan.interest_rate).toFixed(2)}%
                        <span className="text-xs text-gray-500 block">
                          (+${calcLoanInterest(loan)})
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        ${calcMonthlyPayment(loan)}
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-sm">
                        {new Date(loan.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-sm">
                        {new Date(loan.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getLoanStatusBadge(loan.status)}`}>
                          {loan.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default History;