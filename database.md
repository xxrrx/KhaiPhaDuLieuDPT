# Database Design - SmartFit

**DBMS:** MySQL 8.0+
**Charset:** utf8mb4
**Collation:** utf8mb4_unicode_ci

---

## 1. ERD (Text Format)

```
users ──────────────────────────────────────────────────────────┐
  │                                                             │
  ├──< wardrobe_items >──── products >──── categories          │
  │                                                             │
  ├──< outfits >──< outfit_items >──────── wardrobe_items       │
  │                                                             │
  ├──< try_on_history >───── products                          │
  │                                                             │
  ├──< user_analysis                                           │
  │                                                             │
  ├──< social_posts >──< likes                                 │
  │         └────────< comments                                │
  │                                                             │
  ├──< follows (follower_id → user_id)                         │
  │                                                             │
  └─────────────────────────────────────────────────────────── ┘

trend_data (standalone, không FK đến users)
```

---

## 2. CREATE TABLE Statements

### 2.1 Bảng `users`

```sql
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    role            ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_email    (email),
    INDEX idx_role     (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Bảng `categories`

```sql
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    parent_id   INT UNSIGNED DEFAULT NULL,
    icon_url    VARCHAR(500),
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug      (slug),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data
INSERT INTO categories (name, slug, parent_id) VALUES
('Áo', 'ao', NULL),
('Quần', 'quan', NULL),
('Váy', 'vay', NULL),
('Giày', 'giay', NULL),
('Phụ kiện', 'phu-kien', NULL),
('Áo phông', 'ao-phong', 1),
('Áo sơ mi', 'ao-so-mi', 1),
('Áo khoác', 'ao-khoac', 1),
('Quần jeans', 'quan-jeans', 2),
('Quần âu', 'quan-au', 2);
```

### 2.3 Bảng `products`

```sql
CREATE TABLE products (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id     INT UNSIGNED NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    brand           VARCHAR(100),
    price           DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    gender          ENUM('male', 'female', 'unisex') NOT NULL DEFAULT 'unisex',
    style           VARCHAR(50),        -- casual, formal, sport, streetwear, vintage, party
    primary_color   VARCHAR(50),        -- tên màu chính
    color_hex       VARCHAR(7),         -- mã hex màu chính (#RRGGBB)
    size_options    JSON,               -- ["XS","S","M","L","XL","XXL"]
    material        VARCHAR(100),
    image_url       VARCHAR(500) NOT NULL,
    image_urls      JSON,               -- danh sách nhiều ảnh
    embedding_vector BLOB,              -- FAISS vector (serialize numpy array)
    is_available    TINYINT(1) NOT NULL DEFAULT 1,
    view_count      INT UNSIGNED NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category_id  (category_id),
    INDEX idx_gender       (gender),
    INDEX idx_style        (style),
    INDEX idx_primary_color(primary_color),
    INDEX idx_is_available (is_available),
    FULLTEXT idx_ft_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4 Bảng `wardrobe_items`

```sql
CREATE TABLE wardrobe_items (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    product_id  INT UNSIGNED NOT NULL,
    notes       VARCHAR(255),
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_product (user_id, product_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 Bảng `outfits`

```sql
CREATE TABLE outfits (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    occasion    VARCHAR(50),        -- casual, formal, party, sport, work
    preview_url VARCHAR(500),       -- ảnh preview outfit (do AI tạo hoặc do user upload)
    is_public   TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id  (user_id),
    INDEX idx_occasion (occasion),
    INDEX idx_is_public(is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.6 Bảng `outfit_items`

```sql
CREATE TABLE outfit_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    outfit_id       INT UNSIGNED NOT NULL,
    wardrobe_item_id INT UNSIGNED NOT NULL,
    layer_order     TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- thứ tự layer khi render

    FOREIGN KEY (outfit_id)        REFERENCES outfits(id)       ON DELETE CASCADE,
    FOREIGN KEY (wardrobe_item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE,
    INDEX idx_outfit_id (outfit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.7 Bảng `try_on_history`

```sql
CREATE TABLE try_on_history (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    user_photo_url  VARCHAR(500) NOT NULL,    -- ảnh gốc của user (Cloudinary URL)
    result_url      VARCHAR(500) NOT NULL,    -- ảnh kết quả try-on (Cloudinary URL)
    method          ENUM('upload', 'webcam') NOT NULL DEFAULT 'upload',
    processing_time FLOAT,                    -- giây xử lý AI
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.8 Bảng `user_analysis`

```sql
CREATE TABLE user_analysis (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    photo_url           VARCHAR(500) NOT NULL,       -- ảnh được phân tích
    fitzpatrick_level   TINYINT UNSIGNED,             -- 1-6
    color_season        ENUM('Spring', 'Summer', 'Autumn', 'Winter'),
    recommended_colors  JSON,                         -- ["#E8C9A0", "#D4A574", ...]
    body_shape          ENUM('Apple', 'Pear', 'Hourglass', 'Rectangle', 'Inverted Triangle'),
    pose_keypoints      JSON,                         -- MediaPipe keypoints
    analysis_version    VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.9 Bảng `social_posts`

```sql
CREATE TABLE social_posts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    try_on_id       INT UNSIGNED,                    -- NULL nếu post tự upload
    caption         TEXT,
    image_url       VARCHAR(500) NOT NULL,
    tags            JSON,                            -- ["#ootd", "#streetwear", ...]
    like_count      INT UNSIGNED NOT NULL DEFAULT 0,
    comment_count   INT UNSIGNED NOT NULL DEFAULT 0,
    is_visible      TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)   REFERENCES users(id)          ON DELETE CASCADE,
    FOREIGN KEY (try_on_id) REFERENCES try_on_history(id) ON DELETE SET NULL,
    INDEX idx_user_id    (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.10 Bảng `likes`

```sql
CREATE TABLE likes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    post_id     INT UNSIGNED NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_post (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id)         ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES social_posts(id)  ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.11 Bảng `comments`

```sql
CREATE TABLE comments (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id     INT UNSIGNED NOT NULL,
    user_id     INT UNSIGNED NOT NULL,
    parent_id   INT UNSIGNED DEFAULT NULL,    -- NULL = top-level comment, có giá trị = reply
    content     TEXT NOT NULL,
    is_visible  TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id)   REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)        ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id)     ON DELETE CASCADE,
    INDEX idx_post_id   (post_id),
    INDEX idx_user_id   (user_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.12 Bảng `follows`

```sql
CREATE TABLE follows (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follower_id     INT UNSIGNED NOT NULL,   -- người đang follow
    following_id    INT UNSIGNED NOT NULL,   -- người được follow
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_follow (follower_id, following_id),
    FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (follower_id != following_id),
    INDEX idx_follower_id  (follower_id),
    INDEX idx_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.13 Bảng `trend_data`

```sql
CREATE TABLE trend_data (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season          ENUM('Spring', 'Summer', 'Autumn', 'Winter') NOT NULL,
    year            SMALLINT UNSIGNED NOT NULL,
    category        VARCHAR(100) NOT NULL,      -- loại quần áo
    style           VARCHAR(100),               -- phong cách
    color_name      VARCHAR(50),                -- tên màu
    color_hex       VARCHAR(7),                 -- mã hex màu
    popularity_score FLOAT NOT NULL DEFAULT 0, -- điểm phổ biến (0-100)
    age_group       VARCHAR(20),               -- "18-24", "25-34", "35-44"
    gender          ENUM('male', 'female', 'all') NOT NULL DEFAULT 'all',
    region          VARCHAR(100),              -- "Hà Nội", "TP.HCM", "All"
    data_source     VARCHAR(100),              -- nguồn dữ liệu
    recorded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_season_year (season, year),
    INDEX idx_style       (style),
    INDEX idx_color_name  (color_name),
    INDEX idx_age_group   (age_group),
    INDEX idx_gender      (gender),
    INDEX idx_region      (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Indexes Tổng hợp

### Performance Indexes cho các truy vấn phổ biến

```sql
-- Lấy try-on history của user, sắp xếp mới nhất
ALTER TABLE try_on_history
    ADD INDEX idx_user_created (user_id, created_at DESC);

-- Tìm sản phẩm theo category + style + gender (trang Products)
ALTER TABLE products
    ADD INDEX idx_filter (category_id, style, gender, is_available);

-- Social feed: lấy posts từ following, sắp xếp mới nhất
ALTER TABLE social_posts
    ADD INDEX idx_user_visible_created (user_id, is_visible, created_at DESC);

-- Outfit theo dịp của user
ALTER TABLE outfits
    ADD INDEX idx_user_occasion (user_id, occasion);
```

---

## 4. Ghi chú thiết kế

| Quyết định | Lý do |
|-----------|-------|
| `like_count`, `comment_count` trong `social_posts` | Denormalization để tránh COUNT query tốn kém khi render feed |
| `embedding_vector BLOB` trong `products` | Lưu FAISS vector serialize trực tiếp, không cần bảng riêng |
| `image_urls JSON` trong `products` | Linh hoạt số lượng ảnh, không cần bảng `product_images` riêng |
| `tags JSON` trong `social_posts` | Hashtag đơn giản, không cần bảng `tags` riêng ở phạm vi này |
| `pose_keypoints JSON` trong `user_analysis` | MediaPipe trả về dict, lưu thẳng JSON tiện dùng lại |
| `parent_id` trong `comments` | Cho phép reply 1 cấp (comment → reply), đủ cho scope dự án |
