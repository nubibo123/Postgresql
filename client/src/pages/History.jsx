import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
          axios.get('http://localhost:5000/api/accounts', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/loans', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAccounts(accountsRes.data);
        setLoans(loansRes.data);
        if (accountsRes.data.length > 0) setSelectedAccount(accountsRes.data[0].id);
      } catch (error) { console.error('Failed to fetch data', error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/accounts/${selectedAccount}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setTransactions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccount]);

  const totalLoans = loans.reduce((s, l) => s + parseFloat(l.principal || 0), 0);
  const activeLoans = loans.filter(l => l.status === 'active').length;

  const getStatusBadge = (status) => {
    if (status === 'completed') return 'bg-success-glow/10 text-success-glow border border-success-glow/30';
    if (status === 'pending') return 'bg-warning-glow/10 text-warning-glow border border-warning-glow/30';
    return 'bg-white/5 text-on-surface-variant border border-outline-variant';
  };

  const getLoanStatusBadge = (status) => {
    if (status === 'active') return 'bg-success-glow/10 text-success-glow border border-success-glow/30';
    if (status === 'closed') return 'bg-white/5 text-on-surface-variant border border-outline-variant';
    return 'bg-danger-glow/10 text-danger-glow border border-danger-glow/30';
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-end mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Lịch sử giao dịch</h1>
        {accounts.length > 0 && (
          <div>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="input-field text-label-md">
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_number}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-glass-border pb-0">
        {[
          { key: 'transactions', label: 'Giao dịch', icon: 'swap_horiz' },
          { key: 'loans', label: 'Khoản vay', icon: 'payments', count: loans.length }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2.5 text-label-md font-label-md rounded-t border-b-2 transition flex items-center gap-2 ${
            activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? <div className="text-center text-on-surface-variant py-10">Đang tải...</div> :
           transactions.length === 0 ? <div className="text-center text-on-surface-variant py-10">Chưa có giao dịch nào.</div> : (
            <table className="w-full text-left">
              <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
                <th className="px-stack-md py-3 font-medium">Ngày</th>
                <th className="px-stack-md py-3 font-medium">Mã GD</th>
                <th className="px-stack-md py-3 font-medium">Loại</th>
                <th className="px-stack-md py-3 font-medium">Mô tả</th>
                <th className="px-stack-md py-3 font-medium">Trạng thái</th>
                <th className="px-stack-md py-3 font-medium text-right">Số tiền</th>
              </tr></thead>
              <tbody className="divide-y divide-glass-border">
                {transactions.map(tx => {
                  const currentAccNum = accounts.find(a => a.id === selectedAccount)?.account_number;
                  const isDebit = tx.from_account === currentAccNum;
                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition text-on-surface">
                      <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">
                        <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-on-surface-variant opacity-60">{new Date(tx.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-stack-md py-4 font-mono text-sm text-on-surface-variant">{tx.id?.slice(0, 8)}</td>
                      <td className="px-stack-md py-4"><span className="bg-surface-container px-2 py-0.5 rounded text-[10px] border border-outline-variant">{tx.type}</span></td>
                      <td className="px-stack-md py-4 text-label-md">{tx.reference || '—'}</td>
                      <td className="px-stack-md py-4"><span className={`px-2 py-1 text-[10px] rounded-full border ${getStatusBadge(tx.status)}`}>{tx.status}</span></td>
                      <td className={`px-stack-md py-4 text-right font-label-md ${isDebit ? 'text-on-surface' : 'text-success-glow'}`}>
                        {isDebit ? '' : '+'}${parseFloat(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-6">
            <div className="glass-card py-4 px-5 rounded-xl text-center">
              <p className="text-on-surface-variant text-label-md mb-1">Tổng khoản vay</p>
              <p className="font-headline-md text-on-surface">{loans.length}</p>
            </div>
            <div className="glass-card py-4 px-5 rounded-xl text-center">
              <p className="text-on-surface-variant text-label-md mb-1">Đang hoạt động</p>
              <p className="font-headline-md text-success-glow">{activeLoans}</p>
            </div>
            <div className="glass-card py-4 px-5 rounded-xl text-center">
              <p className="text-on-surface-variant text-label-md mb-1">Tổng tiền vay</p>
              <p className="font-headline-md text-primary">${totalLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            {loading ? <div className="text-center text-on-surface-variant py-10">Đang tải...</div> :
             loans.length === 0 ? <div className="text-center text-on-surface-variant py-10">Chưa có khoản vay nào.</div> : (
              <table className="w-full text-left">
                <thead><tr className="border-b border-glass-border text-on-surface-variant text-label-sm">
                  <th className="px-stack-md py-3 font-medium">Tài khoản</th>
                  <th className="px-stack-md py-3 font-medium text-right">Số tiền</th>
                  <th className="px-stack-md py-3 font-medium">Lãi suất</th>
                  <th className="px-stack-md py-3 font-medium">Kỳ hạn</th>
                  <th className="px-stack-md py-3 font-medium">Bắt đầu</th>
                  <th className="px-stack-md py-3 font-medium">Kết thúc</th>
                  <th className="px-stack-md py-3 font-medium">Trạng thái</th>
                </tr></thead>
                <tbody className="divide-y divide-glass-border">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-white/5 transition text-on-surface">
                      <td className="px-stack-md py-4 font-mono text-sm">{loan.account_number || loan.account_id?.slice(0, 8)}</td>
                      <td className="px-stack-md py-4 text-right text-primary font-label-md">${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-stack-md py-4 text-label-md">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                      <td className="px-stack-md py-4 text-label-md">{loan.term_months} tháng</td>
                      <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(loan.start_date).toLocaleDateString()}</td>
                      <td className="px-stack-md py-4 text-label-sm text-on-surface-variant">{new Date(loan.end_date).toLocaleDateString()}</td>
                      <td className="px-stack-md py-4"><span className={`px-2 py-1 text-[10px] rounded-full border ${getLoanStatusBadge(loan.status)}`}>{loan.status.toUpperCase()}</span></td>
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