/**
 * ARWebcamView.jsx — Bước 6 + 7 + 8 hoàn chỉnh
 *
 * Bước 7 (UX):
 * - Pose guide overlay: khung hướng dẫn đứng đúng vị trí
 * - Confidence score hiển thị trực quan
 * - Nút chỉnh thủ công: kéo để dịch chuyển quần áo
 *
 * Bước 8 (Capture & Save):
 * - Merge 3 layer: video + clothing warped + background effect
 * - Background options: normal / blur / color replace
 * - canvas.toDataURL() → lưu ảnh
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Aperture, Zap, Move, ImageDown } from 'lucide-react';
import Button from '../ui/Button';
import { useWebcam } from '../../hooks/useWebcam';
import { usePose, POSE_LANDMARKS } from '../../hooks/usePose';
import { useSelfieSegmentation } from '../../hooks/useSelfieSegmentation';
import { tryonService } from '../../services/tryonService';
import { useToast } from '../../hooks/useToast';
import useTryonStore from '../../store/tryonStore';
import {
  drawClothing,
  smoothRect,
  CLOTHING_TYPES,
  computeClothingRectByType,
} from '../../utils/clothingWarper';

const FPS_TARGET             = 20;
const FRAME_BUDGET           = 1000 / FPS_TARGET;
const LANDMARK_MOVE_THRESHOLD = 5;

// Background modes (Bước 8)
const BG_MODES = { NORMAL: 'normal', BLUR: 'blur', COLOR: 'color' };
const BG_COLORS = ['#1a1a2e', '#0d1b2a', '#1b1b1b', '#2d1b69', '#1a2e1a'];

// ─── Pose guide overlay (Bước 7) ─────────────────────────────────────────────
function drawPoseGuide(ctx, w, h, hasLandmarks) {
  if (hasLandmarks) return; // đã có người → không cần guide

  const cx = w / 2;
  const scale = Math.min(w, h) * 0.0018;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.fillStyle   = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 2;
  ctx.setLineDash([6, 4]);

  // Đầu
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.18, 28 * scale, 34 * scale, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Thân
  ctx.beginPath();
  ctx.roundRect(cx - 38 * scale, h * 0.26, 76 * scale, h * 0.3, 8);
  ctx.fill(); ctx.stroke();

  // Chân trái
  ctx.beginPath();
  ctx.roundRect(cx - 36 * scale, h * 0.57, 28 * scale, h * 0.28, 6);
  ctx.fill(); ctx.stroke();

  // Chân phải
  ctx.beginPath();
  ctx.roundRect(cx + 8 * scale, h * 0.57, 28 * scale, h * 0.28, 6);
  ctx.fill(); ctx.stroke();

  ctx.setLineDash([]);

  // Text hướng dẫn
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${Math.max(12, 14 * scale)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Đứng vào khung hình', cx, h * 0.9);
  ctx.restore();
}

// ─── Confidence bar (Bước 7) ─────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
      <span className="text-xs text-zinc-400 w-16 shrink-0">Pose</span>
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function ARWebcamView({ product, clothingType = CLOTHING_TYPES.TOP, onCapture }) {
  const { videoRef, isActive, error, startWebcam, stopWebcam } = useWebcam();
  const { detect, landmarks, confidence, isReady: poseReady, status: poseStatus } = usePose();
  const { segment, isReady: segReady } = useSelfieSegmentation();

  const overlayCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const tmpCanvasRef     = useRef(null);
  const animFrameRef     = useRef(null);
  const clothingImgRef   = useRef(null);
  const smoothedRectRef  = useRef(null);
  const prevLandmarksRef = useRef(null);
  const frameCountRef    = useRef(0);
  const maskCacheRef     = useRef(null);
  const frameTimeRef     = useRef({ duration: 0 });
  const poseSkipRef      = useRef(1);
  const segSkipRef       = useRef(2);

  // Bước 7: manual drag offset
  const dragRef  = useRef({ active: false, startX: 0, startY: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  const toast = useToast();
  const { setCurrentResult, addToHistory } = useTryonStore();

  const [fps, setFps]                 = useState(0);
  const [saving, setSaving]           = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [adjustMode, setAdjustMode]   = useState(false);  // Bước 7: chế độ kéo thủ công
  const [bgMode, setBgMode]           = useState(BG_MODES.NORMAL); // Bước 8
  const [bgColor, setBgColor]         = useState(BG_COLORS[0]);    // Bước 8
  const fpsRef = useRef({ frames: 0, last: performance.now() });

  useEffect(() => {
    if (!product?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = product.image_url;
    img.onload  = () => { clothingImgRef.current = img; };
    img.onerror = () => console.warn('[ARWebcamView] Không tải được ảnh sản phẩm');
  }, [product?.image_url]);

  useEffect(() => {
    smoothedRectRef.current = null;
    offsetRef.current = { x: 0, y: 0 };
  }, [clothingType]);

  const hasLandmarkMoved = useCallback((prev, next, cw, ch) => {
    if (!prev || !next) return true;
    const keys = [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
                  POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    return keys.some(i => {
      const a = prev[i]; const b = next[i];
      if (!a || !b) return true;
      return Math.hypot((a.x - b.x) * cw, (a.y - b.y) * ch) > LANDMARK_MOVE_THRESHOLD;
    });
  }, []);

  const adaptThrottle = useCallback((duration) => {
    if (duration > FRAME_BUDGET * 2.5) { poseSkipRef.current = 4; segSkipRef.current = 6; }
    else if (duration > FRAME_BUDGET * 1.5) { poseSkipRef.current = 2; segSkipRef.current = 4; }
    else { poseSkipRef.current = 1; segSkipRef.current = 2; }
  }, []);

  // ─── Main render loop ────────────────────────────────────────────────────
  const drawFrame = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isActive) return;
    const video  = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (video.readyState < 2) { animFrameRef.current = requestAnimationFrame(drawFrame); return; }

    const frameStart = performance.now();
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    frameCountRef.current++;
    const frame = frameCountRef.current;

    // Pose
    if (poseReady && frame % poseSkipRef.current === 0) await detect(video);
    // Segmentation
    if (segReady && frame % segSkipRef.current === 0) {
      const mask = await segment(video);
      if (mask) maskCacheRef.current = mask;
    }

    const hasLm = !!(landmarks && landmarks.length >= 25);

    // ── Bước 8: background effect ────────────────────────────────────────
    if (bgMode !== BG_MODES.NORMAL && maskCacheRef.current) {
      // Tách người khỏi background, áp dụng effect lên background
      if (!tmpCanvasRef.current) tmpCanvasRef.current = document.createElement('canvas');
      const tmp = tmpCanvasRef.current;
      tmp.width = w; tmp.height = h;
      const tCtx = tmp.getContext('2d');

      // Vẽ video gốc
      tCtx.save();
      tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(video, 0, 0, w, h);
      tCtx.restore();

      // Lấy vùng người (người = mask)
      const personCanvas = document.createElement('canvas');
      personCanvas.width = w; personCanvas.height = h;
      const pCtx = personCanvas.getContext('2d');
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(video, 0, 0, w, h);
      pCtx.restore();
      pCtx.globalCompositeOperation = 'destination-in';
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(maskCacheRef.current, 0, 0, w, h);
      pCtx.restore();

      if (bgMode === BG_MODES.BLUR) {
        // Blur background: vẽ background mờ rồi đặt người lên trên
        ctx.filter = 'blur(12px)';
        ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
        ctx.filter = 'none';
        ctx.drawImage(personCanvas, 0, 0);
      } else if (bgMode === BG_MODES.COLOR) {
        // Color replace: background = màu chọn
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(personCanvas, 0, 0);
      }
    }

    // ── Bước 7: pose guide ────────────────────────────────────────────────
    drawPoseGuide(ctx, w, h, hasLm);

    // ── Warp & composite quần áo ──────────────────────────────────────────
    if (clothingImgRef.current && product?.image_url && hasLm) {
      const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const minVis = Math.min(ls?.visibility||0, rs?.visibility||0, lh?.visibility||0, rh?.visibility||0);

      if (minVis >= 0.3) {
        if (hasLandmarkMoved(prevLandmarksRef.current, landmarks, w, h)) {
          const raw = computeClothingRectByType(clothingType, landmarks, w, h);
          if (raw) smoothedRectRef.current = smoothRect(smoothedRectRef.current, raw, 0.25);
          prevLandmarksRef.current = landmarks;
        }

        const rect = smoothedRectRef.current;
        if (rect) {
          // Áp dụng manual offset (Bước 7)
          const adjustedRect = {
            ...rect,
            x: rect.x + offsetRef.current.x,
            y: rect.y + offsetRef.current.y,
          };

          if (maskCacheRef.current && bgMode === BG_MODES.NORMAL) {
            if (!tmpCanvasRef.current) tmpCanvasRef.current = document.createElement('canvas');
            const tmp = tmpCanvasRef.current;
            tmp.width = w; tmp.height = h;
            const tCtx = tmp.getContext('2d');
            tCtx.clearRect(0, 0, w, h);
            drawClothing(tCtx, clothingImgRef.current, adjustedRect, 0.9);
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.save(); tCtx.translate(w, 0); tCtx.scale(-1, 1);
            tCtx.drawImage(maskCacheRef.current, 0, 0, w, h);
            tCtx.restore();
            ctx.drawImage(tmp, 0, 0);
          } else {
            drawClothing(ctx, clothingImgRef.current, adjustedRect, 0.88);
          }
        }
      }
    } else if (clothingImgRef.current && product?.image_url) {
      const fw = w * 0.38; const fh = h * 0.48;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(clothingImgRef.current, (w - fw) / 2, h * 0.14, fw, fh);
      ctx.globalAlpha = 1;
    }

    // Bước 7: hiển thị drag hint khi adjustMode bật
    if (adjustMode) {
      ctx.save();
      ctx.strokeStyle = 'rgba(139,92,246,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      if (smoothedRectRef.current) {
        const r = smoothedRectRef.current;
        const ax = r.x + offsetRef.current.x;
        const ay = r.y + offsetRef.current.y;
        ctx.strokeRect(ax, ay, r.w, r.h);
      }
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(139,92,246,0.9)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✥ Kéo để điều chỉnh vị trí', w / 2, h - 12);
      ctx.restore();
    }

    // Adaptive throttle
    const duration = performance.now() - frameStart;
    adaptThrottle(duration);

    // FPS
    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(fpsRef.current.frames);
      fpsRef.current = { frames: 0, last: now };
    }

    if (!document.hidden) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
    } else {
      const onVisible = () => {
        document.removeEventListener('visibilitychange', onVisible);
        animFrameRef.current = requestAnimationFrame(drawFrame);
      };
      document.addEventListener('visibilitychange', onVisible);
    }
  }, [isActive, poseReady, segReady, detect, segment, landmarks, product?.image_url,
      clothingType, bgMode, bgColor, adjustMode, hasLandmarkMoved, adaptThrottle]);

  useEffect(() => {
    if (isActive) animFrameRef.current = requestAnimationFrame(drawFrame);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isActive, drawFrame]);

  // ─── Bước 7: drag handlers (pointer events để hỗ trợ cả touch) ──────────
  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onDragStart = useCallback((e) => {
    if (!adjustMode) return;
    e.preventDefault();
    const pos = getCanvasPos(e, overlayCanvasRef.current);
    dragRef.current = { active: true, startX: pos.x - offsetRef.current.x, startY: pos.y - offsetRef.current.y };
  }, [adjustMode]);

  const onDragMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const pos = getCanvasPos(e, overlayCanvasRef.current);
    offsetRef.current = { x: pos.x - dragRef.current.startX, y: pos.y - dragRef.current.startY };
  }, []);

  const onDragEnd = useCallback(() => { dragRef.current.active = false; }, []);

  // ─── Bước 8: capture & save (merge 3 layer) ─────────────────────────────
  const handleCapture = async () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video  = videoRef.current;
    const canvas = captureCanvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;

    // Layer 1: video frame (mirror) — với background effect nếu có
    if (bgMode === BG_MODES.BLUR && maskCacheRef.current) {
      ctx.filter = 'blur(12px)';
      ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
      ctx.filter = 'none';
      // Vẽ lại người lên trên blur
      const personCanvas = document.createElement('canvas');
      personCanvas.width = w; personCanvas.height = h;
      const pCtx = personCanvas.getContext('2d');
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(video, 0, 0, w, h);
      pCtx.restore();
      pCtx.globalCompositeOperation = 'destination-in';
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(maskCacheRef.current, 0, 0, w, h);
      pCtx.restore();
      ctx.drawImage(personCanvas, 0, 0);
    } else if (bgMode === BG_MODES.COLOR && maskCacheRef.current) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      const personCanvas = document.createElement('canvas');
      personCanvas.width = w; personCanvas.height = h;
      const pCtx = personCanvas.getContext('2d');
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(video, 0, 0, w, h);
      pCtx.restore();
      pCtx.globalCompositeOperation = 'destination-in';
      pCtx.save(); pCtx.translate(w, 0); pCtx.scale(-1, 1);
      pCtx.drawImage(maskCacheRef.current, 0, 0, w, h);
      pCtx.restore();
      ctx.drawImage(personCanvas, 0, 0);
    } else {
      // Layer 1 bình thường
      ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    }

    // Layer 2: clothing warped
    if (overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0, w, h);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    if (product?.id) {
      setSaving(true);
      try {
        const result = await tryonService.saveARResult(dataUrl, product.id);
        if (result.success) {
          setCurrentResult(result.data);
          addToHistory(result.data);
          toast.success('Đã lưu ảnh AR!');
          onCapture?.(result.data);
        }
      } catch {
        toast.error('Không thể lưu ảnh');
      } finally {
        setSaving(false);
      }
    }
  };

  // Download ảnh về máy (Bước 8)
  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `smartfit-tryon-${Date.now()}.jpg`;
    a.click();
  };

  const aiStatus = poseReady
    ? `${fps} FPS${poseSkipRef.current > 1 ? ` • /${poseSkipRef.current}` : ''}`
    : poseStatus === 'loading' ? 'Đang tải AI...' : 'AI chưa sẵn sàng';

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} />
            <canvas
              ref={overlayCanvasRef}
              className={`absolute inset-0 w-full h-full ${adjustMode ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              onMouseDown={onDragStart} onMouseMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}
              onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}
            />
            <canvas ref={captureCanvasRef} className="hidden" />

            {/* HUD top-left */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 w-44">
              {product && (
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-xs text-white font-medium truncate">{product.name}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                <Zap size={11} className={fps >= FPS_TARGET ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="text-xs text-white">{aiStatus}</span>
              </div>
              {/* Bước 7: confidence bar */}
              {poseReady && <ConfidenceBar value={confidence} />}
            </div>

            {/* HUD top-right */}
            {landmarks && (
              <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-2.5 py-1">
                <p className="text-xs text-emerald-400 font-medium">
                  {maskCacheRef.current ? 'Body segmented ✓' : 'Pose detected ✓'}
                </p>
              </div>
            )}
          </>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
            <CameraOff size={40} />
            <p className="text-sm">{error || 'Camera chưa bật'}</p>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="flex gap-2">
        {!isActive ? (
          <>
            <Button onClick={startWebcam} className="flex-1">
              <Camera size={16} /> Bật Camera
            </Button>
            {capturedImage && (
              <>
                <Button variant="secondary" onClick={() => setCapturedImage(null)} className="flex-1">
                  Thử lại
                </Button>
                <Button variant="secondary" onClick={handleDownload}>
                  <ImageDown size={16} />
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button onClick={stopWebcam} variant="secondary" className="flex-1">
              <CameraOff size={16} /> Tắt
            </Button>
            {/* Bước 7: nút chỉnh thủ công */}
            <Button
              variant="secondary"
              onClick={() => setAdjustMode(v => !v)}
              className={adjustMode ? 'ring-1 ring-violet-500' : ''}
            >
              <Move size={16} />
            </Button>
            <Button onClick={handleCapture} loading={saving} disabled={!product} className="flex-1">
              <Aperture size={16} /> Chụp
            </Button>
          </>
        )}
      </div>

      {/* Bước 8: Background options */}
      {isActive && (
        <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 space-y-2">
          <p className="text-xs text-zinc-400 font-medium">Nền</p>
          <div className="flex gap-2">
            {Object.values(BG_MODES).map(mode => (
              <button key={mode}
                onClick={() => setBgMode(mode)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  bgMode === mode
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'bg-zinc-700/30 text-zinc-400 border-zinc-600/50 hover:bg-zinc-700/60'
                }`}>
                {mode === 'normal' ? 'Gốc' : mode === 'blur' ? 'Blur' : 'Màu'}
              </button>
            ))}
          </div>
          {bgMode === BG_MODES.COLOR && (
            <div className="flex gap-2 pt-1">
              {BG_COLORS.map(c => (
                <button key={c} onClick={() => setBgColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">Hướng dẫn:</p>
        <p>1. Đứng thẳng vào khung vẽ trắng → AI nhận diện tư thế</p>
        <p>2. Nhấn <Move size={10} className="inline" /> để kéo chỉnh vị trí quần áo thủ công</p>
        <p>3. Chọn nền → Chụp ảnh → Download</p>
      </div>
    </div>
  );
}
