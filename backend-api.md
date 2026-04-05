# Backend API Design - SmartFit

**Framework:** FastAPI (Python)
**Base URL:** `http://localhost:8000/api/v1`
**Auth:** JWT Bearer Token (trừ các endpoint public)
**Docs:** Tự động tại `/docs` (Swagger UI)

---

## Quy ước chung

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>    # Bắt buộc với private endpoints
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

### Error Response
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Sản phẩm không tồn tại"
}
```

### HTTP Status Codes
| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Request không hợp lệ |
| 401 | Chưa đăng nhập |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 422 | Validation error |
| 500 | Lỗi server |

---

## Module 1: `/auth` – Xác thực người dùng

### POST `/auth/register`
**Mô tả:** Đăng ký tài khoản mới
**Auth:** Không cần

**Request Body:**
```json
{
  "username": "nguyen_van_a",
  "email": "nguyenvana@email.com",
  "password": "matkhau123",
  "full_name": "Nguyễn Văn A"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "nguyen_van_a",
    "email": "nguyenvana@email.com",
    "full_name": "Nguyễn Văn A",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Đăng ký thành công"
}
```

---

### POST `/auth/login`
**Mô tả:** Đăng nhập, nhận JWT token
**Auth:** Không cần

**Request Body:**
```json
{
  "username": "nguyen_van_a",
  "password": "matkhau123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "nguyen_van_a",
      "email": "nguyenvana@email.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": null,
      "role": "user"
    }
  }
}
```

---

### POST `/auth/logout`
**Mô tả:** Đăng xuất (invalidate token phía client)
**Auth:** Bắt buộc

**Response 200:**
```json
{ "success": true, "message": "Đã đăng xuất" }
```

---

### GET `/auth/me`
**Mô tả:** Lấy thông tin user hiện tại
**Auth:** Bắt buộc

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "nguyen_van_a",
    "email": "nguyenvana@email.com",
    "full_name": "Nguyễn Văn A",
    "avatar_url": "https://res.cloudinary.com/.../avatar.jpg",
    "bio": "Yêu thích thời trang",
    "role": "user",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### PUT `/auth/me`
**Mô tả:** Cập nhật thông tin cá nhân
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn An",
  "bio": "Đam mê streetwear"
}
```

**Response 200:** Trả về thông tin user đã cập nhật

---

### POST `/auth/avatar`
**Mô tả:** Upload ảnh đại diện
**Auth:** Bắt buộc
**Content-Type:** multipart/form-data

**Request:** Form field `avatar` (file ảnh, tối đa 5MB)

**Response 200:**
```json
{
  "success": true,
  "data": { "avatar_url": "https://res.cloudinary.com/.../avatar.jpg" }
}
```

---

## Module 2: `/products` – Quản lý sản phẩm

### GET `/products`
**Mô tả:** Lấy danh sách sản phẩm với lọc và phân trang
**Auth:** Không cần

**Query Params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `page` | int | Trang hiện tại (default: 1) |
| `limit` | int | Số item/trang (default: 20, max: 100) |
| `category_id` | int | Lọc theo danh mục |
| `gender` | string | `male`, `female`, `unisex` |
| `style` | string | `casual`, `formal`, `sport`, `streetwear`, `vintage`, `party` |
| `color` | string | Tên màu (vd: `red`, `blue`) |
| `min_price` | float | Giá thấp nhất |
| `max_price` | float | Giá cao nhất |
| `search` | string | Tìm theo tên/mô tả |
| `sort` | string | `price_asc`, `price_desc`, `newest`, `popular` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Áo phông basic",
        "brand": "Local Brand",
        "price": 250000,
        "gender": "unisex",
        "style": "casual",
        "primary_color": "white",
        "color_hex": "#FFFFFF",
        "image_url": "https://res.cloudinary.com/.../product1.jpg",
        "category": { "id": 6, "name": "Áo phông", "slug": "ao-phong" },
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

### GET `/products/{product_id}`
**Mô tả:** Lấy chi tiết 1 sản phẩm
**Auth:** Không cần

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Áo phông basic",
    "description": "Áo phông cotton 100%, thoáng mát",
    "brand": "Local Brand",
    "price": 250000,
    "gender": "unisex",
    "style": "casual",
    "primary_color": "white",
    "color_hex": "#FFFFFF",
    "size_options": ["XS", "S", "M", "L", "XL"],
    "material": "Cotton 100%",
    "image_url": "https://res.cloudinary.com/.../product1.jpg",
    "image_urls": ["url1", "url2", "url3"],
    "category": { "id": 6, "name": "Áo phông" },
    "is_available": true,
    "view_count": 342,
    "created_at": "2024-01-10T08:00:00Z"
  }
}
```

---

### GET `/products/{product_id}/similar`
**Mô tả:** Tìm sản phẩm tương tự bằng FAISS vector search
**Auth:** Không cần

**Query Params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `limit` | int | Số sản phẩm tương tự (default: 10) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "similar_products": [ /* danh sách products */ ],
    "search_time_ms": 45
  }
}
```

