/**
 * clothingWarper.js — Sprint 1.3
 * Warp ảnh quần áo theo 4 điểm landmark (vai trái, vai phải, hông trái, hông phải)
 *
 * Phase 1: bounding box với góc nghiêng (đủ cho Sprint 1.3)
 * Phase 2: scanline trapezoid warp (dùng khi bounding box chưa đủ chính xác)
 */

/**
 * Smoothing đơn giản để tránh flicker
 * prev: giá trị trước đó, next: giá trị mới, alpha: tốc độ lerp (0-1)
 */
export function lerp(prev, next, alpha = 0.3) {
  if (prev == null) return next;
  return prev + (next - prev) * alpha;
}

/**
 * Smooth toàn bộ bounding rect để tránh nhấp nháy
 */
export function smoothRect(prev, next, alpha = 0.25) {
  if (!prev) return { ...next };
  return {
    x: lerp(prev.x, next.x, alpha),
    y: lerp(prev.y, next.y, alpha),
    w: lerp(prev.w, next.w, alpha),
    h: lerp(prev.h, next.h, alpha),
    angle: lerp(prev.angle, next.angle, alpha),
  };
}

/**
 * Tính bounding rect của quần áo từ 4 điểm landmark
 * @param {Object} ls - leftShoulder  {x, y} normalized (0-1)
 * @param {Object} rs - rightShoulder {x, y} normalized (0-1)
 * @param {Object} lh - leftHip       {x, y} normalized (0-1)
 * @param {Object} rh - rightHip      {x, y} normalized (0-1)
 * @param {number} cw - canvas width
 * @param {number} ch - canvas height
 * @param {Object} opts - { paddingX: 1.3, paddingTop: 0.1, paddingBottom: 0.15 }
 * @returns {{ x, y, w, h, angle }}
 */
export function computeClothingRect(ls, rs, lh, rh, cw, ch, opts = {}) {
  const { paddingX = 1.3, paddingTop = 0.12, paddingBottom = 0.15 } = opts;

  // Tọa độ pixel (chú ý: landmarks có x normalized, cần mirror vì video bị flip)
  const lsx = (1 - ls.x) * cw;  const lsy = ls.y * ch;
  const rsx = (1 - rs.x) * cw;  const rsy = rs.y * ch;
  const lhx = (1 - lh.x) * cw;  const lhy = lh.y * ch;
  const rhx = (1 - rh.x) * cw;  const rhy = rh.y * ch;

  // Tâm vai + hông
  const shoulderCx = (lsx + rsx) / 2;
  const shoulderCy = (lsy + rsy) / 2;
  const hipCy      = (lhy + rhy) / 2;

  // Chiều rộng vai (dùng khoảng cách Euclidean để tính đúng khi nghiêng)
  const shoulderDist = Math.hypot(rsx - lsx, rsy - lsy);

  // Chiều cao thân
  const torsoH = hipCy - shoulderCy;

  // Bounding box với padding
  const w = shoulderDist * paddingX;
  const h = torsoH * (1 + paddingBottom);
  const x = shoulderCx - w / 2;
  const y = shoulderCy - torsoH * paddingTop;

  // Góc nghiêng của đường vai (để xoay quần áo khi người đứng nghiêng)
  const angle = Math.atan2(rsy - lsy, rsx - lsx);

  return { x, y, w, h, angle };
}

/**
 * Vẽ quần áo lên canvas theo bounding rect (có hỗ trợ xoay góc)
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {{ x, y, w, h, angle }} rect
 * @param {number} opacity
 */
