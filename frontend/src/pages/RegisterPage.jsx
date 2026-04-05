import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { validateEmail, validatePassword, validateUsername } from '../utils/validators';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    const e = {};
    const usernameErr = validateUsername(form.username);
    if (usernameErr) e.username = usernameErr;
    if (!form.email || !validateEmail(form.email)) e.email = 'Email không hợp lệ';
    const passErr = validatePassword(form.password);
    if (passErr) e.password = passErr;
    if (!form.full_name.trim()) e.full_name = 'Nhập họ và tên';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authService.register(form);
      if (data.access_token) {
        const me = await authService.getMe();
        login(me.data || me, data.access_token);
        toast.success('Đăng ký thành công!');
        navigate('/');
      } else {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500 mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản SmartFit</h1>
          <p className="text-zinc-500 text-sm mt-1">Miễn phí, không cần thẻ tín dụng</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <Input
            label="Họ và tên"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="Nguyễn Văn A"
            error={errors.full_name}
            autoFocus
          />
          <Input
            label="Tên đăng nhập"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="username"
            error={errors.username}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="email@example.com"
            error={errors.email}
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            error={errors.password}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Đăng ký
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-rose-400 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
