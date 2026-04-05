import React from 'react';
import { Trash2, Edit, Download } from 'lucide-react';
import { wardrobeService } from '../../services/wardrobeService';
import { useToast } from '../../hooks/useToast';

export default function OutfitCard({ outfit, onDelete, onEdit }) {
  const toast = useToast();

  const handleExport = async () => {
    try {
      const res = await wardrobeService.exportOutfit(outfit.id);
      if (res.success) {
        window.open(res.data.export_url, '_blank');
      }
    } catch {
      toast.error('Không thể xuất outfit');
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all group">
      {/* Preview grid of items */}
      <div className="grid grid-cols-3 gap-0.5 bg-zinc-800 aspect-[3/2]">
        {(outfit.items || []).slice(0, 3).map((item, i) => (
          <div key={i} className="bg-zinc-700 overflow-hidden">
            {item.product?.image_url ? (
              <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xl">👗</div>
            )}
          </div>
        ))}
        {(outfit.items || []).length === 0 && (
          <div className="col-span-3 flex items-center justify-center text-zinc-600 text-sm">Không có trang phục</div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{outfit.name}</h3>
            {outfit.occasion && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">{outfit.occasion}</span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit?.(outfit)} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              <Edit size={13} />
            </button>
            <button onClick={handleExport} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              <Download size={13} />
            </button>
            <button onClick={() => onDelete?.(outfit.id)} className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{outfit.items?.length || 0} trang phục</p>
      </div>
    </div>
  );
}
