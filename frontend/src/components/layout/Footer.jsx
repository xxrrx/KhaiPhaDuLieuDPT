import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">SmartFit</span>
            <span className="text-zinc-500 text-sm">AR Virtual Try-On</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link to="/products" className="hover:text-zinc-300 transition-colors">Sản phẩm</Link>
            <Link to="/tryon" className="hover:text-zinc-300 transition-colors">Thử đồ</Link>
            <Link to="/trends" className="hover:text-zinc-300 transition-colors">Xu hướng</Link>
            <Link to="/social" className="hover:text-zinc-300 transition-colors">Cộng đồng</Link>
          </div>
          <p className="text-zinc-600 text-sm">© 2026 SmartFit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
