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
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-obsidian-deep relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="glass-card w-full max-w-md p-stack-lg rounded-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-stack-lg">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Chào mừng trở lại</h2>
          <p className="font-body-md text-on-surface-variant mt-2">Đăng nhập vào SecureBank</p>
        </div>

        {error && (
          <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-6 text-sm font-label-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-on-surface-variant text-label-md font-label-md mb-2">Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>
          <div>
            <label className="block text-on-surface-variant text-label-md font-label-md mb-2">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Đang đăng nhập...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-body-md text-on-surface-variant">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;