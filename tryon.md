Các bước thực hiện AR Virtual Try-On

  ---
  Bước 1: Cài đặt dependencies

  npm install @mediapipe/pose @mediapipe/selfie_segmentation @mediapipe/camera_utils

  Dự án đang dùng Vite + React nên không cần thay đổi stack.

  ---
  Bước 2: Refactor useMediaPipe.js

  Tách thành 2 hook riêng:

  - usePose.js — chạy MediaPipe Pose, trả về 33 landmarks
  - useSelfieSegmentation.js — chạy Selfie Segmentation, trả về mask canvas

  ---
  Bước 3: Xây dựng Clothing Warper

  Tạo file clothingWarper.js — nhận 4 điểm (vai trái, vai phải, hông trái, hông phải) và warp ảnh quần áo theo hình thang bằng Canvas 2D API:

  Ảnh quần áo gốc (hình chữ nhật)
          ↓
  Biến dạng theo 4 điểm landmark
          ↓
  Quần áo khớp với tư thế người

  ▎ Canvas 2D không hỗ trợ perspective transform trực tiếp → cần chia thành các dải ngang nhỏ (scanline method) hoặc dùng WebGL.

  ---
  Bước 4: Render pipeline trong ARWebcamView.jsx

  Mỗi frame theo thứ tự:

  1. Vẽ video frame lên canvas chính
  2. Lấy segmentation mask → tách người khỏi background
  3. Lấy pose landmarks → tính vị trí, kích thước, góc nghiêng quần áo
  4. Warp ảnh quần áo theo landmarks
  5. Clip quần áo theo body mask (không tràn ra nền)
  6. Composite lên canvas

  ---
  Bước 5: Xử lý từng loại quần áo

  ┌───────────────┬─────────────────────────────────────────────┐
  │     Loại      │               Landmarks dùng                │
  ├───────────────┼─────────────────────────────────────────────┤
  │ Áo (top)      │ Vai trái, vai phải, hông trái, hông phải    │
  ├───────────────┼─────────────────────────────────────────────┤
  │ Quần (bottom) │ Hông trái, hông phải, mắt cá chân trái/phải │
  ├───────────────┼─────────────────────────────────────────────┤
  │ Váy           │ Hông + mắt cá chân                          │
  ├───────────────┼─────────────────────────────────────────────┤
  │ Áo khoác      │ Vai + mở rộng thêm 20-30%                   │
  └───────────────┴─────────────────────────────────────────────┘

  ---
  Bước 6: Tối ưu performance

  - Chạy Pose + Segmentation xen kẽ (không chạy song song cùng frame) để tránh lag
  - Dùng requestAnimationFrame đúng cách, skip frame khi FPS < 20
  - Cache landmark khi người đứng yên (landmark thay đổi < 5px thì không recalculate)

  ---
  Bước 7: UX improvements

  - Thêm pose guide overlay — khung hướng dẫn người đứng đúng vị trí
  - Hiển thị confidence score của pose detection
  - Thêm nút chỉnh thủ công (kéo để điều chỉnh vị trí quần áo)

  ---
  Bước 8: Capture & Save

  Merge 3 layer:
  [Video frame] + [Clothing warped] + [Background blur/replace]
          ↓
  canvas.toDataURL() → lưu ảnh hoặc quay video

  Sprint 1.1 — Setup & Selfie Segmentation (Test độc lập)

  Làm:
  - Cài @mediapipe/selfie_segmentation
  - Viết useSelfieSegmentation.js hook
  - Tạo component test đơn giản: chỉ tách background, tô màu xanh lên người

  Test pass khi:
  ✅ Webcam bật được
  ✅ Vùng người được highlight màu xanh/đỏ
  ✅ FPS >= 15
  ✅ Mask không bị nhấp nháy quá nhiều

  File tạo:
  hooks/useSelfieSegmentation.js
  components/tryon/SegmentationTest.jsx  ← component test tạm

  ---
  Sprint 1.2 — Pose Detection (Test độc lập)

  Làm:
  - Refactor useMediaPipe.js → tách ra usePose.js
  - Hiển thị 33 landmarks dưới dạng chấm đỏ lên video
  - Log ra console tọa độ vai/hông mỗi giây

  Test pass khi:
  ✅ 33 chấm hiện đúng vị trí trên người
  ✅ Vai trái (11), vai phải (12), hông trái (23), hông phải (24) được highlight khác màu
  ✅ Tọa độ thay đổi khi người di chuyển
  ✅ Confidence score hiển thị > 0.7

  File tạo:
  hooks/usePose.js
  components/tryon/PoseTest.jsx  ← component test tạm

  ---
  Sprint 1.3 — Clothing Warper cơ bản (Test với ảnh tĩnh)

  Làm:
  - Viết clothingWarper.js — nhận 4 điểm, scale + position ảnh quần áo
  - Chưa cần warp phức tạp — chỉ dùng bounding box trước
  - Test với 1 ảnh quần áo cố định

  Test pass khi:
  ✅ Ảnh quần áo xuất hiện đúng vùng thân (không lệch quá 10%)
  ✅ Kích thước thay đổi khi người tiến/lùi
  ✅ Vị trí đúng khi người đứng nghiêng 30 độ
  ✅ Không bị flicker (dùng smoothing)

  File tạo:
  utils/clothingWarper.js
  components/tryon/WarpTest.jsx  ← component test tạm

  ---
  Sprint 1.4 — Ghép lại thành AR View hoàn chỉnh

  Làm:
  - Kết hợp Segmentation + Pose + Warper vào ARWebcamView.jsx
  - Render pipeline: Video → Mask → Landmarks → Warp → Composite
  - Xóa các component test tạm

  Test pass khi:
  ✅ Quần áo bám theo người khi di chuyển
  ✅ Quần áo không hiện lên background (nhờ mask)
  ✅ FPS >= 20 trên máy thường
  ✅ Chụp ảnh → ảnh capture có quần áo đúng vị trí

  ---
  Checklist tổng Phase 1

  ┌─────────────────────────┬────────────────────┬──────────────┐
  │         Sprint          │ Thời gian ước tính │ Test độc lập │
  ├─────────────────────────┼────────────────────┼──────────────┤
  │ 1.1 Selfie Segmentation │ ~2 giờ             │ ✅ Có        │
  ├─────────────────────────┼────────────────────┼──────────────┤
  │ 1.2 Pose Detection      │ ~1.5 giờ           │ ✅ Có        │
  ├─────────────────────────┼────────────────────┼──────────────┤
  │ 1.3 Clothing Warper     │ ~3 giờ             │ ✅ Có        │
  ├─────────────────────────┼────────────────────┼──────────────┤
  │ 1.4 Ghép lại            │ ~2 giờ             │ ✅ Có        │
  └─────────────────────────┴────────────────────┴──────────────┘

  ---
  Bắt đầu từ đâu?

  Tôi đề xuất làm Sprint 1.1 trước vì:
  - Độc lập hoàn toàn, không phụ thuộc gì
  - Nếu segmentation lag → phát hiện sớm, điều chỉnh approach