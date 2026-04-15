import React from 'react';
import { TrendingUp, TrendingDown, Globe, Calendar } from 'lucide-react';

export default function StyleTrendCard({ trend, rank }) {
  const score = trend.score ?? 0;
  const changePct = trend.change_pct ?? 0;
  const isUp = changePct >= 0;

  // Score color
  const scoreColor =
    score >= 85 ? '#10b981' :
    score >= 70 ? '#f59e0b' :
    '#6366f1';

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-all duration-200 overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-1" style={{ backgroundColor: scoreColor }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3">
            {/* Rank badge */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: scoreColor + '22', color: scoreColor }}
            >
              #{rank}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm leading-tight">
                {trend.name || trend.name_vn}
              </h3>
              {trend.category && (
                <span className="text-xs text-zinc-500 capitalize mt-0.5 block">
                  {trend.category === 'style' ? 'Phong cách' : trend.category === 'item' ? 'Trang phục' : trend.category}
                </span>
              )}
            </div>
          </div>

          {/* Change badge */}
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {changePct !== 0 ? `${Math.abs(changePct).toFixed(1)}%` : '—'}
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Độ phổ biến</span>
            <span className="font-medium" style={{ color: scoreColor }}>{score.toFixed(0)}/100</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(score, 100)}%`, backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          {trend.region && (
            <span className="flex items-center gap-1">
              <Globe size={10} />
              {trend.region}
            </span>
          )}
          {trend.season && trend.year && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {trend.season} {trend.year}
            </span>
          )}
        </div>

        {/* Source tag */}
        {trend.data_source && (
          <div className="mt-2">
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
              {trend.data_source}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
