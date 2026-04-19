# SmartFit - AR Virtual Try-On Fashion Website

## Tổng quan dự án

SmartFit là ứng dụng web thời trang tích hợp AI và AR, cho phép người dùng thử quần áo ảo theo thời gian thực, nhận tư vấn phong cách cá nhân hóa và khám phá xu hướng thời trang.

---

## Các chức năng chính

### 1. AI Stylist — Gợi ý trang phục dựa trên ảnh người dùng

**Mô tả:** Phân tích tông da và vóc dáng từ ảnh chụp, sau đó gợi ý trang phục phù hợp.

**Công nghệ sử dụng:**
- **PyTorch + EfficientNet-B0** (CNN pre-trained): Phân loại tông da (Light / Medium / Dark), chuyển đổi sang mùa màu (Winter / Summer / Autumn / Spring)
- **MediaPipe Pose** (Python backend): Trích xuất 33 điểm landmark cơ thể từ ảnh
- **XGBoost** (scikit-learn): Phân loại vóc dáng (hourglass, pear, apple, rectangle, inverted triangle) dựa trên tỉ lệ vai / hông / cổ chân
- **KMeans / Heuristic**: Dự phòng khi mô hình CNN không đủ tin cậy
- **Cloudinary**: Lưu trữ ảnh người dùng upload lên cloud
- **MySQL**: Truy vấn sản phẩm phù hợp theo mùa màu, dịp mặc (casual/formal/party/sport), giới tính

**Luồng xử lý:**
1. Người dùng upload ảnh → backend nhận ảnh
2. EfficientNet phân tích tông da → xác định mùa màu
3. MediaPipe + XGBoost phân tích vóc dáng
4. Query database lọc sản phẩm theo màu sắc phù hợp, dịp mặc, giới tính
5. Trả về danh sách gợi ý kèm mô tả phong cách

---

### 2. Virtual Try-On — Thử quần áo ảo theo thời gian thực

**Mô tả:** Dùng webcam để thử quần áo ảo ngay trên trình duyệt, hình ảnh quần áo được phủ lên cơ thể người dùng theo thời gian thực.

**Công nghệ sử dụng:**
- **MediaPipe Pose (Web CDN)**: Phát hiện 33 điểm landmark xương cơ thể trong trình duyệt (JavaScript)
- **WebRTC / getUserMedia**: Truy cập camera trực tiếp trên trình duyệt
- **Canvas 2D API**: Render hình ảnh quần áo lên video stream
- **clothingWarper.js** (custom algorithm):
  - Tính toán bounding box quần áo từ landmark vai và hông
  - Làm mượt chuyển động (temporal smoothing, alpha=0.25)
  - Biến dạng hình thang (trapezoid warp, 20 strips) để tạo hiệu ứng phối cảnh
- **Cloudinary**: Lưu kết quả AR (ảnh chụp màn hình thử đồ) lên cloud
- **React + Zustand**: Quản lý state webcam, sản phẩm đang thử, lịch sử

**Thuật toán warp theo loại trang phục:**
| Loại | Điểm landmark | Hệ số padding |
|------|--------------|---------------|
| Áo (TOP) | Vai → Hông | width ×2.35 |
| Quần (BOTTOM) | Hông → Cổ chân | width ×1.45 |
| Váy (SKIRT) | Hông → Cổ chân | width ×1.7 (xòe) |
| Áo khoác (JACKET) | Vai → Hông | width ×2.35 |

---

### 3. Nhận diện Pose — Hỗ trợ Try-On chính xác hơn

**Mô tả:** Phát hiện tư thế người dùng để xác định vị trí đặt quần áo ảo chính xác.

**Công nghệ sử dụng:**
- **MediaPipe Pose Tasks API** (Python, backend): Sử dụng model `pose_landmarker_full.task` (~30MB), phát hiện 33 landmark 3D
- **MediaPipe Pose Legacy API** (JavaScript, browser): Sử dụng `pose_landmarker_lite.task` (~5MB), chạy trực tiếp trên trình duyệt
- **OpenCV** (`pose.py`): Kiểm tra pose detection qua webcam ngoài browser
- **Landmark quan trọng**: Vai (11, 12), Hông (23, 24), Đầu gối (25, 26), Cổ chân (27, 28)
- **Visibility threshold**: 0.3 — bỏ qua landmark bị che khuất

---

### 4. Nhận diện loại quần áo (Admin — Upload sản phẩm)

**Mô tả:** Khi admin upload ảnh sản phẩm, hệ thống tự động nhận diện loại quần áo (áo, quần, váy, áo khoác, đồng hồ...).

**Công nghệ sử dụng:**
- **PyTorch + EfficientNet-B0**: Model CNN được fine-tune để phân loại trang phục
- **Cloudinary**: Lưu trữ ảnh sản phẩm
- **FastAPI** endpoint `/upload`: Nhận ảnh, chạy inference, trả về loại sản phẩm
- **MySQL**: Lưu kết quả phân loại vào bảng `products` (category_id)

