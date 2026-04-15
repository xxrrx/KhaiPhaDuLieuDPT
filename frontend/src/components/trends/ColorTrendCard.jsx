import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ColorTrendCard({ trend, rank }) {
  const [copied, setCopied] = useState(false);
  const hex = trend.color || '#888888';
  const score = trend.score ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Determine if color is light or dark for text contrast
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textOnColor = luminance > 0.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-all duration-200 overflow-hidden group">
      {/* Big color swatch */}
      <div
        className="relative h-28 flex items-end p-3 cursor-pointer"
        style={{ backgroundColor: hex }}
        onClick={handleCopy}
      >
        {/* Rank */}
        <span
          className="absolute top-2 left-3 text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: textOnColor }}
        >
          #{rank}
        </span>

        {/* Copy button */}
        <button
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={handleCopy}
        >
          {copied
            ? <Check size={12} style={{ color: textOnColor }} />
            : <Copy size={12} style={{ color: textOnColor }} />
          }
        </button>

        {/* Hex code */}
        <span
          className="text-xs font-mono font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: textOnColor }}
        >
          {hex.toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm">{trend.name_vn || trend.name}</h3>

        {/* Score bar */}
        <div className="mt-2 mb-1">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Score</span>
            <span className="text-zinc-300 font-medium">{score.toFixed(0)}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(score, 100)}%`, backgroundColor: hex }}
            />
          </div>
        </div>

        {/* Source */}
        {trend.data_source && (
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md mt-2 inline-block">
            {trend.data_source}
          </span>
        )}
      </div>
    </div>
  );
}
