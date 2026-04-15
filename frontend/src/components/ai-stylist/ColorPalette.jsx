import React from 'react';
import { COLOR_SEASON_LABELS } from '../../utils/constants';

export default function ColorPalette({ palettes = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {palettes.map((palette) => (
        <div
          key={palette.season}
          className={`rounded-xl p-4 border transition-all ${
            palette.isRecommended
              ? 'bg-zinc-800 border-rose-500/60 ring-1 ring-rose-500/30'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              {COLOR_SEASON_LABELS[palette.season] || palette.season}
            </h3>
            {palette.isRecommended && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">
                Phù hợp với bạn
              </span>
            )}
          </div>
          {palette.season_description && (
            <p className="text-xs text-zinc-500 mb-2">{palette.season_description}</p>
          )}
          <div className="flex gap-2">
            {(palette.colors || []).map((color, i) => (
              <div
                key={i}
                className="flex-1 h-10 rounded-lg shadow-inner border border-zinc-700 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            {(palette.colors || []).map((color, i) => (
              <span key={i} className="flex-1 text-center text-xs text-zinc-600 truncate">{color}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
