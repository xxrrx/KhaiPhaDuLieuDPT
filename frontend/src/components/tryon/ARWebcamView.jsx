import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Aperture, Zap } from 'lucide-react';
import Button from '../ui/Button';
import { useWebcam } from '../../hooks/useWebcam';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { tryonService } from '../../services/tryonService';
import { useToast } from '../../hooks/useToast';
import useTryonStore from '../../store/tryonStore';

export default function ARWebcamView({ product, onCapture }) {
  const { videoRef, isActive, error, startWebcam, stopWebcam } = useWebcam();
  const { detect, landmarks, segmentationMask, isReady: poseReady } = useMediaPipe();
  const overlayCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const clothingImgRef = useRef(null);
  const toast = useToast();
  const { setCurrentResult, addToHistory } = useTryonStore();
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fps, setFps] = useState(0);
  const fpsCountRef = useRef({ frames: 0, lastTime: Date.now() });

  // Preload clothing image
  useEffect(() => {
    if (!product?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = product.image_url;
    img.onload = () => { clothingImgRef.current = img; };
  }, [product?.image_url]);

  const drawFrame = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Send frame to MediaPipe
    if (poseReady) {
      await detect(video);
    }

    // Draw clothing overlay
    if (clothingImgRef.current && product?.image_url) {
      let x, y, w, h;

      if (landmarks && landmarks.length >= 25) {
        const ls = landmarks[11]; // leftShoulder
        const rs = landmarks[12]; // rightShoulder
        const lh = landmarks[23]; // leftHip
        const rh = landmarks[24]; // rightHip

        const shoulderCx = ((ls.x + rs.x) / 2) * canvas.width;
        const shoulderY = ((ls.y + rs.y) / 2) * canvas.height;
        const hipY = ((lh.y + rh.y) / 2) * canvas.height;
        const torsoWidth = Math.abs(rs.x - ls.x) * canvas.width;

        w = torsoWidth * 1.8;
        h = (hipY - shoulderY) * 1.4;
        x = shoulderCx - w / 2;
        y = shoulderY - (h * 0.1);

        // Skeleton dots
        ctx.fillStyle = 'rgba(244,63,94,0.6)';
        [11, 12, 23, 24].forEach((idx) => {
          const pt = landmarks[idx];
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Fallback: center torso estimate
        w = canvas.width * 0.38;
        h = canvas.height * 0.48;
        x = (canvas.width - w) / 2;
        y = canvas.height * 0.14;
      }

      if (w > 0 && h > 0) {
        if (segmentationMask) {
          // Option 2: clip clothing to body silhouette using segmentation mask
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');

          // Draw clothing on temp canvas
          tempCtx.globalAlpha = 0.85;
          tempCtx.drawImage(clothingImgRef.current, x, y, w, h);

          // Clip to body silhouette (keep only pixels where body exists)
          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.drawImage(segmentationMask, 0, 0, canvas.width, canvas.height);

          ctx.drawImage(tempCanvas, 0, 0);
        } else {
          // Fallback: plain overlay
          ctx.globalAlpha = 0.75;
          ctx.drawImage(clothingImgRef.current, x, y, w, h);
          ctx.globalAlpha = 1;
        }
      }
    }

    // FPS counter
    const now = Date.now();
    fpsCountRef.current.frames++;
    if (now - fpsCountRef.current.lastTime >= 1000) {
      setFps(fpsCountRef.current.frames);
      fpsCountRef.current = { frames: 0, lastTime: now };
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [isActive, poseReady, detect, landmarks, segmentationMask, product?.image_url]);

  useEffect(() => {
    if (isActive) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, drawFrame]);

  const handleCapture = async () => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            <canvas ref={captureCanvasRef} className="hidden" />

            {/* HUD */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product && (
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-xs text-white font-medium">{product.name}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                <Zap size={11} className={poseReady ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="text-xs text-white">{poseReady ? `${fps} FPS` : 'Đang tải AI...'}</span>
              </div>
            </div>

            {landmarks && (
              <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-2.5 py-1">
                <p className="text-xs text-emerald-400 font-medium">
                  {segmentationMask ? 'Body segmented ✓' : 'Pose detected ✓'}
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

      <div className="flex gap-3">
        {!isActive ? (
          <>
            <Button onClick={startWebcam} className="flex-1">
              <Camera size={16} />
              Bật Camera
            </Button>
            {capturedImage && (
              <Button variant="secondary" onClick={() => setCapturedImage(null)} className="flex-1">
                Thử lại
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={stopWebcam} variant="secondary" className="flex-1">
              <CameraOff size={16} />
              Tắt Camera
            </Button>
            <Button onClick={handleCapture} loading={saving} disabled={!product} className="flex-1">
              <Aperture size={16} />
              Chụp ảnh
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">Hướng dẫn:</p>
        <p>1. Bật camera → Chọn sản phẩm → Đứng thẳng cách camera 1-2 mét</p>
        <p>2. AI sẽ tự động nhận diện vóc dáng và đặt trang phục khớp với cơ thể</p>
        <p>3. Nhấn "Chụp ảnh" để lưu kết quả</p>
      </div>
    </div>
  );
}