---

### POST `/products/search-by-image`
**Mô tả:** Upload ảnh quần áo → tìm sản phẩm tương tự
**Auth:** Bắt buộc
**Content-Type:** multipart/form-data

**Request:** Form field `image` (file ảnh)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "similar_products": [ /* top 10 sản phẩm tương tự */ ],
    "search_time_ms": 120
  }
}
```

---

### GET `/products/categories`
**Mô tả:** Lấy danh sách danh mục sản phẩm
**Auth:** Không cần

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "name": "Áo", "slug": "ao", "parent_id": null,
      "children": [
        { "id": 6, "name": "Áo phông", "slug": "ao-phong" },
        { "id": 7, "name": "Áo sơ mi", "slug": "ao-so-mi" }
      ]
    }
  ]
}
```

---

## Module 3: `/tryon` – Thử đồ ảo

### POST `/tryon/upload`
**Mô tả:** Upload ảnh người dùng + chọn sản phẩm → xử lý try-on bằng AI
**Auth:** Bắt buộc
**Content-Type:** multipart/form-data

**Request:**
- `user_photo` (file): Ảnh người dùng full body
- `product_id` (int): ID sản phẩm muốn thử

**Response 200:**
```json
{
  "success": true,
  "data": {
    "history_id": 42,
    "result_url": "https://res.cloudinary.com/.../tryon_result.jpg",
    "user_photo_url": "https://res.cloudinary.com/.../user_photo.jpg",
    "product_id": 1,
    "processing_time": 7.3,
    "created_at": "2024-01-15T10:05:00Z"
  }
}
```

---

### POST `/tryon/save-ar-result`
**Mô tả:** Lưu kết quả AR webcam (snapshot từ canvas)
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "product_id": 1
}
```

**Response 201:** Tương tự `/tryon/upload`

---

### GET `/tryon/history`
**Mô tả:** Lấy lịch sử try-on của user hiện tại
**Auth:** Bắt buộc

**Query Params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `page` | int | Trang (default: 1) |
| `limit` | int | Số item/trang (default: 20) |
| `product_id` | int | Lọc theo sản phẩm |
| `method` | string | `upload` hoặc `webcam` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "product": { "id": 1, "name": "Áo phông basic", "image_url": "..." },
        "result_url": "https://res.cloudinary.com/.../result.jpg",
        "method": "upload",
        "processing_time": 7.3,
        "created_at": "2024-01-15T10:05:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
  }
}
```

---

### DELETE `/tryon/history/{history_id}`
**Mô tả:** Xóa 1 mục lịch sử try-on
**Auth:** Bắt buộc (chỉ owner)

**Response 200:**
```json
{ "success": true, "message": "Đã xóa" }
```

---

## Module 4: `/ai-stylist` – Gợi ý AI

### POST `/ai-stylist/analyze`
**Mô tả:** Phân tích màu da và vóc dáng từ ảnh cá nhân
**Auth:** Bắt buộc
**Content-Type:** multipart/form-data

**Request:** Form field `photo` (ảnh full body)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "analysis_id": 10,
    "skin_tone": {
      "fitzpatrick_level": 3,
      "description": "Medium beige",
      "color_season": "Autumn",
      "recommended_colors": ["#8B4513", "#D2691E", "#CD853F", "#DAA520"]
    },
    "body_shape": {
      "shape": "Hourglass",
      "description": "Vòng eo thon, hông và vai cân đối",
      "style_tips": [
        "Chọn váy ôm thân tôn đường cong",
        "Belt / thắt lưng nhấn eo"
      ]
    },
    "photo_url": "https://res.cloudinary.com/.../analysis_photo.jpg",
    "created_at": "2024-01-15T10:10:00Z"
  }
}
```

---

### POST `/ai-stylist/recommend`
**Mô tả:** Gợi ý outfit dựa trên kết quả phân tích + dịp mặc
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "analysis_id": 10,
  "occasion": "party",
  "preferences": ["minimalist", "feminine"],
  "limit": 5
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "outfits": [
      {
        "rank": 1,
        "score": 0.92,
        "items": [
          { "product_id": 15, "name": "Váy wrap đỏ", "image_url": "...", "category": "Váy" },
          { "product_id": 88, "name": "Giày cao gót nude", "image_url": "...", "category": "Giày" }
        ],
        "reason": "Màu đỏ nổi bật phù hợp với tone da Autumn, kiểu wrap tôn vóc dáng Hourglass"
      }
    ]
  }
}
```

