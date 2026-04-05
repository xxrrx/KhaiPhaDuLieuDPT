import React from 'react';
import { BODY_SHAPE_LABELS } from '../../utils/constants';

const BODY_SHAPE_TIPS = {
  hourglass: ['Váy ôm sát', 'Áo crop top', 'Belt để nhấn eo', 'Quần skinny'],
  pear: ['Áo có chi tiết vai nổi bật', 'Màu sáng ở trên', 'Quần A-line', 'Áo khoác oversized'],
  apple: ['Áo V-neck', 'Empire waist', 'Chất liệu chảy mềm', 'Quần wide-leg'],
  rectangle: ['Tạo đường cong với belt', 'Áo ruffled', 'Chân váy peplum', 'Quần boyfriend'],
  inverted_triangle: ['Quần wide-leg', 'Màu đậm ở trên', 'Chân váy fullskirt', 'Áo V-neck'],
};

export default function BodyShapeResult({ bodyShape }) {
  if (!bodyShape) return null;
  const tips = BODY_SHAPE_TIPS[bodyShape.shape] || [];

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Vóc dáng</h3>
      <div className="mb-4">
        <p className="text-2xl font-bold text-white">{BODY_SHAPE_LABELS[bodyShape.shape] || bodyShape.shape}</p>
        <p className="text-zinc-400 text-sm mt-1">{bodyShape.description}</p>
      </div>
      {tips.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Gợi ý mặc đẹp</p>
          <div className="flex flex-wrap gap-2">
            {tips.map((tip, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">{tip}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
