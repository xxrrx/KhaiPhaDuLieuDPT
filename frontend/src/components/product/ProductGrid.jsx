import React from 'react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProductGrid({ products, loading, onAddToWardrobe }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <p className="text-lg">Không tìm thấy sản phẩm</p>
        <p className="text-sm mt-1">Thử thay đổi bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToWardrobe={onAddToWardrobe}
        />
      ))}
    </div>
  );
}
