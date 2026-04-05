import { useRef, useCallback, useEffect } from 'react';

export function useThreeJS(canvasRef) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);

  useEffect(() => {
    const loadThree = async () => {
      if (!canvasRef.current) return;
      try {
        const THREE = await import('three');
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        camera.position.z = 1;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(canvas.offsetWidth || 640, canvas.offsetHeight || 480);
        sceneRef.current = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;
      } catch {
        // Three.js not available, graceful degradation
      }
    };
    loadThree();

    return () => {
      rendererRef.current?.dispose?.();
    };
  }, [canvasRef]);

  const overlayClothing = useCallback((imageUrl, keypoints, canvasWidth, canvasHeight) => {
    if (!sceneRef.current || !rendererRef.current || !keypoints) return;
    const THREE = window.THREE;
    if (!THREE) return;

    // Clear previous mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current = null;
    }

    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (texture) => {
      const ls = keypoints[11]; // leftShoulder
      const rs = keypoints[12]; // rightShoulder
      const lh = keypoints[23]; // leftHip
      const rh = keypoints[24]; // rightHip

      if (!ls || !rs || !lh || !rh) return;

      const cx = ((ls.x + rs.x) / 2) * 2 - 1; // NDC
      const cy = -(((ls.y + lh.y) / 2) * 2 - 1);
      const w = Math.abs(rs.x - ls.x) * 2.5;
      const h = Math.abs(lh.y - ls.y) * 2.5;

      const geometry = new THREE.PlaneGeometry(w, h);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.8 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(cx, cy, 0);

      sceneRef.current.add(mesh);
      meshRef.current = mesh;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    });
  }, []);

  return { overlayClothing };
}
