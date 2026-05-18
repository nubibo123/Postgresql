import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

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

  const navItems = [
    { to: '/', icon: 'dashboard', label: 'Tổng quan', exact: true },
    { to: '/deposit', icon: 'account_balance_wallet', label: 'Nạp tiền' },
    { to: '/withdraw', icon: 'savings', label: 'Rút tiền' },
    { to: '/transfer', icon: 'swap_horiz', label: 'Chuyển tiền' },
    { to: '/history', icon: 'history', label: 'Lịch sử' },
    { to: '/loan', icon: 'payments', label: 'Khoản vay' },
  ];

  const activeClass = 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg pl-6';
  const idleClass = 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-l-lg pl-6 transition-all duration-200 hover:pl-6';

  if (!token) return null;

  return (
    <>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b border-glass-border flex justify-between items-center px-margin-desktop">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
          </div>
          <span className="font-headline-md text-headline-md text-primary font-bold">SecureBank</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-primary">notifications</span>
          </button>
          {/* Menu (mobile) */}
          <button className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer lg:hidden">
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          {/* Avatar */}
          <img
            alt="User avatar"
            className="w-9 h-9 rounded-full border border-primary/30 object-cover"
            src="https://api.dicebear.com/7.x/initials/svg?seed=User"
          />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-glass-surface backdrop-blur-xl border-r border-glass-border flex flex-col pt-margin-desktop">
        {/* Logo */}
        <div className="px-6 mb-stack-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">account_balance</span>
            </div>
            <div>
              <h2 className="font-label-md text-label-md text-on-surface font-bold leading-none">SecureBank</h2>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">Enterprise Wealth</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map(({ to, icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `${isActive ? activeClass : idleClass} flex items-center gap-3 px-4 py-3`
              }
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              <span className="font-label-md text-label-md">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom — Quick Transfer + Logout */}
        <div className="px-3 flex flex-col gap-1">
          {/* Quick Transfer button */}
          <NavLink
            to="/transfer"
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded-xl mb-2 shadow-primary-glow active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Chuyển Tiền Nhanh
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-error hover:text-error/80 flex items-center gap-3 px-4 py-3 rounded-l-lg transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;