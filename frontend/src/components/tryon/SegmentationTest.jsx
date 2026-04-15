/**
 * SegmentationTest.jsx — Sprint 1.1 test component
 * Mục đích: kiểm tra Selfie Segmentation hoạt động đúng trước khi tích hợp
 * Xóa file này sau khi Sprint 1.1 pass
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebcam } from '../../hooks/useWebcam';
import { useSelfieSegmentation } from '../../hooks/useSelfieSegmentation';

const MASK_COLORS = [
  { label: 'Xanh lá', r: 0, g: 255, b: 0 },
  { label: 'Đỏ', r: 255, g: 0, b: 0 },
  { label: 'Xanh dương', r: 0, g: 120, b: 255 },
  { label: 'Vàng', r: 255, g: 220, b: 0 },
];

export default function SegmentationTest() {
  const { videoRef, isActive, error: camError, startWebcam, stopWebcam } = useWebcam();
  const { segment, isReady, error: segError, status } = useSelfieSegmentation();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [opacity, setOpacity] = useState(0.5);
  const [showMaskOnly, setShowMaskOnly] = useState(false);
  const fpsRef = useRef({ frames: 0, last: Date.now() });

  const color = MASK_COLORS[colorIdx];

  const drawFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;
    if (video.readyState < 2) {
      animRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // 1. Vẽ video (mirror như selfie)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    if (showMaskOnly) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // 2. Lấy segmentation mask và vẽ overlay màu
    if (isReady) {
      const maskCanvas = await segment(video);

      if (maskCanvas && maskCanvas.width > 0) {
        // Tạo overlay: fill màu chọn rồi clip theo mask (mirror mask để khớp video)
        const flippedMask = document.createElement('canvas');
        flippedMask.width = canvas.width;
        flippedMask.height = canvas.height;
        const fmCtx = flippedMask.getContext('2d');
        fmCtx.save();
        fmCtx.translate(canvas.width, 0);
        fmCtx.scale(-1, 1);
        fmCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
        fmCtx.restore();

        const overlay = document.createElement('canvas');
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        const ovCtx = overlay.getContext('2d');

        // Fill màu toàn bộ
        ovCtx.fillStyle = `rgba(${color.r},${color.g},${color.b},${opacity})`;
        ovCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Giữ lại chỉ vùng có người (dùng mask đã flip làm alpha)
        ovCtx.globalCompositeOperation = 'destination-in';
        ovCtx.drawImage(flippedMask, 0, 0);

        ctx.drawImage(overlay, 0, 0);
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
  }, [isActive, isReady, segment, color, opacity, showMaskOnly]);

  useEffect(() => {
    if (isActive) {
      animRef.current = requestAnimationFrame(drawFrame);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isActive, drawFrame]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
        <p className="text-sm font-semibold text-zinc-300">Sprint 1.1 — Selfie Segmentation Test</p>
        <p className="text-xs text-zinc-500 mt-0.5">Vùng người được highlight màu → segmentation đang hoạt động</p>
      </div>

      {/* Canvas */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Status badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {status === 'ready' ? `Segmentation ON • ${fps} FPS` :
                 status === 'error' ? '❌ Lỗi model' :
                 status === 'loading' ? '⏳ Đang tải model (~2.5MB)...' : '⏳ Khởi động...'}
              </span>
            </div>

            {/* Checklist overlay */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
              <p className={fps > 0 ? 'text-emerald-400' : 'text-zinc-500'}>
                {fps > 0 ? '✅' : '⬜'} Webcam bật
              </p>
              <p className={isReady ? 'text-emerald-400' : 'text-zinc-500'}>
                {isReady ? '✅' : '⬜'} Model loaded
              </p>
              <p className={fps >= 15 ? 'text-emerald-400' : fps > 0 ? 'text-amber-400' : 'text-zinc-500'}>
                {fps >= 15 ? '✅' : '⚠️'} FPS {'>='} 15 (hiện tại: {fps})
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
          className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'}`}
        >
          {isActive ? 'Tắt Camera' : 'Bật Camera'}
        </button>

        <button
          onClick={() => setShowMaskOnly(v => !v)}
          className="py-2.5 rounded-xl text-sm font-medium bg-zinc-700/50 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 transition-colors"
        >
          {showMaskOnly ? 'Hiện Video' : 'Chỉ Mask'}
        </button>
      </div>

      {/* Color picker */}
      <div className="bg-zinc-800/50 rounded-xl p-3 space-y-3 border border-zinc-700/50">
        <p className="text-xs text-zinc-400 font-medium">Màu highlight</p>
        <div className="flex gap-2">
          {MASK_COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => setColorIdx(i)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${colorIdx === i ? 'border-white scale-105' : 'border-transparent opacity-60'}`}
              style={{ background: `rgb(${c.r},${c.g},${c.b})`, color: c.r + c.g + c.b > 400 ? '#000' : '#fff' }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-zinc-400">Độ trong suốt: {Math.round(opacity * 100)}%</p>
          <input
            type="range" min="10" max="100" value={Math.round(opacity * 100)}
            onChange={e => setOpacity(e.target.value / 100)}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Errors */}
      {(camError || segError) && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          ⚠️ {camError || segError}
        </p>
      )}

      {/* Test checklist */}
      <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/30 text-xs space-y-1.5 text-zinc-400">
        <p className="font-semibold text-zinc-300">Test pass khi:</p>
        <p>1. Vùng người được highlight đúng (không bị tràn ra bàn ghế)</p>
        <p>2. FPS {'>='} 15 ổn định</p>
        <p>3. Mask không nhấp nháy khi đứng yên</p>
        <p>4. Chế độ "Chỉ Mask" hiển thị đúng vùng cơ thể</p>
      </div>
    </div>
  );
}
