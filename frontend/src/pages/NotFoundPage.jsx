import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-black text-rose-500 opacity-30 mb-4">404</div>
      <h1 className="text-3xl font-bold text-white mb-2">Trang không tồn tại</h1>
      <p className="text-zinc-500 mb-8">Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/">
        <Button>
          <Home size={16} />
          Về trang chủ
        </Button>
      </Link>
    </div>
  );
}