---

### GET `/ai-stylist/analysis-history`
**Mô tả:** Lấy lịch sử phân tích của user
**Auth:** Bắt buộc

**Response 200:** Danh sách các `user_analysis` records

---

### GET `/ai-stylist/color-palette`
**Mô tả:** Lấy bảng màu gợi ý dựa trên mùa màu
**Auth:** Không cần

**Query Params:** `season` (Spring/Summer/Autumn/Winter)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "season": "Autumn",
    "primary_colors": ["#8B4513", "#D2691E"],
    "neutral_colors": ["#F5DEB3", "#DEB887"],
    "accent_colors": ["#228B22", "#556B2F"],
    "avoid_colors": ["#FF69B4", "#00FFFF"]
  }
}
```

---

## Module 5: `/wardrobe` – Tủ đồ ảo

### GET `/wardrobe`
**Mô tả:** Lấy danh sách tủ đồ của user
**Auth:** Bắt buộc

**Query Params:** `category_id`, `page`, `limit`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "product": {
          "id": 1, "name": "Áo phông basic",
          "image_url": "...", "category": { "id": 6, "name": "Áo phông" }
        },
        "notes": "Mặc đi dạo",
        "added_at": "2024-01-15T09:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 12, "total_pages": 1 }
  }
}
```

---

### POST `/wardrobe`
**Mô tả:** Thêm sản phẩm vào tủ đồ
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "product_id": 1,
  "notes": "Mặc đi dạo"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "wardrobe_item_id": 5 },
  "message": "Đã thêm vào tủ đồ"
}
```

---

### DELETE `/wardrobe/{wardrobe_item_id}`
**Mô tả:** Xóa sản phẩm khỏi tủ đồ
**Auth:** Bắt buộc

**Response 200:** `{ "success": true, "message": "Đã xóa khỏi tủ đồ" }`

---

### GET `/wardrobe/outfits`
**Mô tả:** Lấy danh sách outfit đã lưu
**Auth:** Bắt buộc

**Query Params:** `occasion`, `page`, `limit`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 3,
        "name": "Outfit đi làm",
        "occasion": "formal",
        "preview_url": "...",
        "is_public": false,
        "items_count": 3,
        "created_at": "2024-01-14T08:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### POST `/wardrobe/outfits`
**Mô tả:** Tạo outfit mới từ các item trong tủ đồ
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "name": "Outfit đi làm",
  "description": "Phong cách công sở",
  "occasion": "formal",
  "is_public": false,
  "wardrobe_item_ids": [5, 8, 12],
  "layer_orders": [0, 1, 2]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "outfit_id": 3 },
  "message": "Đã tạo outfit"
}
```

---

### GET `/wardrobe/outfits/{outfit_id}`
**Mô tả:** Lấy chi tiết outfit
**Auth:** Bắt buộc

**Response 200:** Chi tiết outfit + danh sách items đầy đủ

---

### PUT `/wardrobe/outfits/{outfit_id}`
**Mô tả:** Cập nhật outfit
**Auth:** Bắt buộc

**Request Body:** Các field cần cập nhật (tương tự POST)

**Response 200:** Outfit đã cập nhật

---

### DELETE `/wardrobe/outfits/{outfit_id}`
**Mô tả:** Xóa outfit
**Auth:** Bắt buộc

---

### POST `/wardrobe/outfits/{outfit_id}/export`
**Mô tả:** Xuất outfit ra ảnh/PDF
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "format": "image",
  "include_product_names": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "export_url": "https://res.cloudinary.com/.../outfit_export.jpg" }
}
```

---

## Module 6: `/social` – Tính năng xã hội

### GET `/social/feed`
**Mô tả:** Lấy feed bài đăng từ người đang follow
**Auth:** Bắt buộc

**Query Params:** `cursor` (ID cursor cho pagination), `limit` (default: 20)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 100,
        "user": { "id": 5, "username": "fashionista", "avatar_url": "..." },
        "image_url": "https://res.cloudinary.com/.../post.jpg",
        "caption": "Outfit hôm nay #ootd",
        "tags": ["#ootd", "#streetwear"],
        "like_count": 42,
        "comment_count": 8,
        "is_liked": false,
        "created_at": "2024-01-15T09:00:00Z"
      }
    ],
    "next_cursor": 95
  }
}
```

