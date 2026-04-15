/**
 * PoseTest.jsx — Sprint 1.2 test component
 * Mục đích: kiểm tra Pose Detection hoạt động đúng trước khi tích hợp
 * Xóa file này sau khi Sprint 1.2 pass
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebcam } from '../../hooks/useWebcam';
import { usePose, POSE_LANDMARKS } from '../../hooks/usePose';

// Màu cho từng nhóm landmark
const DOT_COLOR = '#ff4444';
const KEY_DOT_COLOR = '#00ff88'; // vai + hông (highlight khác màu)
const SKELETON_COLOR = 'rgba(255, 255, 255, 0.4)';

// Các cặp kết nối xương (skeleton lines)
const CONNECTIONS = [
  [11, 12], // vai trái - vai phải
  [11, 13], [13, 15], // cánh tay trái
  [12, 14], [14, 16], // cánh tay phải
  [11, 23], [12, 24], // thân trên
  [23, 24], // hông trái - hông phải
  [23, 25], [25, 27], // chân trái
  [24, 26], [26, 28], // chân phải
];

const KEY_INDICES = new Set(Object.values(POSE_LANDMARKS));

export default function PoseTest() {
  const { videoRef, isActive, error: camError, startWebcam, stopWebcam } = useWebcam();
  const { detect, landmarks, confidence, isReady, error: poseError, status } = usePose();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const fpsRef = useRef({ frames: 0, last: Date.now() });
  const logTimerRef = useRef(null);

  // Log tọa độ vai/hông mỗi giây
  useEffect(() => {
    if (!isActive || !landmarks) return;
    logTimerRef.current = setInterval(() => {
      if (!landmarks) return;
      const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      console.log('[PoseTest] Vai trái (11):', ls?.x?.toFixed(3), ls?.y?.toFixed(3), 'vis:', ls?.visibility?.toFixed(2));
      console.log('[PoseTest] Vai phải (12):', rs?.x?.toFixed(3), rs?.y?.toFixed(3), 'vis:', rs?.visibility?.toFixed(2));
      console.log('[PoseTest] Hông trái (23):', lh?.x?.toFixed(3), lh?.y?.toFixed(3), 'vis:', lh?.visibility?.toFixed(2));
      console.log('[PoseTest] Hông phải (24):', rh?.x?.toFixed(3), rh?.y?.toFixed(3), 'vis:', rh?.visibility?.toFixed(2));
    }, 1000);
    return () => clearInterval(logTimerRef.current);
  }, [isActive, landmarks]);

  const drawFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;
    if (video.readyState < 2) {
      animRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Vẽ video (mirror)
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    // Detect pose
    if (isReady) {
      await detect(video);
    }

    // Vẽ skeleton + landmarks
    if (landmarks) {
      // Skeleton lines
      if (showSkeleton) {
        ctx.strokeStyle = SKELETON_COLOR;
        ctx.lineWidth = 2;
        for (const [a, b] of CONNECTIONS) {
          const pa = landmarks[a];
          const pb = landmarks[b];
          if (!pa || !pb) continue;
          if ((pa.visibility || 0) < 0.3 || (pb.visibility || 0) < 0.3) continue;
          // Mirror x
          ctx.beginPath();
          ctx.moveTo((1 - pa.x) * w, pa.y * h);
          ctx.lineTo((1 - pb.x) * w, pb.y * h);
          ctx.stroke();
        }
      }

      // Dots
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if (!lm || (lm.visibility || 0) < 0.3) continue;
        const x = (1 - lm.x) * w;
        const y = lm.y * h;
        const isKey = KEY_INDICES.has(i);

        ctx.beginPath();
        ctx.arc(x, y, isKey ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isKey ? KEY_DOT_COLOR : DOT_COLOR;
        ctx.fill();

        // Nhãn số cho key points
        if (isKey) {
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
  }, [isActive, isReady, detect, landmarks, showSkeleton]);

  useEffect(() => {
    if (isActive) {
      animRef.current = requestAnimationFrame(drawFrame);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isActive, drawFrame]);

  const confPct = Math.round(confidence * 100);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
        <p className="text-sm font-semibold text-zinc-300">Sprint 1.2 — Pose Detection Test</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Chấm <span className="text-red-400">đỏ</span> = 33 landmarks •{' '}
          Chấm <span className="text-emerald-400">xanh</span> = vai (11,12) + hông (23,24)
        </p>
      </div>

      {/* Canvas */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Status */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                status === 'error'  ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {status === 'ready'   ? `Pose ON • ${fps} FPS` :
                 status === 'error'   ? '❌ Lỗi model' :
                 status === 'loading' ? '⏳ Đang tải model (~30MB)...' : '⏳ Khởi động...'}
              </span>

              {status === 'ready' && (
                <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                  confPct >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  confPct > 0   ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-zinc-700/50 text-zinc-500 border-zinc-600'
                }`}>
                  Confidence: {confPct}%
                </span>
              )}
            </div>

            {/* Checklist */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
              <p className={fps > 0 ? 'text-emerald-400' : 'text-zinc-500'}>
                {fps > 0 ? '✅' : '⬜'} 33 landmarks hiển thị
              </p>
              <p className={landmarks ? 'text-emerald-400' : 'text-zinc-500'}>
                {landmarks ? '✅' : '⬜'} Vai + hông highlight xanh
              </p>
              <p className={confPct >= 70 ? 'text-emerald-400' : confPct > 0 ? 'text-amber-400' : 'text-zinc-500'}>
                {confPct >= 70 ? '✅' : '⚠️'} Confidence {'>'} 70% ({confPct}%)
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
          onClick={() => setShowSkeleton(v => !v)}
          className="py-2.5 rounded-xl text-sm font-medium bg-zinc-700/50 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 transition-colors"
        >
          {showSkeleton ? 'Ẩn Skeleton' : 'Hiện Skeleton'}
        </button>
      </div>

      {/* Errors */}
      {(camError || poseError) && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          ⚠️ {camError || poseError}
        </p>
      )}

      {/* Test checklist */}
      <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/30 text-xs space-y-1.5 text-zinc-400">
        <p className="font-semibold text-zinc-300">Test pass khi:</p>
        <p>1. 33 chấm đỏ hiện đúng vị trí trên cơ thể</p>
        <p>2. Vai (11,12) và hông (23,24) highlight xanh khác màu</p>
        <p>3. Tọa độ thay đổi khi di chuyển (xem console log mỗi giây)</p>
        <p>4. Confidence score {'>'} 70% khi đứng thẳng trong khung hình</p>
      </div>
    </div>
  );
}
