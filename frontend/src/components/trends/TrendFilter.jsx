import React from 'react';

const CATEGORIES = [
  { value: null, label: 'Tất cả' },
  { value: 'style', label: 'Phong cách' },
  { value: 'color', label: 'Màu sắc' },
  { value: 'item', label: 'Trang phục' },
];

export default function TrendFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={String(cat.value)}
          onClick={() => onChange(cat.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === cat.value ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
