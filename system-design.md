# System Design - SmartFit AR Virtual Try-On Fashion Website

## 1. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │   React.js   │  │  MediaPipe   │  │ Three.js │  │      WebRTC        │  │
│  │  (UI Layer)  │  │ (Pose/Body   │  │ (3D/AR   │  │  (Webcam Access)   │  │
│  │              │  │  Detection)  │  │ Overlay) │  │                    │  │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────────┬───────────┘  │
│         └─────────────────┴───────────────┴─────────────────┘              │
│                              │ HTTP/REST API                                │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (FastAPI)                               │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  /auth   │  │/products │  │  /tryon  │  │/wardrobe │  │   /social   │  │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │  │   Module    │  │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────┘  └─────────────┘  │
│                                   │                                         │
│  ┌─────────────────────┐  ┌───────┴──────┐  ┌──────────────────────────┐   │
│  │   /ai-stylist       │  │   /trends    │  │    Middleware Layer        │   │
│  │   Module            │  │   Module     │  │  (Auth, CORS, Logging)    │   │
│  └──────────┬──────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI SERVICES LAYER                                  │
│                                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Try-On Model  │  │  Skin Tone      │  │  Body Shape Classifier      │  │
│  │  (OOTDiffusion │  │  Analyzer       │  │  (Pose Estimation +         │  │
│  │  / VITON-HD)   │  │  (DeepFace +    │  │   Body Shape CNN)           │  │
│  │                │  │   CNN)          │  │                             │  │
│  └────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Clothing      │  │  Outfit         │  │  FAISS Vector Search        │  │
│  │  Classifier    │  │  Recommender    │  │  (Similar Product Search)   │  │
│  │  (ResNet50/    │  │  (Collaborative │  │                             │  │
│  │  EfficientNet) │  │   Filtering)    │  │                             │  │
│  └────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA & STORAGE LAYER                                   │
│                                                                             │
│  ┌─────────────────────────┐        ┌──────────────────────────────────┐   │
│  │       MySQL Database    │        │         Cloudinary CDN            │   │
│  │                         │        │                                  │   │
│  │  - users                │        │  - User photos (originals)       │   │
│  │  - products             │        │  - Product images                │   │
│  │  - wardrobe_items       │        │  - Try-on results                │   │
│  │  - outfits              │        │  - Social post images            │   │
│  │  - try_on_history       │        │  - Outfit export images          │   │
│  │  - user_analysis        │        │                                  │   │
│  │  - social_posts         │        └──────────────────────────────────┘   │
│  │  - trend_data           │                                               │
│  └─────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Luồng dữ liệu (Data Flow)

### 2.1 Luồng Try-On (Upload ảnh)

```
User uploads photo
      │
      ▼
React Frontend
  - Validate file (type, size)
  - Crop/resize nếu cần
  - Show loading state
      │
      ▼ POST /tryon/upload
FastAPI /tryon Module
  - Nhận multipart/form-data (user_photo + product_id)
  - Upload user_photo lên Cloudinary → nhận URL
  - Lấy product_image_url từ MySQL
      │
      ▼
Try-On AI Model (OOTDiffusion)
  - Input: user_photo_url + product_image_url
  - OpenCV: tiền xử lý ảnh (chuẩn hóa kích thước, tách nền)
  - MediaPipe: pose estimation → keypoints
  - Model inference → result_image
      │
      ▼
FastAPI
  - Upload result_image lên Cloudinary → result_url
  - Lưu try_on_history vào MySQL
  - Trả về { result_url, history_id }
      │
      ▼
React Frontend
  - Hiển thị result_image
  - Cho phép lưu vào wardrobe / chia sẻ social
```

### 2.2 Luồng AR Webcam (Thời gian thực)

```
User bật webcam
      │
      ▼
React Frontend (Browser)
  - WebRTC: capture video stream
  - MediaPipe JS: phát hiện body keypoints realtime (client-side)
  - Three.js: overlay clothing mesh lên video frame
  - Hiển thị trực tiếp trên canvas (không gửi lên server)
      │
      ▼ (Khi user muốn lưu)
POST /tryon/save-ar-result
FastAPI
  - Nhận base64 snapshot từ canvas
  - Upload lên Cloudinary
  - Lưu try_on_history
```

