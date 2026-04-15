import React from 'react';
import { COLOR_SEASON_LABELS } from '../../utils/constants';

export default function SkinToneResult({ skinTone }) {
  if (!skinTone) return null;
  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Tông da</h3>
      <div className="flex items-start gap-4">
        <div className="text-4xl font-bold text-rose-400">F{skinTone.fitzpatrick_level}</div>
        <div className="flex-1">
          <p className="text-white font-medium">{skinTone.description}</p>
          <p className="text-zinc-400 text-sm mt-0.5">
            Màu sắc phù hợp: <span className="text-rose-300 font-medium">{COLOR_SEASON_LABELS[skinTone.color_season] || skinTone.color_season}</span>
          </p>
          {skinTone.season_description && (
            <p className="text-zinc-500 text-xs mt-1">{skinTone.season_description}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-zinc-500 mb-2">Màu gợi ý</p>
        <div className="flex gap-2 flex-wrap">
          {(skinTone.recommended_colors || []).map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full border-2 border-zinc-700 shadow-md"
                style={{ backgroundColor: color }}
                title={color}
              />
              <span className="text-xs text-zinc-600">{color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
