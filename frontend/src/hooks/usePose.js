import { useRef, useState, useEffect, useCallback } from 'react';
import { withMediapipeLock } from './mediapipeInit';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404';

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
let _posePromise = null;
let _poseInstance = null;

async function getOrCreatePose() {
  if (_poseInstance) return _poseInstance;
  if (_posePromise) return _posePromise;

  _posePromise = withMediapipeLock(async () => {
    await loadScript(`${CDN}/pose.js`);
    const Pose = await waitForGlobal('Pose');

    const pose = new Pose({
      locateFile: (file) => `${CDN}/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await pose.initialize();
    _poseInstance = pose;
    return pose;
  }).catch((e) => {
    // Reset để cho phép retry
    _posePromise = null;
    _poseInstance = null;
    throw e;
  });

  return _posePromise;
}

// ─── Landmark indices ────────────────────────────────────────────────────────
export const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export function usePose() {
  const landmarksRef = useRef(null);
  const callbackRef  = useRef(null);
  const [landmarks, setLandmarks] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setStatus('loading');
        const pose = await getOrCreatePose();
        if (!active) return;

        // Gán callback cho instance dùng chung
        callbackRef.current = (results) => {
          if (!active) return;
          const lm = results.poseLandmarks || null;
          landmarksRef.current = lm;
          setLandmarks(lm);

          if (lm) {
            const keyPoints = [
              lm[POSE_LANDMARKS.LEFT_SHOULDER],
              lm[POSE_LANDMARKS.RIGHT_SHOULDER],
              lm[POSE_LANDMARKS.LEFT_HIP],
              lm[POSE_LANDMARKS.RIGHT_HIP],
            ];
            const avg = keyPoints.reduce((sum, p) => sum + (p?.visibility || 0), 0) / keyPoints.length;
            setConfidence(avg);
          } else {
            setConfidence(0);
          }
        };

        pose.onResults((results) => {
          callbackRef.current?.(results);
        });

        setIsReady(true);
        setStatus('ready');
      } catch (e) {
        if (!active) return;
        console.error('[usePose]', e);
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

  const detect = useCallback(async (videoElement) => {
    if (!_poseInstance || !videoElement) return null;
    try {
      await _poseInstance.send({ image: videoElement });
      return landmarksRef.current;
    } catch {
      return null;
    }
  }, []);

  return { detect, landmarks, confidence, isReady, error, status };
}