**Các nhãn phân loại:**
- Áo phông, Áo sơ mi, Áo khoác, Quần jeans, Quần âu, Váy, Giày, Phụ kiện, Đồng hồ

**Phân loại vóc dáng (Body Shape):**

| Vóc dáng | Mô tả | Gợi ý trang phục |
|-----------|-------|------------------|
| **Hourglass** (Đồng hồ cát) | Vai và hông cân đối, eo thon | Váy wrap, Blazer ôm, Quần high-waist, Váy bút chì |
| **Pear** (Quả lê) | Hông rộng hơn vai | Áo off-shoulder, Váy A-line, Quần wide-leg, Áo có chi tiết cổ |
| **Apple** (Quả táo) | Vai rộng, phần trên cơ thể to hơn | Áo empire waist, Áo cổ V, Váy maxi, Quần wide-leg |
| **Rectangle** (Hình chữ nhật) | Vai, eo và hông gần bằng nhau | Belt tạo đường cong, Áo ruffled, Chân váy peplum, Quần boyfriend |
| **Inverted Triangle** (Tam giác ngược) | Vai rộng hơn hông | Váy A-line, Quần flared, Váy xòe, Áo cổ tròn nhỏ |

**Luồng phân tích vóc dáng (3 bước fallback):**
1. **MediaPipe Pose** trích xuất landmark → **XGBoost** phân loại (ưu tiên)
2. **Heuristic**: So sánh tỉ lệ phần trên/dưới ảnh (grayscale spread ratio)
3. **Mặc định**: `rectangle` nếu cả 2 bước trên thất bại

---

### 5. Xu hướng thời trang — Crawl & Gợi ý

**Mô tả:** Thu thập dữ liệu về các loại quần áo phổ biến hiện nay để gợi ý cho người dùng.

**Công nghệ sử dụng:**
- **Web Scraping / API crawl**: Thu thập xu hướng thời trang từ nguồn dữ liệu bên ngoài
- **MySQL** (bảng `trends`): Lưu trữ dữ liệu xu hướng
- **FastAPI** route `/trends`: Cung cấp API cho frontend
- **React Query (TanStack)**: Cache và đồng bộ dữ liệu xu hướng trên frontend

---

## Stack công nghệ tổng hợp

### Backend (Python)
| Thư viện | Mục đích |
|----------|----------|
| **FastAPI** | Web framework, REST API |
| **MySQL + mysql-connector** | Cơ sở dữ liệu |
| **PyTorch + EfficientNet-B0** | Phân tích tông da, vóc dáng, nhận diện quần áo |
| **MediaPipe** | Pose detection (landmark cơ thể) |
| **scikit-learn + XGBoost** | Phân loại vóc dáng |
| **Cloudinary** | Lưu trữ ảnh trên cloud |
| **bcrypt + python-jose** | Xác thực, mã hóa mật khẩu, JWT |
| **Pillow (PIL)** | Xử lý ảnh |

### Frontend (JavaScript)
| Thư viện | Mục đích |
|----------|----------|
| **React 19 + Vite** | UI framework, build tool |
| **TailwindCSS** | Styling |
| **MediaPipe Web (CDN)** | Pose detection trong trình duyệt |
| **Canvas 2D API** | Render AR try-on |
| **Zustand** | State management (auth, try-on) |
| **React Query (TanStack)** | Fetch và cache dữ liệu |
| **Axios** | HTTP client, tự động gắn JWT |
| **react-router-dom** | Client-side routing |
| **Lucide React** | Icon library |
| **react-hot-toast** | Thông báo toast |
| **react-dropzone** | Upload ảnh kéo thả |

### Database
- **MySQL 8.0+**: Users, Products, Categories, Try-on History, User Analysis, Wardrobe, Trends

### Cloud & API
- **Cloudinary**: Lưu ảnh người dùng, kết quả AR, ảnh sản phẩm

---

## Kiến trúc hệ thống

```
[Browser]
  │
  ├── React App (Vite)
  │     ├── MediaPipe Web (CDN) → Pose detection real-time
  │     ├── Canvas API → Render quần áo ảo lên webcam
  │     └── Axios → Gọi REST API backend
  │
  ▼
[FastAPI Backend :8000]
  │
  ├── /ai-stylist   → EfficientNet + XGBoost → phân tích người dùng
  ├── /tryon        → Lưu kết quả AR → Cloudinary
  ├── /upload       → EfficientNet → nhận diện loại quần áo
  ├── /trends       → Dữ liệu xu hướng
  ├── /products     → Catalog sản phẩm
  └── /auth         → JWT authentication
  │
  ├── MySQL Database
  └── Cloudinary (ảnh)
```

---

## Xác thực & Bảo mật
- **JWT (JSON Web Token)**: Token hết hạn sau 24 giờ, lưu trong localStorage
- **bcrypt**: Mã hóa mật khẩu người dùng
- **Protected Routes**: Frontend kiểm tra token trước khi cho phép vào trang yêu cầu đăng nhập
