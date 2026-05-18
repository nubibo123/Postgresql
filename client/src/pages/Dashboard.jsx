import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import QRCodeModal from '../components/QRCodeModal';
import CashFlowChart from '../components/CashFlowChart';

const monthlyData = [
  { month: 'T1', income: 140, actual: 80 },
  { month: 'T2', income: 170, actual: 50 },
  { month: 'T3', income: 120, actual: 90 },
  { month: 'T4', income: 190, actual: 60 },
  { month: 'T5', income: 130, actual: 75 },
  { month: 'T6', income: 160, actual: 40 },
];

const sampleTransactions = [
  {
    id: 1,
    name: 'Apple Store Ho Chi Minh',
    category: 'Thiết bị công nghệ',
    icon: 'shopping_bag',
    color: 'secondary-container',
    iconColor: 'secondary',
    txId: 'TXN-49221',
    date: '24/05/2024',
    status: 'success',
    amount: -45000000,
  },
  {
    id: 2,
    name: 'Techcom Securities',
    category: 'Cổ tức đầu tư',
    icon: 'account_balance',
    color: 'primary-container',
    iconColor: 'primary',
    txId: 'TXN-49220',
    date: '23/05/2024',
    status: 'success',
    amount: 12500000,
  },
  {
    id: 3,
    name: 'Nguyen Van A',
    category: 'Chuyển tiền nội bộ',
    icon: 'person',
    color: 'tertiary-container',
    iconColor: 'tertiary',
    txId: 'TXN-49219',
    date: '22/05/2024',
    status: 'pending',
    amount: 5000000,
  },
  {
    id: 4,
    name: 'Cloud Nine Restaurant',
    category: 'Ăn uống & Giải trí',
    icon: 'restaurant',
    color: 'error-container',
    iconColor: 'error',
    txId: 'TXN-49218',
    date: '22/05/2024',
    status: 'success',
    amount: -2340000,
  },
];

