/**
 * mediapipeInit.js
 * Global serialization lock để tránh conflict WASM khi
 * @mediapipe/pose và @mediapipe/selfie_segmentation khởi tạo đồng thời.
 * Cả hai đều dùng chung pose_solution_simd_wasm_bin.js nên KHÔNG được init song song.
 */

let _lock = Promise.resolve();

/**
 * Chạy fn() tuần tự — fn tiếp theo chờ fn trước xong mới chạy.
 */
export function withMediapipeLock(fn) {
  const next = _lock.then(fn);
  _lock = next.catch(() => {}); // không để lỗi block queue
  return next;
}
