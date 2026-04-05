import React from 'react';
import WardrobeItemCard from './WardrobeItemCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BookOpen } from 'lucide-react';

export default function WardrobeGrid({ items, loading, onRemove }) {
  if (loading) return <LoadingSpinner className="py-16" />;
  if (!items || !items.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
      <BookOpen size={40} className="mb-3 opacity-50" />
      <p>Tủ đồ trống</p>
      <p className="text-sm mt-1">Thêm sản phẩm yêu thích vào tủ đồ của bạn</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <WardrobeItemCard key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}
