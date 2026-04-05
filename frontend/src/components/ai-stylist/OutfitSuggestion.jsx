import React from 'react';
import { ShoppingBag } from 'lucide-react';
import ProductCard from '../product/ProductCard';

export default function OutfitSuggestion({ outfits = [], products = [] }) {
  return (
    <div className="space-y-6">
      {outfits.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3">Gợi ý outfit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {outfits.map((outfit, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h4 className="text-sm font-semibold text-white">{outfit.name}</h4>
                <div className="flex gap-2 mt-3">
                  {(outfit.colors || []).map((color, ci) => (
                    <div
                      key={ci}
                      className="w-6 h-6 rounded-full border border-zinc-700"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(outfit.items || []).map((item, ii) => (
                    <span key={ii} className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingBag size={16} className="text-rose-400" />
            Sản phẩm phù hợp
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