const formatVND = (n) =>
  Math.abs(n).toLocaleString('vi-VN') + 'đ';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [qrAccount, setQrAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchAccounts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/accounts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(data);
      } catch (error) {
        console.error('Failed to fetch accounts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  const getStatusBadge = (status) => {
    if (status === 'success')
      return <span className="px-2 py-1 rounded-full bg-success-glow/10 text-success-glow text-[10px] font-bold">HOÀN TẤT</span>;
    return <span className="px-2 py-1 rounded-full bg-warning-glow/10 text-warning-glow text-[10px] font-bold">ĐANG XỬ LÝ</span>;
  };

  return (
    <div className="max-w-container-max mx-auto space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Bạn'}!
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Đây là tóm tắt tài chính của bạn hôm nay.
          </p>
        </div>
        <div className="flex gap-stack-md">
          <button className="btn-ghost flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-primary text-lg">file_download</span>
            Xuất báo cáo
          </button>
          <Link to="/transfer" className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Tạo hóa đơn
          </Link>
        </div>
      </div>

      {/* Balance Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Total Balance */}
        <div className="glass-card p-stack-md rounded-xl border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[144px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 144" }}>
              account_balance_wallet
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-2">Tổng số dư</p>
          <h3 className="font-headline-md text-headline-md text-on-surface font-label-md">
            {totalBalance > 0 ? totalBalance.toLocaleString('vi-VN') : '0'}
            <span className="text-sm opacity-60 ml-1">VND</span>
          </h3>
          <div className="mt-4 flex items-center gap-2 text-success-glow">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="font-label-sm text-label-sm">+4.5% tháng này</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="glass-card p-stack-md rounded-xl border-l-4 border-l-success-glow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[144px] text-success-glow" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 144" }}>
              arrow_upward
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-2">Thu nhập tháng này</p>
          <h3 className="font-headline-md text-headline-md text-on-surface font-label-md">
            320,000,000 <span className="text-sm opacity-60">VND</span>
          </h3>
          <div className="mt-4 flex items-center gap-2 text-success-glow">
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            <span className="font-label-sm text-label-sm">Đã nhận 80% mục tiêu</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="glass-card p-stack-md rounded-xl border-l-4 border-l-danger-glow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[144px] text-danger-glow" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 144" }}>
              warning
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-2">Chi tiêu tháng này</p>
          <h3 className="font-headline-md text-headline-md text-on-surface font-label-md">
            85,400,000 <span className="text-sm opacity-60">VND</span>
          </h3>
          <div className="mt-4 flex items-center gap-2 text-warning-glow">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span className="font-label-sm text-label-sm">Vượt 12% so với dự kiến</span>
          </div>
        </div>
      </div>

      {/* Chart + Quick Actions + QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-8 glass-card p-stack-md rounded-xl flex flex-col">
          <CashFlowChart monthlyData={monthlyData} />
        </div>

        {/* Right Column: Quick Actions + QR */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Quick Actions */}
          <div className="glass-card p-stack-md rounded-xl">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Thao tác nhanh</h2>
            <div className="grid grid-cols-2 gap-stack-sm">
              {[
                { icon: 'send', label: 'Chuyển tiền', to: '/transfer' },
                { icon: 'receipt_long', label: 'Hóa đơn', to: '/' },
                { icon: 'qr_code_scanner', label: 'Quét mã', to: '/transfer' },
                { icon: 'savings', label: 'Tiết kiệm', to: '/' },
              ].map(({ icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex flex-col items-center justify-center p-4 glass-card rounded-xl hover:bg-primary/10 transition-colors group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
                  <span className="font-label-sm text-label-sm text-on-surface">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accounts + Virtual QR Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Account Cards */}
        {accounts.length > 0 ? (
          <div className="lg:col-span-8 space-y-gutter">
            <h2 className="font-headline-md text-headline-md text-on-surface">Tài khoản của tôi</h2>
            {accounts.map(acc => (
              <div key={acc.id} className="glass-card p-stack-md rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant mb-1">Số tài khoản</p>
                  <p className="font-label-md text-label-md text-on-surface font-mono">{acc.account_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Số dư</p>
                  <p className="font-headline-md text-headline-md text-primary font-mono">
                    ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={() => setQrAccount(acc)}
                  className="ml-4 w-10 h-10 rounded-xl border border-glass-border bg-white/5 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary">qr_code_2</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="lg:col-span-8 glass-card p-stack-lg rounded-xl text-center">
            <p className="text-on-surface-variant">Bạn chưa có tài khoản nào.</p>
            <Link to="/deposit" className="btn-primary mt-4 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              Nạp tiền ngay
            </Link>
          </div>
        )}

        {/* Virtual QR Card */}
        <div className="lg:col-span-4">
          <div className="glass-card p-stack-md rounded-xl bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center justify-between mb-stack-md">
              <h3 className="font-label-md text-label-md text-on-surface">Tài khoản ảo</h3>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">Active</span>
            </div>
            <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-stack-md shadow-qr-glow">
              <div className="text-center">
                <div className="w-32 h-32 bg-obsidian-deep flex items-center justify-center rounded-lg mx-auto mb-2">
                  <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 64" }}>
                    qr_code_2
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Số tài khoản định danh</p>
              {accounts[0] && (
                <p className="font-label-md text-label-md text-primary font-bold font-mono">
                  {(() => {
                    const raw = accounts[0].account_number.padStart(10, '0');
                    return `SB-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
                  })()}
                </p>
              )}
              {accounts.length > 0 && (
                <button
                  onClick={() => setQrAccount(accounts[0])}
                  className="mt-4 w-full py-2 border border-primary/30 rounded-lg text-primary font-label-sm text-label-sm hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  Tải mã QR (PNG)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-stack-md py-stack-md border-b border-glass-border flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md">Giao dịch gần đây</h2>
          <Link to="/history" className="text-primary font-label-sm text-label-sm hover:underline">Xem tất cả</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 font-label-sm text-label-sm text-on-surface-variant">
              <tr>
                <th className="px-stack-md py-3">Người nhận/Gửi</th>
                <th className="px-stack-md py-3">Mã GD</th>
                <th className="px-stack-md py-3">Ngày</th>
                <th className="px-stack-md py-3">Trạng thái</th>
                <th className="px-stack-md py-3 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {sampleTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-stack-md py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-${tx.color}/20 flex items-center justify-center text-${tx.iconColor}`}>
                        <span className="material-symbols-outlined text-sm">{tx.icon}</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">{tx.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{tx.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-stack-md py-4 font-label-sm text-label-sm text-on-surface-variant font-mono">{tx.txId}</td>
                  <td className="px-stack-md py-4 font-label-sm text-label-sm text-on-surface-variant">{tx.date}</td>
                  <td className="px-stack-md py-4">{getStatusBadge(tx.status)}</td>
                  <td className={`px-stack-md py-4 text-right font-label-md text-label-md ${tx.amount < 0 ? 'text-danger-glow' : 'text-success-glow'}`}>
                    {tx.amount < 0 ? '' : '+'}{formatVND(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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