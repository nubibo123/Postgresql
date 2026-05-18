import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import QRCodeModal from '../components/QRCodeModal';
import CashFlowChart from '../components/CashFlowChart';

const API = 'http://localhost:5000/api';

const formatUSD = (n) =>
  '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [summary, setSummary] = useState({ monthlyIncome: 0, monthlyExpense: 0, cashflow: [] });
  const [qrAccount, setQrAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      try {
        const [accountsRes, recentRes, summaryRes] = await Promise.all([
          axios.get(`${API}/accounts`, { headers }),
          axios.get(`${API}/accounts/recent-transactions`, { headers }),
          axios.get(`${API}/accounts/summary`, { headers }),
        ]);
        setAccounts(accountsRes.data);
        setRecentTx(recentRes.data);
        setSummary(summaryRes.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);
  const firstName = user?.full_name?.split(' ').slice(-1)[0] || 'Bạn';

  // Income trend vs last month (simplified — just show sign)
  const incomePositive = summary.monthlyIncome > 0;
  const expenseOver = summary.monthlyExpense > summary.monthlyIncome * 0.5;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-sand-dim mb-1 font-medium">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
            className="text-2xl font-semibold"
          >
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/transfer" className="btn-primary flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              send
            </span>
            Chuyển tiền
          </Link>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="card-elevated p-6" style={{ borderColor: 'rgba(212, 170, 100, 0.1)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-white/[0.06]">
          {/* Total Balance */}
          <div className="sm:pr-8">
            <p className="text-xs uppercase tracking-wider text-sand-dim font-medium mb-3">Tổng số dư</p>
            <p
              style={{ fontFamily: 'Sora, sans-serif', color: '#d4aa64', letterSpacing: '-0.03em' }}
              className="text-3xl font-semibold mb-1"
            >
              {loading ? '—' : formatUSD(totalBalance)}
              {!loading && <span className="text-base font-normal text-sand-dim ml-1.5">USD</span>}
            </p>
            <p className="text-xs text-sand-dim mt-1">{accounts.length} tài khoản</p>
          </div>

          {/* Monthly Income */}
          <div className="sm:px-8">
            <p className="text-xs uppercase tracking-wider text-sand-dim font-medium mb-3">Thu nhập tháng này</p>
            <p
              style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.03em' }}
              className="text-3xl font-semibold mb-1"
            >
              {loading ? '—' : formatUSD(summary.monthlyIncome)}
              {!loading && <span className="text-base font-normal text-sand-dim ml-1.5">USD</span>}
            </p>
            {!loading && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${incomePositive ? 'text-success' : 'text-sand-dim'}`}>
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                  {incomePositive ? 'trending_up' : 'horizontal_rule'}
                </span>
                {incomePositive ? 'Có giao dịch trong tháng' : 'Chưa có thu nhập'}
              </p>
            )}
          </div>

          {/* Monthly Expense */}
          <div className="sm:pl-8">
            <p className="text-xs uppercase tracking-wider text-sand-dim font-medium mb-3">Chi tiêu tháng này</p>
            <p
              style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.03em' }}
              className="text-3xl font-semibold mb-1"
            >
              {loading ? '—' : formatUSD(summary.monthlyExpense)}
              {!loading && <span className="text-base font-normal text-sand-dim ml-1.5">USD</span>}
            </p>
            {!loading && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${expenseOver ? 'text-warning' : 'text-success'}`}>
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                  {expenseOver ? 'warning' : 'check_circle'}
                </span>
                {summary.monthlyExpense === 0 ? 'Chưa có chi tiêu' : expenseOver ? 'Chi tiêu cao' : 'Trong ngân sách'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 card p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="spinner" />
            </div>
          ) : (
            <CashFlowChart monthlyData={summary.cashflow.length > 0 ? summary.cashflow : []} />
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
            className="text-sm font-semibold uppercase tracking-wider mb-5 text-sand-dim"
          >
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'send', label: 'Chuyển tiền', to: '/transfer', color: '#d4aa64' },
              { icon: 'add_circle', label: 'Nạp tiền', to: '/deposit', color: '#34d399' },
              { icon: 'remove_circle', label: 'Rút tiền', to: '/withdraw', color: '#fbbf24' },
              { icon: 'account_balance', label: 'Vay vốn', to: '/loan', color: '#a78bc4' },
            ].map(({ icon, label, to, color }) => (
              <Link
                key={label}
                to={to}
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border hover:border-white/10 transition-all duration-150 hover:bg-white/[0.03] group"
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ color, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                >
                  {icon}
                </span>
                <span className="text-xs text-sand font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts + QR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2
              style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
              className="text-base font-semibold"
            >
              Tài khoản của tôi
            </h2>
            {accounts.length > 1 && (
              <span className="text-xs text-sand-dim">{accounts.length} tài khoản</span>
            )}
          </div>
          {loading ? (
            <div className="card p-8 text-center">
              <span className="spinner block mx-auto" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sand-dim text-sm mb-4">Bạn chưa có tài khoản nào</p>
              <Link to="/deposit" className="btn-primary inline-flex items-center gap-2 text-sm">
                Nạp tiền để bắt đầu
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc, i) => (
                <div
                  key={acc.id}
                  className="card p-5 flex items-center justify-between"
                  style={i === 0 ? { borderColor: 'rgba(212, 170, 100, 0.15)' } : {}}
                >
                  <div className="flex items-center gap-4">
                    <div
                      style={{
                        background: i === 0 ? 'rgba(212, 170, 100, 0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${i === 0 ? 'rgba(212, 170, 100, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{
                          color: i === 0 ? '#d4aa64' : '#6b7494',
                          fontVariationSettings: "'FILL' 0, 'wght' 300",
                        }}
                      >
                        credit_card
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-sand-dim mb-0.5">Số tài khoản</p>
                      <p className="text-sm text-sand mono">{acc.account_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-sand-dim mb-0.5">Số dư</p>
                      <p
                        style={{ fontFamily: 'Sora, sans-serif', color: i === 0 ? '#d4aa64' : '#eef0f8' }}
                        className="text-base font-semibold"
                      >
                        {formatUSD(acc.balance)}
                        <span className="text-xs font-normal text-sand-dim ml-1">USD</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setQrAccount(acc)}
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-sand-dim" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                        qr_code_2
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3
              style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
              className="text-sm font-semibold"
            >
              Nhận tiền qua QR
            </h3>
            <span className="badge-success">Hoạt động</span>
          </div>
          <div
            style={{ background: '#ffffff', borderRadius: '12px' }}
            className="flex items-center justify-center p-5 mb-5"
          >
            <div
              style={{ background: '#060810', borderRadius: '8px', width: '120px', height: '120px' }}
              className="flex items-center justify-center"
            >
              <span
                className="material-symbols-outlined text-amber"
                style={{ fontSize: '64px', fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 64" }}
              >
                qr_code_2
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-sand-dim mb-1.5 uppercase tracking-wider">ID định danh</p>
            {accounts[0] ? (
              <p className="text-sm font-medium text-amber mono">
                {(() => {
                  const raw = String(accounts[0].account_number).padStart(10, '0');
                  return `SB-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
                })()}
              </p>
            ) : (
              <p className="text-sm text-sand-dim">—</p>
            )}
            {accounts.length > 0 && (
              <button
                onClick={() => setQrAccount(accounts[0])}
                className="btn-secondary w-full mt-4 text-xs"
              >
                Tải mã QR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions — real data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
            className="text-base font-semibold"
          >
            Giao dịch gần đây
          </h2>
          <Link to="/history" className="text-xs text-amber hover:text-amber-bright transition-colors flex items-center gap-1">
            Xem tất cả
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="spinner" />
            </div>
          ) : recentTx.length === 0 ? (
            <div className="py-12 text-center">
              <span
                className="material-symbols-outlined text-3xl text-sand-dim block mb-3"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
              >
                receipt_long
              </span>
              <p className="text-sand-dim text-sm">Chưa có giao dịch nào</p>
              <p className="text-xs text-sand-muted mt-1">Hãy thực hiện giao dịch đầu tiên của bạn</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loại / Nội dung</th>
                  <th>Tài khoản</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div>
                        <p className="text-sand text-sm font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-sand-dim">{tx.reference || '—'}</p>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-sand-dim mono">
                        {tx.direction === 'debit'
                          ? <span>→ {tx.to_account || '—'}</span>
                          : <span>← {tx.from_account || '—'}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-sand-dim">
                        {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                      </span>
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
                          color: tx.direction === 'debit' ? '#f87171' : '#34d399',
                          letterSpacing: '-0.01em',
                        }}
                        className="text-sm font-semibold"
                      >
                        {tx.direction === 'debit' ? '−' : '+'}{formatUSD(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {qrAccount && (
        <QRCodeModal
          accountNumber={qrAccount.account_number}
          onClose={() => setQrAccount(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;