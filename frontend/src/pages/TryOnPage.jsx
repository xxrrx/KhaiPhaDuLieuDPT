import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, History, Shirt, Search, X } from 'lucide-react';
import ARWebcamView from '../components/tryon/ARWebcamView';
import TryOnHistory from '../components/tryon/TryOnHistory';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { productService } from '../services/productService';
import useTryonStore from '../store/tryonStore';
import { CLOTHING_TYPES } from '../utils/clothingWarper';

const TABS = [
  { id: 'webcam', label: 'Webcam AR', icon: Camera },
  { id: 'history', label: 'Lịch sử', icon: History },
];

const CLOTHING_TYPE_OPTIONS = [
  { value: CLOTHING_TYPES.TOP,    label: 'Áo' },
  { value: CLOTHING_TYPES.BOTTOM, label: 'Quần' },
  { value: CLOTHING_TYPES.DRESS,  label: 'Váy' },
  { value: CLOTHING_TYPES.JACKET, label: 'Áo khoác' },
];

function ProductSearchPicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    productService.getProducts({ limit: 12, sort: 'popular' })
      .then((res) => setPopular(res.data?.items || []));
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await productService.getProducts({ search: q, limit: 10 });
        setResults(res.data?.items || []);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    search(e.target.value);
    setOpen(true);
  };

  const displayList = query.trim() ? results : popular;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Tìm kiếm sản phẩm để thử đồ..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 px-2">
              {query.trim() ? `Kết quả cho "${query}"` : 'Sản phẩm phổ biến'}
            </p>
          </div>
          {loading ? (
            <div className="py-6 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : displayList.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6">Không tìm thấy sản phẩm</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {displayList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Shirt size={18} className="text-zinc-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.brand}</p>
                  </div>
                  {p.price && (
                    <span className="text-xs text-rose-400 flex-shrink-0">
                      {Number(p.price).toLocaleString('vi-VN')}₫
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('product_id');
  const [activeTab, setActiveTab] = useState('webcam');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [clothingType, setClothingType] = useState(CLOTHING_TYPES.TOP);
  const [productLoading, setProductLoading] = useState(false);
  const { setCurrentResult } = useTryonStore();

  useEffect(() => {
    if (productIdFromUrl) {
      setProductLoading(true);
      productService.getProduct(productIdFromUrl)
        .then((res) => { if (res.success) setSelectedProduct(res.data); })
        .finally(() => setProductLoading(false));
    }
  }, [productIdFromUrl]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Thử đồ ảo</h1>
        <p className="text-zinc-400 mt-1">Tìm kiếm sản phẩm và thử trang phục theo thời gian thực</p>
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
          <div className="lg:col-span-2 space-y-4">
            {/* Product search / selected */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
              {selectedProduct ? (
                <div className="flex items-center gap-3">
                  {selectedProduct.image_url && (
                    <img src={selectedProduct.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedProduct.name}</p>
                    <p className="text-xs text-zinc-500">{selectedProduct.brand}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-400 transition-colors border border-zinc-700 hover:border-rose-500/40 rounded-lg px-2.5 py-1.5"
                  >
                    <X size={12} /> Đổi
                  </button>
                </div>
              ) : (
                <p className="text-sm font-medium text-zinc-300">Chọn sản phẩm để thử đồ</p>
              )}

              {/* Clothing type selector */}
              <div className="flex gap-2">
                <span className="text-xs text-zinc-500 self-center mr-1">Loại:</span>
                {CLOTHING_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setClothingType(value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      clothingType === value
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : 'bg-zinc-700/30 text-zinc-400 border-zinc-600/50 hover:bg-zinc-700/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {!selectedProduct && (
                <ProductSearchPicker onSelect={setSelectedProduct} />
              )}
            </div>

            {productLoading ? (
              <LoadingSpinner className="py-8" />
            ) : (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-base font-semibold text-white mb-4">Webcam AR</h2>
                <ARWebcamView
                  product={selectedProduct}
                  clothingType={clothingType}
                />
              </div>
            )}
          </div>

          {/* Sidebar: search to pick another */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400">Tìm sản phẩm khác</h3>
            <ProductSearchPicker onSelect={setSelectedProduct} />
            {selectedProduct && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3">
                <p className="text-xs text-zinc-500 mb-2">Đang thử:</p>
                <div className="flex items-center gap-2">
                  {selectedProduct.image_url && (
                    <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{selectedProduct.name}</p>
                    <p className="text-xs text-zinc-500">{selectedProduct.brand}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
