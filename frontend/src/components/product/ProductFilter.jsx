import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { GENDER_OPTIONS, STYLE_OPTIONS, SORT_OPTIONS } from '../../utils/constants';

export default function ProductFilter({ filters, onChange, categories = [] }) {
  const update = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <SlidersHorizontal size={15} /> Bộ lọc
      </h3>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-2 block">Sắp xếp</label>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => update('sort', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label className="text-xs text-zinc-500 font-medium mb-2 block">Danh mục</label>
          <div className="space-y-1">
            <button
              onClick={() => update('category_id', null)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${!filters.category_id ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => update('category_id', cat.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${filters.category_id === cat.id ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gender */}
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-2 block">Giới tính</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update('gender', null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filters.gender ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Tất cả
          </button>
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g.value}
              onClick={() => update('gender', g.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.gender === g.value ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-2 block">Phong cách</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => update('style', filters.style === s.value ? null : s.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.style === s.value ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-2 block">Khoảng giá (VND)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Từ"
            value={filters.min_price || ''}
            onChange={(e) => update('min_price', e.target.value || null)}
            className="w-1/2 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <input
            type="number"
            placeholder="Đến"
            value={filters.max_price || ''}
            onChange={(e) => update('max_price', e.target.value || null)}
            className="w-1/2 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={() => onChange({ page: 1, limit: 20, sort: 'newest' })}
        className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
