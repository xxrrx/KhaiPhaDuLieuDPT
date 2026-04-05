import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import ProductCard from './ProductCard';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function SimilarProducts({ productId, onAddToWardrobe }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    productService.getSimilarProducts(productId)
      .then((data) => setProducts(data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <LoadingSpinner className="py-8" />;
  if (!products.length) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Sản phẩm tương tự</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 5).map((p) => (
          <ProductCard key={p.id} product={p} onAddToWardrobe={onAddToWardrobe} />
        ))}
      </div>
    </div>
  );
}
