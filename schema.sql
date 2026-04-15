-- ============================================================
-- SmartFit Database Schema
-- DBMS: MySQL 8.0+
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

-- 1. users
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

-- 2. categories
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

INSERT INTO categories (name, slug, parent_id) VALUES
('Áo',        'ao',         NULL),
('Quần',      'quan',       NULL),
('Váy',       'vay',        NULL),
('Giày',      'giay',       NULL),
('Phụ kiện',  'phu-kien',   NULL),
('Áo phông',  'ao-phong',   1),
('Áo sơ mi',  'ao-so-mi',   1),
('Áo khoác',  'ao-khoac',   1),
('Quần jeans','quan-jeans',  2),
('Quần âu',   'quan-au',    2);

-- 3. products
CREATE TABLE products (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id      INT UNSIGNED NOT NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    brand            VARCHAR(100),
    price            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    gender           ENUM('male', 'female', 'unisex') NOT NULL DEFAULT 'unisex',
    style            VARCHAR(50),
    primary_color    VARCHAR(50),
    color_hex        VARCHAR(7),
    size_options     JSON,
    material         VARCHAR(100),
    image_url        VARCHAR(500) NOT NULL,
    image_urls       JSON,
    embedding_vector BLOB,
    is_available     TINYINT(1) NOT NULL DEFAULT 1,
    view_count       INT UNSIGNED NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category_id   (category_id),
    INDEX idx_gender        (gender),
    INDEX idx_style         (style),
    INDEX idx_primary_color (primary_color),
    INDEX idx_is_available  (is_available),
    FULLTEXT idx_ft_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. wardrobe_items
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

-- 5. outfits
CREATE TABLE outfits (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    occasion    VARCHAR(50),
    preview_url VARCHAR(500),
    is_public   TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id   (user_id),
    INDEX idx_occasion  (occasion),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. outfit_items
CREATE TABLE outfit_items (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    outfit_id        INT UNSIGNED NOT NULL,
    wardrobe_item_id INT UNSIGNED NOT NULL,
    layer_order      TINYINT UNSIGNED NOT NULL DEFAULT 0,

    FOREIGN KEY (outfit_id)        REFERENCES outfits(id)        ON DELETE CASCADE,
    FOREIGN KEY (wardrobe_item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE,
    INDEX idx_outfit_id (outfit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. try_on_history
CREATE TABLE try_on_history (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    user_photo_url  VARCHAR(500) NOT NULL,
    result_url      VARCHAR(500) NOT NULL,
    method          ENUM('upload', 'webcam') NOT NULL DEFAULT 'upload',
    processing_time FLOAT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. user_analysis
CREATE TABLE user_analysis (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    photo_url           VARCHAR(500) NOT NULL,
    fitzpatrick_level   TINYINT UNSIGNED,
    color_season        ENUM('Spring', 'Summer', 'Autumn', 'Winter'),
    recommended_colors  JSON,
    body_shape          ENUM('Apple', 'Pear', 'Hourglass', 'Rectangle', 'Inverted Triangle'),
    pose_keypoints      JSON,
    analysis_version    VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. social_posts
CREATE TABLE social_posts (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    try_on_id     INT UNSIGNED,
    caption       TEXT,
    image_url     VARCHAR(500) NOT NULL,
    tags          JSON,
    like_count    INT UNSIGNED NOT NULL DEFAULT 0,
    comment_count INT UNSIGNED NOT NULL DEFAULT 0,
    is_visible    TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)   REFERENCES users(id)          ON DELETE CASCADE,
    FOREIGN KEY (try_on_id) REFERENCES try_on_history(id) ON DELETE SET NULL,
    INDEX idx_user_id    (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. likes
CREATE TABLE likes (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    post_id    INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_post (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id)        ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. comments
CREATE TABLE comments (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    parent_id  INT UNSIGNED DEFAULT NULL,
    content    TEXT NOT NULL,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id)   REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)        ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id)     ON DELETE CASCADE,
    INDEX idx_post_id   (post_id),
    INDEX idx_user_id   (user_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. follows
CREATE TABLE follows (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follower_id  INT UNSIGNED NOT NULL,
    following_id INT UNSIGNED NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_follow (follower_id, following_id),
    FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (follower_id != following_id),
    INDEX idx_follower_id  (follower_id),
    INDEX idx_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. trend_data
CREATE TABLE trend_data (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season           ENUM('Spring', 'Summer', 'Autumn', 'Winter') NOT NULL,
    year             SMALLINT UNSIGNED NOT NULL,
    category         VARCHAR(100) NOT NULL,
    style            VARCHAR(100),
    color_name       VARCHAR(50),
    color_hex        VARCHAR(7),
    popularity_score FLOAT NOT NULL DEFAULT 0,
    age_group        VARCHAR(20),
    gender           ENUM('male', 'female', 'all') NOT NULL DEFAULT 'all',
    region           VARCHAR(100),
    data_source      VARCHAR(100),
    recorded_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_season_year (season, year),
    INDEX idx_style       (style),
    INDEX idx_color_name  (color_name),
    INDEX idx_age_group   (age_group),
    INDEX idx_gender      (gender),
    INDEX idx_region      (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Performance Indexes
-- ============================================================

ALTER TABLE try_on_history
    ADD INDEX idx_user_created (user_id, created_at DESC);

ALTER TABLE products
    ADD INDEX idx_filter (category_id, style, gender, is_available);

ALTER TABLE social_posts
    ADD INDEX idx_user_visible_created (user_id, is_visible, created_at DESC);

ALTER TABLE outfits
    ADD INDEX idx_user_occasion (user_id, occasion);