### 2.3 Luồng AI Stylist (Phân tích & Gợi ý)

```
User upload ảnh cá nhân
      │
      ▼ POST /ai-stylist/analyze
FastAPI /ai-stylist Module
      │
      ├─→ Skin Tone Analysis
      │     - DeepFace + CNN classifier
      │     - Output: fitzpatrick_level (1-6), season (Spring/Summer/Autumn/Winter)
      │
      ├─→ Body Shape Analysis
      │     - MediaPipe Pose Estimation → body keypoints
      │     - Body Shape CNN → shape (Apple/Pear/Hourglass/Rectangle/Inverted Triangle)
      │
      └─→ Lưu user_analysis vào MySQL
            │
            ▼ POST /ai-stylist/recommend
      Outfit Recommender
        - Input: skin_tone + body_shape + occasion + preferences
        - Collaborative Filtering → top-K outfit suggestions
        - FAISS vector search → similar products
        - Trả về danh sách outfit + products
```

### 2.4 Luồng Social (Chia sẻ & Tương tác)

```
User chọn try-on result để share
      │
      ▼ POST /social/posts
FastAPI /social Module
  - Tạo social_post record trong MySQL
  - Liên kết với try_on_history_id
  - Trả về post_id
      │
      ▼
Feed của người theo dõi
  GET /social/feed
  - Lấy posts từ những user được follow
  - Pagination: cursor-based
  - Trả về danh sách posts + user info + like_count + comment_count
```

### 2.5 Luồng Trend Dashboard

```
GET /trends?season=summer&year=2024
      │
      ▼
FastAPI /trends Module
  - Query trend_data từ MySQL
  - Aggregate theo màu sắc, phong cách, độ tuổi, khu vực
  - Trả về JSON với datasets cho Chart.js
      │
      ▼
React Frontend
  - Chart.js render biểu đồ cột, đường, radar
  - Bộ lọc: season, year, region, age_group
```

---

## 3. Cấu trúc các Layer

### 3.1 Client Layer (Browser)

| Component | Công nghệ | Trách nhiệm |
|-----------|-----------|-------------|
| UI Components | React.js + TailwindCSS | Render giao diện, xử lý tương tác người dùng |
| AR Engine | Three.js + WebRTC | Overlay quần áo lên webcam stream |
| Pose Detection | MediaPipe JS | Nhận diện body keypoints phía client |
| Data Visualization | Chart.js | Render biểu đồ trend |
| State Management | Zustand | Global state (user, wardrobe, tryon) |
| HTTP Client | Axios | Giao tiếp với Backend API |
| Routing | React Router v6 | Điều hướng trang |

### 3.2 Backend API Layer (FastAPI)

| Module | Path | Trách nhiệm |
|--------|------|-------------|
| Auth | `/auth` | Đăng ký, đăng nhập, quản lý session/token |
| Products | `/products` | CRUD sản phẩm, tìm kiếm, lọc |
| Try-On | `/tryon` | Xử lý try-on, lưu lịch sử |
| AI Stylist | `/ai-stylist` | Phân tích ảnh, gợi ý outfit |
| Wardrobe | `/wardrobe` | Quản lý tủ đồ cá nhân |
| Social | `/social` | Posts, likes, comments, follows |
| Trends | `/trends` | Dữ liệu xu hướng thời trang |

**Middleware:**
- `AuthMiddleware`: Xác thực JWT token
- `CORSMiddleware`: Cho phép frontend gọi API
- `LoggingMiddleware`: Log request/response
- `RateLimitMiddleware`: Giới hạn số request

### 3.3 AI Services Layer

| Service | Model | Framework |
|---------|-------|-----------|
| Try-On | OOTDiffusion / VITON-HD | HuggingFace + PyTorch |
| Skin Tone | CNN Classifier + DeepFace | PyTorch + DeepFace |
| Body Shape | MediaPipe Pose + CNN | MediaPipe + PyTorch |
| Clothing Classifier | ResNet50 / EfficientNet | Torchvision |
| Outfit Recommender | Collaborative Filtering | Scikit-learn |
| Similar Search | FAISS | FAISS + NumPy |

