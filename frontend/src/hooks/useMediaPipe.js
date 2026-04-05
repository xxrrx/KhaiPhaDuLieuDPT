import { useRef, useState, useEffect, useCallback } from 'react';

export function useMediaPipe() {
  const poseRef = useRef(null);
  const [landmarks, setLandmarks] = useState(null);
  const [segmentationMask, setSegmentationMask] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPose = () => {
      if (!window.Pose) return;
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults((results) => {
        setLandmarks(results.poseLandmarks || null);
        setSegmentationMask(results.segmentationMask || null);
      });
      poseRef.current = pose;
      setIsReady(true);
    };

    const loadScript = (src) => new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });

    const load = async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      initPose();
    };

    load();

    return () => {
      if (poseRef.current) {
        poseRef.current.close?.();
        poseRef.current = null;
      }
    };
  }, []);

  const detect = useCallback(async (videoElement) => {
    if (!poseRef.current || !videoElement) return;
    try {
      await poseRef.current.send({ image: videoElement });
    } catch {
      // ignore frame errors
    }
  }, []);

  return { detect, landmarks, segmentationMask, isReady };
}
