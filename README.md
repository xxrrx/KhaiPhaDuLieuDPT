# SmartFit - AR Virtual Try-On Fashion Website

Ứng dụng thời trang thông minh cho phép người dùng thử đồ ảo qua webcam (AR), phân tích vóc dáng & tông da bằng AI, quản lý tủ đồ cá nhân và theo dõi xu hướng thời trang.

## Tính năng chính

- **AR Virtual Try-On** — thử quần áo qua webcam thời gian thực
- **AI Stylist** — phân tích vóc dáng, tông da và gợi ý outfit phù hợp
- **Tủ đồ cá nhân** — lưu và quản lý wardrobe
- **Social Feed** — chia sẻ outfit, like & comment
- **Xu hướng thời trang** — theo dõi color trends và style trends
- **Danh mục sản phẩm** — duyệt & tìm kiếm sản phẩm

## Công nghệ sử dụng

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TailwindCSS, Zustand, React Query |
| Backend | FastAPI (Python), MySQL 8.0 |
| AI Models | PyTorch, scikit-learn (phân loại vóc dáng, tông da, outfit) |
| Lưu trữ ảnh | Cloudinary |
| Auth | JWT |

## Cấu trúc dự án

```
KhaiPhaDuLieuDPT/
├── backend/
│   ├── app/
│   │   ├── ai_models/         # File model AI (.pkl, .pth)
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── models/            # Pydantic schemas
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── seed_products.py       # Script seed dữ liệu mẫu
│   └── .env                   # Biến môi trường (không commit)
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Các trang chính
│   │   ├── store/             # Zustand state
│   │   └── App.jsx
│   └── package.json
└── notebooks/                 # Jupyter notebooks (training AI models)
```

## Yêu cầu hệ thống

- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- Tài khoản Cloudinary (miễn phí)

---

## Hướng dẫn cài đặt & chạy

### 1. Clone dự án

```bash
git clone <repo-url>
cd KhaiPhaDuLieuDPT
```

### 2. Cài đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường Backend

Tạo file `backend/.env` từ file mẫu:

```bash
cp .env.example .env
```

Chỉnh sửa `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartfit

# JWT (đổi thành chuỗi ngẫu nhiên dài)
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# Cloudinary (lấy từ https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Tạo database MySQL

```sql
CREATE DATABASE smartfit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Xem schema chi tiết trong file `database.md`.

### 5. Seed dữ liệu mẫu (tùy chọn)

```bash
cd backend
python seed_products.py
```

### 6. Chạy Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API sẽ chạy tại: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

---

### 7. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 8. Cấu hình Frontend (tùy chọn)

Mặc định frontend gọi API tại `http://localhost:8000`. Nếu cần đổi, tạo file `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 9. Chạy Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## Chạy toàn bộ dự án

Mở 2 terminal:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate   # hoặc source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Truy cập ứng dụng tại `http://localhost:5173`.

---

## API Endpoints

| Module | Prefix | Mô tả |
|---|---|---|
| Auth | `/api/v1/auth` | Đăng ký, đăng nhập, JWT |
| Products | `/api/v1/products` | Danh mục sản phẩm |
| Try-On | `/api/v1/tryon` | Lịch sử thử đồ AR |
| Wardrobe | `/api/v1/wardrobe` | Tủ đồ cá nhân |
| AI Stylist | `/api/v1/ai-stylist` | Phân tích vóc dáng & tông da |
| Social | `/api/v1/social` | Feed, post, like, comment |
| Trends | `/api/v1/trends` | Xu hướng thời trang |
| Upload | `/api/v1/upload` | Upload ảnh lên Cloudinary |

Xem chi tiết trong file `backend-api.md` hoặc Swagger UI tại `/docs`.

## Tài liệu bổ sung

- `system-design.md` — Kiến trúc hệ thống
- `database.md` — Schema database
- `backend-api.md` — Tài liệu API chi tiết
- `frontend.md` — Tài liệu frontend
- `requirement.md` — Yêu cầu hệ thống
- `notebooks/` — Jupyter notebooks training AI models
