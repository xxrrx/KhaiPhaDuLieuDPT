import React from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatters';

export default function WardrobeItemCard({ item, onRemove }) {
  const p = item?.product;
  if (!p) return null;
  return (
    <div className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all">
      <div className="relative aspect-[3/4] bg-zinc-800">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">👗</div>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
        >
          <Trash2 size={13} />
        </button>
        <div
          className="absolute bottom-2 left-2 w-4 h-4 rounded-full border border-zinc-600"
          style={{ backgroundColor: p.color_hex || '#888' }}
          title={p.primary_color}
        />
      </div>
      <div className="p-2.5">
        <Link to={`/products/${p.id}`} className="text-xs font-medium text-white hover:text-rose-400 transition-colors line-clamp-2">{p.name}</Link>
        <p className="text-xs text-rose-400 font-medium mt-0.5">{formatPrice(p.price)}</p>
      </div>
    </div>
  );
}
