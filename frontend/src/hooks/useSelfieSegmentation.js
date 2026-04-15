import { useRef, useState, useEffect, useCallback } from 'react';
import { withMediapipeLock } from './mediapipeInit';

const SEG_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747';
const POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404';

// selfie_segmentation nội bộ dùng pose_solution engine → phải redirect đúng CDN
function locateFile(file) {
  if (file.startsWith('pose_solution')) return `${POSE_CDN}/${file}`;
  return `${SEG_CDN}/${file}`;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Không tải được script: ${src}`));
    document.head.appendChild(s);
  });
}

function waitForGlobal(name, timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (window[name]) { resolve(window[name]); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (window[name]) {
        clearInterval(interval);
        resolve(window[name]);
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout: window.${name} không khả dụng`));
      }
    }, 100);
  });
}

// ─── Module-level singleton ──────────────────────────────────────────────────
// Tránh React Strict Mode init 2 lần → conflict WASM
let _segPromise = null;
let _segInstance = null;

async function getOrCreateSeg() {
  if (_segInstance) return _segInstance;
  if (_segPromise) return _segPromise;

  _segPromise = withMediapipeLock(async () => {
    await loadScript(`${SEG_CDN}/selfie_segmentation.js`);
    const SelfieSegmentation = await waitForGlobal('SelfieSegmentation');

    const seg = new SelfieSegmentation({ locateFile });

    seg.setOptions({
      modelSelection: 1,
      selfieMode: false,
    });

    await seg.initialize();
    _segInstance = seg;
    return seg;
  }).catch((e) => {
    _segPromise = null;
    _segInstance = null;
    throw e;
  });

  return _segPromise;
}

export function useSelfieSegmentation() {
  const maskCanvasRef = useRef(null);
  const callbackRef  = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setStatus('loading');
        const seg = await getOrCreateSeg();
        if (!active) return;

        callbackRef.current = (results) => {
          if (!active || !results.segmentationMask) return;
          if (!maskCanvasRef.current) {
            maskCanvasRef.current = document.createElement('canvas');
          }
          const mc = maskCanvasRef.current;
          mc.width  = results.segmentationMask.width;
          mc.height = results.segmentationMask.height;
          mc.getContext('2d').drawImage(results.segmentationMask, 0, 0);
        };

        seg.onResults((results) => {
          callbackRef.current?.(results);
        });

        setIsReady(true);
        setStatus('ready');
      } catch (e) {
        if (!active) return;
        console.error('[useSelfieSegmentation]', e);
        setError(e.message);
        setStatus('error');
      }
    };

    init();

    return () => {
      active = false;
      callbackRef.current = null;
      // Không đóng instance vì dùng chung (singleton)
    };
  }, []);

  const segment = useCallback(async (videoElement) => {
    if (!_segInstance || !videoElement) return null;
    try {
      await _segInstance.send({ image: videoElement });
      return maskCanvasRef.current;
    } catch {
      return null;
    }
  }, []);

  return { segment, maskCanvas: maskCanvasRef, isReady, error, status };
}