### 3.4 Data & Storage Layer

| Storage | Công nghệ | Dữ liệu lưu trữ |
|---------|-----------|-----------------|
| Relational DB | MySQL | Users, products, outfits, history, social data |
| Image CDN | Cloudinary | Ảnh người dùng, sản phẩm, kết quả try-on |
| Model Files | Local/Cloud Storage | File `.pth`, `.pkl` của các AI model |

---

## 4. Deployment Structure

### 4.1 Local Development

```
localhost:3000  →  React Dev Server (npm start)
                         │
                         │ HTTP (Axios)
                         ▼
localhost:8000  →  FastAPI (uvicorn)
                         │
                   ┌─────┴──────────┐
                   │                │
              localhost:3306    Cloudinary API
              MySQL (local)     (cloud service)
```

### 4.2 Production (Đề xuất)

```
                   ┌─────────────────┐
                   │  Domain/Nginx   │
                   │  (Reverse Proxy)│
                   └────────┬────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
     ┌────────▼────────┐        ┌──────────▼────────┐
     │  Static Hosting  │        │   FastAPI Server   │
     │  (React Build)   │        │   (uvicorn/gunicorn│
     │  Vercel / Nginx  │        │    on VPS/Cloud)   │
     └─────────────────┘        └──────────┬─────────┘
                                           │
                          ┌────────────────┼──────────────┐
                          │                │              │
                  ┌───────▼───────┐  ┌─────▼─────┐  ┌────▼─────┐
                  │  MySQL Server │  │ Cloudinary│  │ AI Model │
                  │  (VPS/Cloud)  │  │  (CDN)    │  │ Storage  │
                  └───────────────┘  └───────────┘  └──────────┘
```

---

## 5. Communication giữa các Service

### 5.1 Frontend ↔ Backend API

- **Protocol:** HTTP/HTTPS REST API
- **Format:** JSON (application/json)
- **Auth:** JWT Bearer Token trong Authorization header
- **Upload:** multipart/form-data cho file ảnh
- **Timeout:** 30 giây cho regular requests, 60 giây cho AI processing

### 5.2 Backend API ↔ AI Models

- **Cách tích hợp:** Import trực tiếp như Python module (cùng process)
- **AI Models** được load vào memory khi FastAPI khởi động
- **Inference:** Gọi hàm trực tiếp, không qua HTTP
- **Heavy tasks:** Có thể dùng `asyncio` để không block event loop

### 5.3 Backend API ↔ MySQL

- **Driver:** `mysql-connector-python` hoặc `SQLAlchemy`
- **Pool:** Connection pooling (min=5, max=20)
- **Queries:** Parameterized queries (chống SQL injection)

### 5.4 Backend API ↔ Cloudinary

- **SDK:** `cloudinary` Python SDK
- **Upload:** Gọi `cloudinary.uploader.upload(file)` → nhận URL
- **Transformation:** URL-based transformations (resize, crop, format)

---

## 6. Bảo mật

| Khía cạnh | Giải pháp |
|-----------|-----------|
| Authentication | JWT token (access token: 24h) |
| Password | bcrypt hashing |
| API Protection | JWT middleware trên tất cả private endpoints |
| File Upload | Validate MIME type, giới hạn file size 10MB |
| SQL Injection | Parameterized queries / ORM |
| CORS | Whitelist chỉ domain frontend |

---

## 7. Sơ đồ Component (Tóm tắt)

```
SmartFit System
├── Frontend (React)
│   ├── Pages (8 trang chính)
│   ├── Components (shared UI)
│   ├── Hooks (custom hooks)
│   ├── Store (Zustand)
│   └── Services (API calls via Axios)
│
├── Backend API (FastAPI)
│   ├── Routers (7 modules)
│   ├── Models (Pydantic schemas)
│   ├── Services (business logic)
│   ├── AI Services (model inference)
│   └── Database (MySQL connection)
│
└── Infrastructure
    ├── MySQL (structured data)
    └── Cloudinary (image storage)
```
