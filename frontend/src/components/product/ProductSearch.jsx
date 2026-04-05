import React from 'react';
import { Search, X } from 'lucide-react';

export default function ProductSearch({ value, onChange, placeholder = 'Tìm kiếm sản phẩm...' }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => onChange('');

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