---

### GET `/social/posts/{post_id}`
**Mô tả:** Lấy chi tiết 1 bài đăng
**Auth:** Không cần (nếu post public)

**Response 200:** Chi tiết post + user info

---

### POST `/social/posts`
**Mô tả:** Tạo bài đăng mới
**Auth:** Bắt buộc
**Content-Type:** multipart/form-data

**Request:**
- `image` (file): Ảnh bài đăng
- `caption` (string): Chú thích
- `tags` (string): JSON array tags
- `try_on_id` (int, optional): Liên kết với lịch sử try-on

**Response 201:**
```json
{
  "success": true,
  "data": { "post_id": 100 },
  "message": "Đã đăng bài"
}
```

---

### DELETE `/social/posts/{post_id}`
**Mô tả:** Xóa bài đăng
**Auth:** Bắt buộc (chỉ owner)

---

### POST `/social/posts/{post_id}/like`
**Mô tả:** Thích bài đăng
**Auth:** Bắt buộc

**Response 200:**
```json
{
  "success": true,
  "data": { "like_count": 43, "is_liked": true }
}
```

---

### DELETE `/social/posts/{post_id}/like`
**Mô tả:** Bỏ thích bài đăng
**Auth:** Bắt buộc

**Response 200:**
```json
{
  "success": true,
  "data": { "like_count": 42, "is_liked": false }
}
```

---

### GET `/social/posts/{post_id}/comments`
**Mô tả:** Lấy danh sách bình luận của bài đăng
**Auth:** Không cần

**Query Params:** `page`, `limit`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 200,
        "user": { "id": 3, "username": "user3", "avatar_url": "..." },
        "content": "Đẹp quá!",
        "parent_id": null,
        "created_at": "2024-01-15T10:00:00Z",
        "replies": [
          {
            "id": 201,
            "user": { "id": 5, "username": "fashionista", "avatar_url": "..." },
            "content": "Cảm ơn bạn!",
            "parent_id": 200,
            "created_at": "2024-01-15T10:05:00Z"
          }
        ]
      }
    ],
    "pagination": { ... }
  }
}
```

---

### POST `/social/posts/{post_id}/comments`
**Mô tả:** Đăng bình luận
**Auth:** Bắt buộc

**Request Body:**
```json
{
  "content": "Đẹp quá!",
  "parent_id": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "comment_id": 200 }
}
```

---

### DELETE `/social/comments/{comment_id}`
**Mô tả:** Xóa bình luận
**Auth:** Bắt buộc (chỉ owner)

---

### POST `/social/follow/{user_id}`
**Mô tả:** Follow người dùng
**Auth:** Bắt buộc

**Response 200:**
```json
{
  "success": true,
  "data": { "following": true, "follower_count": 125 }
}
```

---

### DELETE `/social/follow/{user_id}`
**Mô tả:** Unfollow người dùng
**Auth:** Bắt buộc

---

### GET `/social/users/{user_id}/profile`
**Mô tả:** Lấy trang cá nhân của user
**Auth:** Không cần

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5, "username": "fashionista",
      "full_name": "Fashion Star",
      "avatar_url": "...", "bio": "...",
      "follower_count": 125, "following_count": 80,
      "post_count": 42,
      "is_following": false
    },
    "recent_posts": [ /* 6 posts mới nhất */ ]
  }
}
```

---

## Module 7: `/trends` – Xu hướng thời trang

### GET `/trends`
**Mô tả:** Lấy dữ liệu xu hướng tổng quan
**Auth:** Không cần

