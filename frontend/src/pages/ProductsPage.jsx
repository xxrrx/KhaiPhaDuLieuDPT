import React, { useState, useEffect } from 'react';
import ProductFilter from '../components/product/ProductFilter';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/ui/Pagination';
import { productService } from '../services/productService';
import { wardrobeService } from '../services/wardrobeService';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import useAuthStore from '../store/authStore';
import { SlidersHorizontal } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ page: 1, limit: 20, sort: 'newest' });
  const [categories, setCategories] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    productService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { ...filters, search: debouncedSearch };
    productService.getProducts(params)
      .then((res) => {
        if (res.success) {
          setProducts(res.data.items);
          setTotal(res.data.pagination.total);
          setTotalPages(res.data.pagination.total_pages);
        }
      })
      .catch(() => toast.error('Không thể tải sản phẩm'))
      .finally(() => setLoading(false));
  }, [filters.page, filters.limit, filters.sort, filters.category_id, filters.gender, filters.style, filters.min_price, filters.max_price, debouncedSearch]);

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sản phẩm</h1>
          {!loading && <p className="text-sm text-zinc-500 mt-0.5">{total} sản phẩm</p>}
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm"
        >
          <SlidersHorizontal size={15} />
          Bộ lọc
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filter */}
        <div className={`lg:block flex-shrink-0 w-52 ${showFilter ? 'block' : 'hidden'} lg:block`}>
          <div className="sticky top-24">
            <ProductFilter filters={filters} onChange={setFilters} categories={categories} />
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={products} loading={loading} onAddToWardrobe={handleAddToWardrobe} />
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </div>
      </div>
    </div>
  );
}
