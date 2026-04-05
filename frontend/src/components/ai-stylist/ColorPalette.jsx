import React from 'react';
import { COLOR_SEASON_LABELS } from '../../utils/constants';

export default function ColorPalette({ palettes = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {palettes.map((palette) => (
        <div key={palette.season} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-sm font-semibold text-white mb-3">
            {COLOR_SEASON_LABELS[palette.season] || palette.season}
          </h3>
          <div className="flex gap-2">
            {(palette.colors || []).map((color, i) => (
              <div
                key={i}
                className="flex-1 h-10 rounded-lg shadow-inner border border-zinc-700"
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
