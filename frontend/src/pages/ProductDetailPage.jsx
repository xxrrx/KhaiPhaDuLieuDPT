import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Plus, ArrowLeft, Package } from 'lucide-react';
import Button from '../components/ui/Button';
import SimilarProducts from '../components/product/SimilarProducts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { productService } from '../services/productService';
import { wardrobeService } from '../services/wardrobeService';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/formatters';
import useAuthStore from '../store/authStore';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToWardrobe, setAddingToWardrobe] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    productService.getProduct(id)
      .then((res) => {
        if (res.success) setProduct(res.data);
      })
      .catch(() => toast.error('Không thể tải sản phẩm'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToWardrobe = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return; }
    setAddingToWardrobe(true);
    try {
      await wardrobeService.addToWardrobe(product.id);
      toast.success('Đã thêm vào tủ đồ!');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Không thể thêm');
    } finally {
      setAddingToWardrobe(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-500">
      <Package size={40} className="mx-auto mb-3" />
      <p>Không tìm thấy sản phẩm</p>
      <Link to="/products" className="text-rose-400 hover:underline text-sm mt-2 inline-block">Quay lại</Link>
    </div>
  );

  const images = product.image_urls?.length ? product.image_urls : [product.image_url].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Quay lại
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600"><Camera size={48} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-rose-500' : 'border-zinc-700'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">{product.brand}</p>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            {product.category && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs">{product.category.name}</span>
            )}
          </div>

          <div className="text-3xl font-bold text-rose-400">{formatPrice(product.price)}</div>

          {product.description && (
            <p className="text-zinc-400 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.gender && (
              <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs mb-0.5">Giới tính</p>
                <p className="text-white capitalize">{product.gender}</p>
              </div>
            )}
            {product.style && (
              <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs mb-0.5">Phong cách</p>
                <p className="text-white capitalize">{product.style}</p>
              </div>
            )}
            {product.primary_color && (
              <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs mb-0.5">Màu sắc</p>
                <div className="flex items-center gap-2">
                  {product.color_hex && (
                    <div className="w-4 h-4 rounded-full border border-zinc-600" style={{ backgroundColor: product.color_hex }} />
                  )}
                  <p className="text-white">{product.primary_color}</p>
                </div>
              </div>
            )}
            {product.size_options?.length > 0 && (
              <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs mb-0.5">Kích cỡ</p>
                <p className="text-white">{product.size_options.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to={`/tryon?product_id=${product.id}`} className="flex-1">
              <Button size="lg" className="w-full gap-2">
                <Camera size={18} />
                Thử đồ AR
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleAddToWardrobe}
              loading={addingToWardrobe}
              className="flex-1 gap-2"
            >
              <Plus size={18} />
              Thêm vào tủ đồ
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {product.is_available ? 'Còn hàng' : 'Hết hàng'}
          </div>
        </div>
      </div>

      {/* Similar */}
      <SimilarProducts productId={id} onAddToWardrobe={async (pid) => {
        if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); return; }
        try { await wardrobeService.addToWardrobe(pid); toast.success('Đã thêm!'); }
        catch { toast.error('Không thể thêm'); }
      }} />
    </div>
  );
}
