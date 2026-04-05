import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, TrendingUp, BookOpen, ArrowRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import { productService } from '../services/productService';
import { wardrobeService } from '../services/wardrobeService';
import { useToast } from '../hooks/useToast';
import useAuthStore from '../store/authStore';

const FEATURES = [
  { icon: Camera, title: 'Thử đồ AR', desc: 'Thử trang phục ảo trực tiếp qua webcam hoặc upload ảnh', href: '/tryon', color: 'text-rose-400' },
  { icon: Sparkles, title: 'AI Stylist', desc: 'Phân tích tông da, vóc dáng và gợi ý trang phục phù hợp', href: '/ai-stylist', color: 'text-violet-400' },
  { icon: TrendingUp, title: 'Xu hướng', desc: 'Cập nhật xu hướng thời trang mới nhất theo thời gian thực', href: '/trends', color: 'text-emerald-400' },
  { icon: BookOpen, title: 'Tủ đồ thông minh', desc: 'Quản lý tủ đồ và tạo outfit phối hợp dễ dàng', href: '/wardrobe', color: 'text-amber-400' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    productService.getProducts({ limit: 8, sort: 'popular' })
      .then((res) => setFeatured(res.data?.items || []))
      .catch(() => {});
  }, []);

  const handleAddToWardrobe = async (productId) => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return; }
    try {
      await wardrobeService.addToWardrobe(productId);
      toast.success('Đã thêm vào tủ đồ!');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Không thể thêm');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950 py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium mb-6">
            <Star size={11} fill="currentColor" />
            AR Virtual Try-On Technology
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Mặc thử trước khi{' '}
            <span className="text-rose-400">mua thật</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            SmartFit sử dụng AI và AR để giúp bạn thử đồ ảo, nhận tư vấn phong cách cá nhân hóa và theo dõi xu hướng thời trang.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/tryon">
              <Button size="lg" className="gap-2">
                <Camera size={18} />
                Thử đồ ngay
              </Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline" className="gap-2">
                Khám phá sản phẩm
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Tính năng nổi bật</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, href, color }) => (
              <Link key={href} to={href} className="group bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-all hover:-translate-y-1">
                <Icon size={24} className={`${color} mb-3`} />
                <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-zinc-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Sản phẩm nổi bật</h2>
              <Link to="/products" className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors">
                Xem tất cả <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} onAddToWardrobe={handleAddToWardrobe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-rose-950 to-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Bắt đầu hành trình thời trang của bạn</h2>
          <p className="text-zinc-400 mb-8">Đăng ký miễn phí và khám phá trải nghiệm mua sắm thông minh với công nghệ AI.</p>
          {!isAuthenticated && (
            <Link to="/register">
              <Button size="lg">Đăng ký ngay — Miễn phí</Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
