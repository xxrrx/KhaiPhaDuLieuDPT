import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StyleTrendCard({ style, score, change, rank }) {
  const isUp = change && !change.startsWith('-');
  const changeNum = change ? parseFloat(change.replace('%', '').replace('+', '')) : null;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          {rank && <span className="text-xs text-zinc-600 font-medium">#{rank}</span>}
          <h3 className="font-semibold text-white capitalize mt-0.5">{style}</h3>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Độ phổ biến</span>
          <span>{score?.toFixed(1)}</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(score || 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
