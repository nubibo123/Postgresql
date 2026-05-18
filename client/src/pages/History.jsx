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
    setLoading(true);
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/accounts/${selectedAccount}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setTransactions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccount]);

  const totalLoans = loans.reduce((s, l) => s + parseFloat(l.principal || 0), 0);
  const activeLoans = loans.filter(l => l.status === 'active').length;

  return (
    <div className="max-w-5xl animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
            className="text-2xl font-semibold mb-1"
          >
            Lịch sử
          </h1>
          <p className="text-sm text-sand-dim">Theo dõi giao dịch và khoản vay của bạn</p>
        </div>
        {accounts.length > 0 && activeTab === 'transactions' && (
          <div>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="input-field text-sm"
              style={{ width: 'auto', minWidth: '200px' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_number}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {[
          { key: 'transactions', label: 'Giao dịch', icon: 'swap_horiz' },
          { key: 'loans', label: 'Khoản vay', icon: 'account_balance', count: loans.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: `'FILL' ${activeTab === tab.key ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 20` }}
            >
              {tab.icon}
            </span>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  background: activeTab === tab.key ? 'rgba(212, 170, 100, 0.15)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.key ? '#d4aa64' : '#6b7494',
                }}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium mono"
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-14">
              <span className="spinner" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-14 text-center">
              <span
                className="material-symbols-outlined text-3xl text-sand-dim block mb-3"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
              >
                receipt_long
              </span>
              <p className="text-sand-dim text-sm">Chưa có giao dịch nào</p>
              <p className="text-xs text-sand-muted mt-1">Các giao dịch sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Mã GD</th>
                  <th>Loại</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const currentAccNum = accounts.find(a => a.id === selectedAccount || String(a.id) === String(selectedAccount))?.account_number;
                  const isDebit = tx.from_account === currentAccNum;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="text-xs text-sand">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[10px] text-sand-dim mt-0.5 mono">
                          {new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span className="text-[10px] mono text-sand-dim">{tx.id?.slice(0, 8)}</span>
                      </td>
                      <td>
                        <span
                          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
                          className="text-[10px] px-1.5 py-0.5 rounded text-sand-dim mono"
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-sand">{tx.reference || '—'}</span>
                      </td>
                      <td>
                        {tx.status === 'completed'
                          ? <span className="badge-success">Hoàn tất</span>
                          : tx.status === 'pending'
                          ? <span className="badge-warning">Xử lý</span>
                          : <span className="badge-neutral">{tx.status}</span>
                        }
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontFamily: 'Sora, sans-serif',
                            color: isDebit ? '#f87171' : '#34d399',
                            letterSpacing: '-0.01em',
                          }}
                          className="text-sm font-semibold"
                        >
                          {isDebit ? '−' : '+'}
                          {parseFloat(tx.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
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
        <div className="space-y-6">
          {/* Loan stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tổng khoản vay', value: loans.length, color: '#eef0f8' },
              { label: 'Đang hoạt động', value: activeLoans, color: '#34d399' },
              { label: 'Tổng tiền vay', value: totalLoans > 0 ? '$' + totalLoans.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—', color: '#d4aa64' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-5">
                <p className="text-xs text-sand-dim uppercase tracking-wider font-medium mb-2">{label}</p>
                <p
                  style={{ fontFamily: 'Sora, sans-serif', color, letterSpacing: '-0.02em' }}
                  className="text-xl font-semibold"
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-14">
                <span className="spinner" />
              </div>
            ) : loans.length === 0 ? (
              <div className="py-14 text-center">
                <span
                  className="material-symbols-outlined text-3xl text-sand-dim block mb-3"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
                >
                  account_balance
                </span>
                <p className="text-sand-dim text-sm">Chưa có khoản vay nào</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tài khoản</th>
                    <th style={{ textAlign: 'right' }}>Số tiền</th>
                    <th>Lãi suất</th>
                    <th>Kỳ hạn</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id}>
                      <td><span className="mono text-xs text-sand">{loan.account_number || loan.account_id?.slice(0, 8)}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'Sora, sans-serif', color: '#d4aa64' }} className="text-sm font-semibold">
                          ${parseFloat(loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td><span className="text-sm text-sand">{parseFloat(loan.interest_rate).toFixed(2)}%</span></td>
                      <td><span className="text-sm text-sand">{loan.term_months} tháng</span></td>
                      <td><span className="text-xs text-sand-dim">{new Date(loan.start_date).toLocaleDateString('vi-VN')}</span></td>
                      <td><span className="text-xs text-sand-dim">{new Date(loan.end_date).toLocaleDateString('vi-VN')}</span></td>
                      <td>
                        {loan.status === 'active'
                          ? <span className="badge-success">Hoạt động</span>
                          : loan.status === 'closed'
                          ? <span className="badge-neutral">Đã đóng</span>
                          : <span className="badge-danger">Quá hạn</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;