import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Tổng quan', exact: true },
  { to: '/deposit', icon: 'add_circle', label: 'Nạp tiền' },
  { to: '/withdraw', icon: 'remove_circle', label: 'Rút tiền' },
  { to: '/transfer', icon: 'swap_horiz', label: 'Chuyển tiền' },
  { to: '/history', icon: 'receipt_long', label: 'Lịch sử' },
  { to: '/loan', icon: 'account_balance', label: 'Khoản vay' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(-2).join('')
    : 'SB';

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          background: 'rgba(10, 13, 22, 0.96)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        }}
        className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 hidden lg:flex"
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div
              style={{ background: 'rgba(212, 170, 100, 0.12)', border: '1px solid rgba(212, 170, 100, 0.2)' }}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <span
                className="material-symbols-outlined text-amber text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                account_balance
              </span>
            </div>
            <div>
              <span
                style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
                className="text-sm font-semibold leading-none block"
              >
                SecureBank
              </span>
              <span className="text-[10px] text-sand-dim mt-0.5 block tracking-wider uppercase">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div className="px-6 mb-2">
          <span className="text-[10px] font-medium tracking-widest uppercase text-sand-muted">Menu</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {navItems.map(({ to, icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'text-amber bg-amber-surface'
                    : 'text-sand-dim hover:text-sand hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-lg flex-shrink-0"
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20"
                        : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20",
                    }}
                  >
                    {icon}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div
              style={{ background: 'rgba(212, 170, 100, 0.15)', color: '#d4aa64' }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            >
              {initials.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sand truncate font-medium leading-none">
                {user?.full_name || 'Người dùng'}
              </p>
              <p className="text-[11px] text-sand-dim mt-0.5 leading-none capitalize">{user?.role || 'user'}</p>
            </div>
          </div>

          {/* Admin link */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-0.5 ${
                  isActive ? 'text-amber bg-amber-surface' : 'text-sand-dim hover:text-sand hover:bg-white/[0.04]'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>
                admin_panel_settings
              </span>
              <span className="text-sm font-medium">Quản trị</span>
            </NavLink>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 text-sand-dim hover:text-danger hover:bg-danger-surface"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>
              logout
            </span>
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        style={{
          background: 'rgba(10, 13, 22, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
        }}
        className="fixed top-0 left-0 right-0 z-40 h-14 flex justify-between items-center px-4 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <div
            style={{ background: 'rgba(212, 170, 100, 0.12)', border: '1px solid rgba(212, 170, 100, 0.2)' }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-amber text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 18" }}>
              account_balance
            </span>
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }} className="text-sm font-semibold">
            SecureBank
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile nav - simplified dropdown can be added later */}
          <div
            style={{ background: 'rgba(212, 170, 100, 0.12)', color: '#d4aa64' }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          >
            {initials.toUpperCase()}
          </div>
        </div>
      </header>
    </>
  );
};

export default Sidebar;