/**
 * WarpTest.jsx — Sprint 1.3 + Bước 5 test component
 * Test tất cả 4 loại quần áo: top, bottom, skirt, jacket
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebcam } from '../../hooks/useWebcam';
import { usePose, POSE_LANDMARKS } from '../../hooks/usePose';
import {
  drawClothing,
  smoothRect,
  CLOTHING_TYPES,
  computeClothingRectByType,
  checkLandmarkVisibility,
} from '../../utils/clothingWarper';

// Ảnh test cho từng loại
const TEST_IMAGES = {
  [CLOTHING_TYPES.TOP]:    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
  [CLOTHING_TYPES.BOTTOM]: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
  [CLOTHING_TYPES.SKIRT]:  'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80',
  [CLOTHING_TYPES.JACKET]: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
};

const TYPE_LABELS = {
  [CLOTHING_TYPES.TOP]:    'Áo (Top)',
  [CLOTHING_TYPES.BOTTOM]: 'Quần (Bottom)',
  [CLOTHING_TYPES.SKIRT]:  'Váy (Skirt)',
  [CLOTHING_TYPES.JACKET]: 'Áo khoác (Jacket)',
};

const LANDMARK_HINTS = {
  [CLOTHING_TYPES.TOP]:    'Cần thấy: vai (11,12) + hông (23,24)',
  [CLOTHING_TYPES.BOTTOM]: 'Cần thấy: hông (23,24) + mắt cá (27,28) — đứng lùi xa camera',
  [CLOTHING_TYPES.SKIRT]:  'Cần thấy: hông (23,24) + mắt cá (27,28) — đứng lùi xa camera',
  [CLOTHING_TYPES.JACKET]: 'Cần thấy: vai (11,12) + hông (23,24) — đứng xa hơn một chút',
};

export default function WarpTest() {
  const { videoRef, isActive, error: camError, startWebcam, stopWebcam } = useWebcam();
  const { detect, landmarks, confidence, isReady, error: poseError, status } = usePose();

  const canvasRef       = useRef(null);
  const animRef         = useRef(null);
  const imagesRef       = useRef({});       // cache ảnh đã load
  const smoothedRectRef = useRef(null);
  const fpsRef          = useRef({ frames: 0, last: Date.now() });

  const [clothingType, setClothingType] = useState(CLOTHING_TYPES.TOP);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [opacity, setOpacity] = useState(0.85);
  const [fps, setFps] = useState(0);
  const [loadedTypes, setLoadedTypes] = useState({});

  // Preload tất cả ảnh lúc mount
  useEffect(() => {
    Object.entries(TEST_IMAGES).forEach(([type, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        imagesRef.current[type] = img;
        setLoadedTypes(prev => ({ ...prev, [type]: true }));
      };
    });
  }, []);

  // Reset smoothed rect khi đổi loại
  useEffect(() => { smoothedRectRef.current = null; }, [clothingType]);

  const drawFrame = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;
    if (video.readyState < 2) { animRef.current = requestAnimationFrame(drawFrame); return; }

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 1. Vẽ video (mirror)
    ctx.save();
    ctx.translate(w, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    // 2. Detect pose
    if (isReady) await detect(video);

    // 3. Warp quần áo theo type
    const img = imagesRef.current[clothingType];
    if (img && landmarks) {
      const raw = computeClothingRectByType(clothingType, landmarks, w, h);
      if (raw) {
        smoothedRectRef.current = smoothRect(smoothedRectRef.current, raw, 0.25);
        drawClothing(ctx, img, smoothedRectRef.current, opacity);
      }
    }

    // 4. Vẽ landmarks debug
    if (showLandmarks && landmarks) {
      const keysByType = {
        [CLOTHING_TYPES.TOP]:    [11, 12, 23, 24],
        [CLOTHING_TYPES.JACKET]: [11, 12, 23, 24],
        [CLOTHING_TYPES.BOTTOM]: [23, 24, 25, 26, 27, 28],
        [CLOTHING_TYPES.SKIRT]:  [23, 24, 25, 26, 27, 28],
      };
      const activeKeys = new Set(keysByType[clothingType] || []);

      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if (!lm || (lm.visibility || 0) < 0.3) continue;
        const x = (1 - lm.x) * w; const y = lm.y * h;
        ctx.beginPath();
        ctx.arc(x, y, activeKeys.has(i) ? 7 : 3, 0, Math.PI * 2);
        ctx.fillStyle = activeKeys.has(i) ? '#00ff88' : 'rgba(255,68,68,0.5)';
        ctx.fill();
        if (activeKeys.has(i)) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(i, x + 9, y + 4);
        }
      }
    }

    // FPS
    fpsRef.current.frames++;
    const now = Date.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(fpsRef.current.frames);
      fpsRef.current = { frames: 0, last: now };
    }

    animRef.current = requestAnimationFrame(drawFrame);
  }, [isActive, isReady, detect, landmarks, clothingType, opacity, showLandmarks]);

  useEffect(() => {
    if (isActive) animRef.current = requestAnimationFrame(drawFrame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isActive, drawFrame]);

  const visCheck = checkLandmarkVisibility(clothingType, landmarks);
  const confPct  = Math.round(confidence * 100);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
        <p className="text-sm font-semibold text-zinc-300">Bước 5 — Clothing Type Test</p>
        <p className="text-xs text-zinc-500 mt-0.5">Test 4 loại quần áo với landmarks tương ứng</p>
      </div>

      {/* Clothing type selector */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(CLOTHING_TYPES).map(type => (
          <button
            key={type}
            onClick={() => setClothingType(type)}
            className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-between gap-2 ${
              clothingType === type
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50'
            }`}
          >
            <span>{TYPE_LABELS[type]}</span>
            <span className={`w-2 h-2 rounded-full ${loadedTypes[type] ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>
        ))}
      </div>

      {/* Hint cho loại đang chọn */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-300">
        💡 {LANDMARK_HINTS[clothingType]}
      </div>

      {/* Canvas */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Status badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {status === 'ready' ? `Pose ON • ${fps} FPS` : status === 'error' ? '❌ Lỗi model' : '⏳ Đang tải model...'}
              </span>
              {status === 'ready' && (
                <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                  confPct >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  confPct > 0   ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-zinc-700/50 text-zinc-500 border-zinc-600'
                }`}>
                  Conf: {confPct}%
                </span>
              )}
            </div>

            {/* Landmark visibility warning */}
            {landmarks && !visCheck.ok && (
              <div className="absolute top-3 right-3 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 max-w-[160px]">
                ⚠️ Không thấy điểm: {visCheck.missing.join(', ')}
              </div>
            )}
            {landmarks && visCheck.ok && (
              <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs text-emerald-400">
                ✅ Landmarks OK
              </div>
            )}

            {/* Checklist */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
              <p className={loadedTypes[clothingType] ? 'text-emerald-400' : 'text-zinc-500'}>
                {loadedTypes[clothingType] ? '✅' : '⬜'} Ảnh loaded
              </p>
              <p className={visCheck.ok ? 'text-emerald-400' : 'text-zinc-500'}>
                {visCheck.ok ? '✅' : '⬜'} Landmarks đủ
              </p>
              <p className={fps >= 20 ? 'text-emerald-400' : fps > 0 ? 'text-amber-400' : 'text-zinc-500'}>
                {fps >= 20 ? '✅' : '⚠️'} FPS {fps}
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
            {camError || 'Nhấn "Bật Camera" để bắt đầu test'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={isActive ? stopWebcam : startWebcam}
          className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
          }`}
        >
          {isActive ? 'Tắt Camera' : 'Bật Camera'}
        </button>
        <button
          onClick={() => setShowLandmarks(v => !v)}
          className="py-2.5 rounded-xl text-sm font-medium bg-zinc-700/50 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 transition-colors"
        >
          {showLandmarks ? 'Ẩn Landmarks' : 'Hiện Landmarks'}
        </button>
      </div>

      {/* Opacity */}
      <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 space-y-2">
        <p className="text-xs text-zinc-400">Opacity: {Math.round(opacity * 100)}%</p>
        <input type="range" min="20" max="100" value={Math.round(opacity * 100)}
          onChange={e => setOpacity(e.target.value / 100)}
          className="w-full accent-violet-500" />
      </div>

      {(camError || poseError) && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          ⚠️ {camError || poseError}
        </p>
      )}

      {/* Checklist per type */}
      <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/30 text-xs space-y-2 text-zinc-400">
        <p className="font-semibold text-zinc-300">Checklist — {TYPE_LABELS[clothingType]}</p>
        {clothingType === CLOTHING_TYPES.TOP && <>
          <p>✓ Quần áo phủ đúng vùng vai → hông</p>
          <p>✓ Không tràn quá đầu hoặc xuống đùi</p>
          <p>✓ Kích thước thay đổi khi tiến/lùi</p>
        </>}
        {clothingType === CLOTHING_TYPES.BOTTOM && <>
          <p>✓ Quần phủ đúng vùng hông → mắt cá chân</p>
          <p>✓ Cần đứng xa để camera thấy toàn thân</p>
          <p>✓ Fallback về đầu gối khi mắt cá khuất</p>
        </>}
        {clothingType === CLOTHING_TYPES.SKIRT && <>
          <p>✓ Váy phủ hông → mắt cá, rộng hơn quần</p>
          <p>✓ Cần đứng xa để camera thấy toàn thân</p>
          <p>✓ Bottom của váy rộng hơn top ~40%</p>
        </>}
        {clothingType === CLOTHING_TYPES.JACKET && <>
          <p>✓ Áo khoác rộng hơn áo thường ~25%</p>
          <p>✓ Phủ đúng vai + thân + hông</p>
          <p>✓ Hai bên rộng ra so với vai thật</p>
        </>}
      </div>
    </div>
  );
}
