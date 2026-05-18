import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-brand-card border-b border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
            <span className="text-white text-sm">SB</span>
          </div>
          SecureBank
        </Link>

        <div className="flex items-center gap-6">
          {token ? (
            <>
              <Link to="/" className="text-gray-300 hover:text-white transition">Dashboard</Link>
              <Link to="/deposit" className="text-gray-300 hover:text-white transition">Deposit</Link>
              <Link to="/withdraw" className="text-gray-300 hover:text-white transition">Withdraw</Link>
              <Link to="/transfer" className="text-gray-300 hover:text-white transition">Transfer</Link>
              <Link to="/history" className="text-gray-300 hover:text-white transition">History</Link>
              <Link to="/loan" className="text-gray-300 hover:text-white transition">Loans</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-purple-300 hover:text-purple-200 transition font-medium">Admin</Link>
              )}
              <div className="flex items-center gap-4 ml-4 border-l border-gray-700 pl-4">
                <span className="text-sm text-gray-400">Hi, {user?.full_name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition">Login</Link>
              <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