export function drawClothing(ctx, img, rect, opacity = 0.85) {
  const { x, y, w, h, angle } = rect;
  if (w <= 0 || h <= 0) return;

  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Scanline trapezoid warp — warp ảnh quần áo theo hình thang
 * (dùng khi bounding box chưa đủ chính xác, ví dụ khi người đứng nghiêng nhiều)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {Object} ls - leftShoulder pixel coords  {x, y}
 * @param {Object} rs - rightShoulder pixel coords {x, y}
 * @param {Object} lh - leftHip pixel coords       {x, y}
 * @param {Object} rh - rightHip pixel coords      {x, y}
 * @param {number} strips - số dải ngang (càng nhiều càng chính xác, default 20)
 * @param {number} opacity
 */
export function drawClothingTrapezoid(ctx, img, ls, rs, lh, rh, strips = 20, opacity = 0.85) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (imgW === 0 || imgH === 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  for (let i = 0; i < strips; i++) {
    const t0 = i / strips;
    const t1 = (i + 1) / strips;

    // Nội suy cạnh trái và phải theo t
    const x0L = ls.x + (lh.x - ls.x) * t0;
    const y0L = ls.y + (lh.y - ls.y) * t0;
    const x1L = ls.x + (lh.x - ls.x) * t1;
    const y1L = ls.y + (lh.y - ls.y) * t1;

    const x0R = rs.x + (rh.x - rs.x) * t0;
    const y0R = rs.y + (rh.y - rs.y) * t0;
    const x1R = rs.x + (rh.x - rs.x) * t1;
    const y1R = rs.y + (rh.y - rs.y) * t1;

    // Chiều rộng dải
    const dstW0 = x0R - x0L;
    const dstH  = Math.max(y1L, y1R) - Math.min(y0L, y0R);

    if (dstW0 <= 0 || dstH <= 0) continue;

    // Source strip từ ảnh quần áo
    const srcY  = imgH * t0;
    const srcH  = imgH / strips;

    // Dùng transform để scale + shear dải
    ctx.save();
    ctx.transform(
      dstW0 / imgW, 0,
      0, dstH / srcH,
      x0L, Math.min(y0L, y0R)
    );
    ctx.drawImage(img, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Helper: compute pixel coords từ normalized landmark + canvas size (có mirror)
 */
export function landmarkToPixel(lm, cw, ch) {
  return { x: (1 - lm.x) * cw, y: lm.y * ch };
}

// ─── Bước 5: Xử lý từng loại quần áo ─────────────────────────────────────────

/**
 * Clothing types được hỗ trợ
 */
export const CLOTHING_TYPES = {
  TOP:     'top',     // Áo — vai + hông
  BOTTOM:  'bottom',  // Quần — hông + mắt cá chân
  SKIRT:   'skirt',   // Váy — hông + mắt cá chân (xòe rộng xuống dưới)
  JACKET:  'jacket',  // Áo khoác — vai + hông, mở rộng 25%
};

/**
 * Tính bounding rect theo loại quần áo
 * @param {string} type - CLOTHING_TYPES.*
 * @param {Array} landmarks - mảng 33 landmarks từ MediaPipe Pose
 * @param {number} cw - canvas width
 * @param {number} ch - canvas height
 * @returns {{ x, y, w, h, angle } | null}
 */
export function computeClothingRectByType(type, landmarks, cw, ch) {
  if (!landmarks || landmarks.length < 29) return null;

  const ls  = landmarks[11]; // LEFT_SHOULDER
  const rs  = landmarks[12]; // RIGHT_SHOULDER
  const lh  = landmarks[23]; // LEFT_HIP
  const rh  = landmarks[24]; // RIGHT_HIP
  const lk  = landmarks[25]; // LEFT_KNEE
  const rk  = landmarks[26]; // RIGHT_KNEE
  const la  = landmarks[27]; // LEFT_ANKLE
  const ra  = landmarks[28]; // RIGHT_ANKLE

  switch (type) {

    case CLOTHING_TYPES.TOP: {
      // Áo: vai trái → vai phải → hông phải → hông trái
      const minVis = Math.min(ls?.visibility||0, rs?.visibility||0, lh?.visibility||0, rh?.visibility||0);
      if (minVis < 0.3) return null;
      return computeClothingRect(ls, rs, lh, rh, cw, ch, { paddingX: 2.3, paddingTop: 0.15, paddingBottom: 0.18 });
    }

    case CLOTHING_TYPES.JACKET: {
      // Áo khoác: giống áo nhưng rộng hơn 25%
      const minVis = Math.min(ls?.visibility||0, rs?.visibility||0, lh?.visibility||0, rh?.visibility||0);
      if (minVis < 0.3) return null;
      return computeClothingRect(ls, rs, lh, rh, cw, ch, { paddingX: 1.9, paddingTop: 0.15, paddingBottom: 0.18 });
    }

    case CLOTHING_TYPES.BOTTOM: {
      // Quần: hông → mắt cá chân
      // Ưu tiên dùng ankle, fallback về knee nếu ankle không nhìn thấy
      const topL  = lh;
      const topR  = rh;
      const botL  = (la?.visibility||0) >= 0.3 ? la : lk;
      const botR  = (ra?.visibility||0) >= 0.3 ? ra : rk;
      const minVis = Math.min(topL?.visibility||0, topR?.visibility||0, botL?.visibility||0, botR?.visibility||0);
      if (minVis < 0.25) return null;

      // Pixel coords (mirrored)
      const tlx = (1 - topL.x) * cw;  const tly = topL.y * ch;
      const trx = (1 - topR.x) * cw;  const trY = topR.y * ch;
      const blx = (1 - botL.x) * cw;  const bly = botL.y * ch;
      const brx = (1 - botR.x) * cw;  const brY = botR.y * ch;

      const topCx = (tlx + trx) / 2;
      const topCy = (tly + trY) / 2;
      const botCy = (bly + brY) / 2;
      const hipDist = Math.hypot(trx - tlx, trY - tly);

      const w = hipDist * 1.45;
      const h = (botCy - topCy) * 1.05;
      const x = topCx - w / 2;
      const y = topCy - (botCy - topCy) * 0.04;
      const angle = Math.atan2(trY - tly, trx - tlx);

      return { x, y, w, h, angle };
    }

    case CLOTHING_TYPES.SKIRT: {
      // Váy: hông → mắt cá chân, xòe rộng dần xuống dưới
      const topL  = lh;
      const topR  = rh;
      const botL  = (la?.visibility||0) >= 0.3 ? la : lk;
      const botR  = (ra?.visibility||0) >= 0.3 ? ra : rk;
      const minVis = Math.min(topL?.visibility||0, topR?.visibility||0, botL?.visibility||0, botR?.visibility||0);
      if (minVis < 0.25) return null;

      const tlx = (1 - topL.x) * cw;  const tly = topL.y * ch;
      const trx = (1 - topR.x) * cw;  const trY = topR.y * ch;
      const blx = (1 - botL.x) * cw;  const bly = botL.y * ch;
      const brx = (1 - botR.x) * cw;  const brY = botR.y * ch;

      const topCx = (tlx + trx) / 2;
      const topCy = (tly + trY) / 2;
      const botCy = (bly + brY) / 2;
      const hipDist = Math.hypot(trx - tlx, trY - tly);

      // Váy xòe: bottom rộng hơn top ~40%
      const w = hipDist * 1.7;
      const h = (botCy - topCy) * 1.05;
      const x = topCx - w / 2;
      const y = topCy - (botCy - topCy) * 0.04;
      const angle = Math.atan2(trY - tly, trx - tlx);

      return { x, y, w, h, angle };
    }

    default:
      return computeClothingRectByType(CLOTHING_TYPES.TOP, landmarks, cw, ch);
  }
}

/**
 * Kiểm tra visibility của các landmark cần thiết cho từng loại
 * Dùng để hiển thị warning khi người đứng ngoài khung
 */
export function checkLandmarkVisibility(type, landmarks) {
  if (!landmarks) return { ok: false, missing: [] };

  const check = (indices) => {
    const missing = indices.filter(i => (landmarks[i]?.visibility || 0) < 0.3);
    return { ok: missing.length === 0, missing };
  };

  switch (type) {
    case CLOTHING_TYPES.TOP:
    case CLOTHING_TYPES.JACKET:
      return check([11, 12, 23, 24]);
    case CLOTHING_TYPES.BOTTOM:
    case CLOTHING_TYPES.SKIRT:
      return check([23, 24, 27, 28]);
    default:
      return check([11, 12, 23, 24]);
  }
}
