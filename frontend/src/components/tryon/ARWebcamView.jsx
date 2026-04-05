import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Aperture } from 'lucide-react';
import Button from '../ui/Button';
import { useWebcam } from '../../hooks/useWebcam';
import { tryonService } from '../../services/tryonService';
import { useToast } from '../../hooks/useToast';

export default function ARWebcamView({ product, onCapture }) {
  const { videoRef, isActive, error, startWebcam, stopWebcam, captureFrame } = useWebcam();
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Draw clothing overlay on canvas
  const drawOverlay = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw clothing overlay if product image available
    if (product?.image_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = product.image_url;
      img.onload = () => {
        // Position clothing over torso area (rough estimate)
        const w = canvas.width * 0.4;
        const h = canvas.height * 0.5;
        const x = (canvas.width - w) / 2;
        const y = canvas.height * 0.15;
        ctx.globalAlpha = 0.65;
        ctx.drawImage(img, x, y, w, h);
        ctx.globalAlpha = 1;
      };
    }

    animFrameRef.current = requestAnimationFrame(drawOverlay);
  }, [videoRef, product]);

  useEffect(() => {
    if (isActive) {
      drawOverlay();
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isActive, drawOverlay]);

  const handleCapture = async () => {
    const dataUrl = captureFrame(canvasRef);
    if (!dataUrl) return;
    setCapturedImage(dataUrl);

    if (product?.id) {
      setSaving(true);
      try {
        const result = await tryonService.saveARResult(dataUrl, product.id);
        if (result.success) {
          toast.success('Đã lưu ảnh AR!');
          onCapture && onCapture(result.data);
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
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-video">
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
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
            <CameraOff size={40} />
            <p className="text-sm">{error || 'Camera chưa bật'}</p>
          </div>
        )}

        {isActive && product && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-xs text-white font-medium">{product.name}</p>
            <p className="text-xs text-zinc-300">AR Overlay</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isActive ? (
          <Button onClick={startWebcam} className="flex-1">
            <Camera size={16} />
            Bật Camera
          </Button>
        ) : (
          <>
            <Button onClick={stopWebcam} variant="secondary" className="flex-1">
              <CameraOff size={16} />
              Tắt Camera
            </Button>
            <Button onClick={handleCapture} loading={saving} className="flex-1">
              <Aperture size={16} />
              Chụp ảnh
            </Button>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500">
        <p>Tính năng AR overlay — mặc trang phục ảo qua webcam. Nhấn "Chụp ảnh" để lưu kết quả.</p>
      </div>
    </div>
  );
}
