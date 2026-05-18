import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-5 animate-slide-up">
      {/* Ambient glow - fixed positioned relative to viewport */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(212, 170, 100, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="mb-10">
        <div
          style={{ background: 'rgba(212, 170, 100, 0.1)', border: '1px solid rgba(212, 170, 100, 0.18)' }}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
        >
          <span
            className="material-symbols-outlined text-amber text-lg"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            account_balance
          </span>
        </div>
        <h1
          style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.025em' }}
          className="text-2xl font-semibold mb-1"
        >
          Đăng nhập
        </h1>
        <p className="text-sm text-sand-dim">Chào mừng trở lại, SecureBank</p>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            error
          </span>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Tên đăng nhập
          </label>
          <input
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            required
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Mật khẩu
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          id="login-btn"
          className="btn-primary w-full flex justify-center items-center gap-2 mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-sand-dim">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-amber hover:text-amber-bright font-medium transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
};

export default Login;