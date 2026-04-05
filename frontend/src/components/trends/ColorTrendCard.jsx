import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ColorTrendCard({ trend }) {
  const isUp = (trend.change_pct || 0) >= 0;
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all">
      <div
        className="h-20"
        style={{ backgroundColor: trend.color || '#888' }}
      />
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white">{trend.name_vn || trend.name}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{trend.name}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <div className="h-1.5 bg-zinc-800 rounded-full flex-1 w-24">
              <div
                className="h-1.5 rounded-full bg-rose-500"
                style={{ width: `${trend.score || 0}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{trend.score}</span>
          </div>
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.change_pct || 0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
