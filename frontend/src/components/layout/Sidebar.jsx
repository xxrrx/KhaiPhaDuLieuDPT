import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sparkles, Users, TrendingUp, BookOpen, Camera, Home } from 'lucide-react';

const links = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/products', label: 'Sản phẩm', icon: ShoppingBag },
  { to: '/tryon', label: 'Thử đồ AR', icon: Camera },
  { to: '/ai-stylist', label: 'AI Stylist', icon: Sparkles },
  { to: '/wardrobe', label: 'Tủ đồ', icon: BookOpen },
  { to: '/trends', label: 'Xu hướng', icon: TrendingUp },
  { to: '/social', label: 'Cộng đồng', icon: Users },
];

export default function Sidebar({ className = '' }) {
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside className={`w-56 flex-shrink-0 ${className}`}>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(to)
                ? 'bg-zinc-800 text-rose-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
