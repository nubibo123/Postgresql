import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', full_name: '', password: '' });
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
      const { data } = await axios.post('http://localhost:5000/api/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Username có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-5 animate-slide-up">
      {/* Ambient glow */}
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
          Tạo tài khoản
        </h1>
        <p className="text-sm text-sand-dim">Đăng ký SecureBank ngay hôm nay</p>
      </div>

      {error && (
        <div className="alert-error mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            error
          </span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-sand-dim mb-1.5 uppercase tracking-wider">
            Họ và tên
          </label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="input-field"
            required
            placeholder="Nguyễn Văn A"
          />
        </div>

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
            placeholder="username"
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
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          id="register-btn"
          className="btn-primary w-full flex justify-center items-center gap-2 mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Đang đăng ký...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-sand-dim">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-amber hover:text-amber-bright font-medium transition-colors">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
};

export default Register;