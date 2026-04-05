import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Camera, History } from 'lucide-react';
import TryOnUploader from '../components/tryon/TryOnUploader';
import TryOnResult from '../components/tryon/TryOnResult';
import ARWebcamView from '../components/tryon/ARWebcamView';
import TryOnHistory from '../components/tryon/TryOnHistory';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { productService } from '../services/productService';
import useTryonStore from '../store/tryonStore';

const TABS = [
  { id: 'upload', label: 'Upload ảnh', icon: Upload },
  { id: 'webcam', label: 'Webcam AR', icon: Camera },
  { id: 'history', label: 'Lịch sử', icon: History },
];

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('product_id');
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const { currentResult, setCurrentResult } = useTryonStore();

  useEffect(() => {
    if (productIdFromUrl) {
      setProductLoading(true);
      productService.getProduct(productIdFromUrl)
        .then((res) => { if (res.success) setSelectedProduct(res.data); })
        .finally(() => setProductLoading(false));
    }
    productService.getProducts({ limit: 8, sort: 'popular' })
      .then((res) => setRecentProducts(res.data?.items || []));
  }, [productIdFromUrl]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Thử đồ ảo</h1>
        <p className="text-zinc-400 mt-1">Upload ảnh hoặc dùng webcam để thử trang phục</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setCurrentResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <TryOnHistory />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product selection */}
            {!selectedProduct && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <p className="text-sm font-medium text-zinc-300 mb-3">Chọn sản phẩm để thử đồ</p>
                {recentProducts.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {recentProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="flex-shrink-0 w-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-rose-500 transition-colors"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center text-2xl">👗</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-sm">Không có sản phẩm</p>
                )}
              </div>
            )}

            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-700">
                {selectedProduct.image_url && (
                  <img src={selectedProduct.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedProduct.name}</p>
                  <p className="text-xs text-zinc-500">{selectedProduct.brand}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-zinc-600 hover:text-zinc-400 text-sm">Đổi</button>
              </div>
            )}

            {productLoading ? (
              <LoadingSpinner className="py-8" />
            ) : activeTab === 'upload' ? (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-base font-semibold text-white mb-4">Upload ảnh của bạn</h2>
                <TryOnUploader
                  productId={selectedProduct?.id}
                  onResult={(data) => {}}
                />
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-base font-semibold text-white mb-4">Webcam AR</h2>
                <ARWebcamView product={selectedProduct} />
              </div>
            )}

            {currentResult && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-base font-semibold text-white mb-4">Kết quả</h2>
                <TryOnResult result={currentResult} />
              </div>
            )}
          </div>

          {/* Sidebar product picker */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400">Sản phẩm gợi ý</h3>
            <div className="grid grid-cols-2 gap-3">
              {recentProducts.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToWardrobe={null}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
