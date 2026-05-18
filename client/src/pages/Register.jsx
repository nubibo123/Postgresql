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
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-obsidian-deep relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="glass-card w-full max-w-md p-stack-lg rounded-2xl relative z-10">
        <div className="text-center mb-stack-lg">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">how_to_reg</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Tạo tài khoản mới</h2>
          <p className="font-body-md text-on-surface-variant mt-2">�ăng ký SecureBank ngay hôm nay</p>
        </div>

        {error && (
          <div className="bg-danger-glow/10 border border-danger-glow/30 text-danger-glow px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Họ và tên</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="input-field" required placeholder="Nguyen Van A" />
          </div>
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Tên đăng nhập</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" required placeholder="username" />
          </div>
          <div>
            <label className="block text-on-surface-variant text-label-md mb-2">Mật khẩu</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required placeholder="Tối thiểu 6 ký tự" />
          </div>

          <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 mt-2" disabled={loading}>
            {loading ? (
              <><span className="material-symbols-outlined animate-spin">progress_activity</span> Đang đăng ký...</>
            ) : (
              <><span className="material-symbols-outlined">person_add</span> Đăng ký</>
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-body-md text-on-surface-variant">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;