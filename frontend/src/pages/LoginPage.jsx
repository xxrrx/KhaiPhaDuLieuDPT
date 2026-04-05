import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Nhập tên đăng nhập';
    if (!password) e.password = 'Nhập mật khẩu';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      const tokenData = data.data || data;
      if (tokenData.access_token) {
        login(tokenData.user, tokenData.access_token);
        toast.success('Đăng nhập thành công!');
        navigate('/');
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500 mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng nhập SmartFit</h1>
          <p className="text-zinc-500 text-sm mt-1">Chào mừng trở lại!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <Input
            label="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            error={errors.username}
            autoFocus
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Đăng nhập
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-rose-400 hover:underline font-medium">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
