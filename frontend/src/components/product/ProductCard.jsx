import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

export default function ProductCard({ product, onAddToWardrobe }) {
  const navigate = useNavigate();
  if (!product) return null;
  return (
    <div className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:-translate-y-0.5">
      <div
        className="block relative aspect-[3/4] overflow-hidden bg-zinc-800 cursor-pointer"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Camera size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/tryon?product_id=${product.id}`}
            className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            title="Thử đồ"
            onClick={(e) => e.stopPropagation()}
          >
            <Camera size={14} />
          </Link>
          {onAddToWardrobe && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToWardrobe(product.id); }}
              className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              title="Thêm vào tủ đồ"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="p-3">
        <Link to={`/products/${product.id}`}>
          <p className="text-xs text-zinc-500 mb-0.5">{product.brand}</p>
          <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-rose-400 transition-colors">{product.name}</h3>
          <p className="text-rose-400 font-semibold text-sm mt-1">{formatPrice(product.price)}</p>
        </Link>
        {product.category && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">
            {product.category.name}
          </span>
        )}
      </div>
    </div>
  );
}