**Query Params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `season` | string | `Spring`, `Summer`, `Autumn`, `Winter` |
| `year` | int | Năm (vd: 2024) |
| `gender` | string | `male`, `female`, `all` |
| `region` | string | `Hanoi`, `HCM`, `All` |
| `age_group` | string | `18-24`, `25-34`, `35-44` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "season": "Summer",
    "year": 2024,
    "top_styles": [
      { "style": "minimalist", "score": 87.5, "change": "+5.2%" },
      { "style": "streetwear", "score": 82.3, "change": "+12.1%" }
    ],
    "top_colors": [
      { "color_name": "Sage Green", "color_hex": "#87AE73", "score": 91.0 },
      { "color_name": "Butter Yellow", "color_hex": "#FFFD82", "score": 78.5 }
    ],
    "top_categories": [
      { "category": "Áo phông", "score": 95.2 }
    ]
  }
}
```

---

### GET `/trends/chart-data`
**Mô tả:** Lấy dữ liệu dạng series cho Chart.js
**Auth:** Không cần

**Query Params:** `type` (`color_trend`, `style_trend`, `category_trend`), `year`, `gender`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "labels": ["Spring 2024", "Summer 2024", "Autumn 2024", "Winter 2024"],
    "datasets": [
      {
        "label": "Minimalist",
        "data": [72.1, 87.5, 83.2, 68.9],
        "borderColor": "#4A90D9"
      }
    ]
  }
}
```

---

### GET `/trends/predictions`
**Mô tả:** Dự đoán xu hướng mùa tới
**Auth:** Không cần

**Query Params:** `season`, `year`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "predicted_season": "Autumn 2025",
    "predicted_styles": ["quiet luxury", "dark academia"],
    "predicted_colors": [
      { "color_name": "Burgundy", "color_hex": "#800020", "confidence": 0.82 }
    ]
  }
}
```

---

## Tổng hợp Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/auth/register` | No | Đăng ký |
| POST | `/auth/login` | No | Đăng nhập |
| POST | `/auth/logout` | Yes | Đăng xuất |
| GET | `/auth/me` | Yes | Thông tin cá nhân |
| PUT | `/auth/me` | Yes | Cập nhật cá nhân |
| POST | `/auth/avatar` | Yes | Upload avatar |
| GET | `/products` | No | Danh sách sản phẩm |
| GET | `/products/{id}` | No | Chi tiết sản phẩm |
| GET | `/products/{id}/similar` | No | Sản phẩm tương tự |
| POST | `/products/search-by-image` | Yes | Tìm theo ảnh |
| GET | `/products/categories` | No | Danh mục |
| POST | `/tryon/upload` | Yes | Try-on bằng ảnh |
| POST | `/tryon/save-ar-result` | Yes | Lưu kết quả AR |
| GET | `/tryon/history` | Yes | Lịch sử try-on |
| DELETE | `/tryon/history/{id}` | Yes | Xóa lịch sử |
| POST | `/ai-stylist/analyze` | Yes | Phân tích ảnh |
| POST | `/ai-stylist/recommend` | Yes | Gợi ý outfit |
| GET | `/ai-stylist/analysis-history` | Yes | Lịch sử phân tích |
| GET | `/ai-stylist/color-palette` | No | Bảng màu theo mùa |
| GET | `/wardrobe` | Yes | Tủ đồ |
| POST | `/wardrobe` | Yes | Thêm vào tủ đồ |
| DELETE | `/wardrobe/{id}` | Yes | Xóa khỏi tủ đồ |
| GET | `/wardrobe/outfits` | Yes | Danh sách outfit |
| POST | `/wardrobe/outfits` | Yes | Tạo outfit |
| GET | `/wardrobe/outfits/{id}` | Yes | Chi tiết outfit |
| PUT | `/wardrobe/outfits/{id}` | Yes | Cập nhật outfit |
| DELETE | `/wardrobe/outfits/{id}` | Yes | Xóa outfit |
| POST | `/wardrobe/outfits/{id}/export` | Yes | Xuất outfit |
| GET | `/social/feed` | Yes | Feed bài đăng |
| GET | `/social/posts/{id}` | No | Chi tiết bài đăng |
| POST | `/social/posts` | Yes | Đăng bài |
| DELETE | `/social/posts/{id}` | Yes | Xóa bài |
| POST | `/social/posts/{id}/like` | Yes | Thích |
| DELETE | `/social/posts/{id}/like` | Yes | Bỏ thích |
| GET | `/social/posts/{id}/comments` | No | Bình luận |
| POST | `/social/posts/{id}/comments` | Yes | Đăng bình luận |
| DELETE | `/social/comments/{id}` | Yes | Xóa bình luận |
| POST | `/social/follow/{user_id}` | Yes | Follow |
| DELETE | `/social/follow/{user_id}` | Yes | Unfollow |
| GET | `/social/users/{id}/profile` | No | Trang cá nhân |
| GET | `/trends` | No | Xu hướng tổng quan |
| GET | `/trends/chart-data` | No | Dữ liệu biểu đồ |
| GET | `/trends/predictions` | No | Dự đoán xu hướng |
