"""
Seed sản phẩm từ Kaggle Fashion Product Images dataset vào MySQL.
Đảm bảo product ID trong DB khớp với ID trong outfit_recommender.pkl.

Yêu cầu:
  - Đã download dataset: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small
  - Đặt đường dẫn dataset vào DATASET_PATH bên dưới
  - File images nằm tại: {DATASET_PATH}/images/{id}.jpg

Chạy từ thư mục backend/:
  python seed_from_kaggle.py
  python seed_from_kaggle.py --dataset /path/to/dataset --limit 2000
"""

import sys
import os
import json
import argparse

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import mysql.connector
import pandas as pd

from app.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# ---------------------------------------------------------------------------
# Cấu hình — chỉnh đường dẫn dataset cho phù hợp máy bạn
# ---------------------------------------------------------------------------
DEFAULT_DATASET_PATH = "./data/fashion-product-images-small"

# Map subCategory Kaggle → category_id trong DB (theo database.md)
# parent: Áo=1, Quần=2, Váy=3, Giày=4, Phụ kiện=5
# sub:    Áo phông=6, Áo sơ mi=7, Áo khoác=8, Quần jeans=9, Quần âu=10
SUBCATEGORY_MAP = {
    # Topwear → Áo
    "Topwear":          1,
    "Shirts":           7,   # Áo sơ mi
    "Tshirts":          6,   # Áo phông
    "Casual Shirts":    7,
    "Formal Shirts":    7,
    "Jackets":          8,   # Áo khoác
    "Sweatshirts":      8,
    "Sweaters":         8,
    "Tracksuits":       8,
    "Waistcoat":        1,
    "Suits":            1,
    "Blazers":          1,
    "Kurtas":           1,
    "Tops":             6,
    "Blouses":          6,
    "Tank Tops":        6,
    "Tunics":           6,
    "Innerwear":        1,
    # Bottomwear → Quần
    "Bottomwear":       2,
    "Jeans":            9,   # Quần jeans
    "Trousers":         10,  # Quần âu
    "Track Pants":      2,
    "Shorts":           2,
    "Skirts":           3,   # Váy
    "Leggings":         2,
    "Capris":           2,
    "Churidar":         2,
    "Salwar":           2,
    # Dress → Váy
    "Dress":            3,
    "Dresses":          3,
    "Jumpsuit":         3,
    # Footwear → Giày
    "Shoes":            4,
    "Casual Shoes":     4,
    "Formal Shoes":     4,
    "Sports Shoes":     4,
    "Heels":            4,
    "Flats":            4,
    "Sandals":          4,
    "Flip Flops":       4,
    "Boots":            4,
    # Accessories → Phụ kiện
    "Accessories":      5,
    "Bags":             5,
    "Wallets":          5,
    "Belts":            5,
    "Watches":          5,
    "Sunglasses":       5,
    "Eyewear":          5,
    "Caps":             5,
    "Hats":             5,
    "Ties":             5,
    "Scarves":          5,
    "Jewellery":        5,
    "Socks":            5,
    "Briefs":           5,
    "Bra":              5,
    "Stockings":        5,
}

# Map gender Kaggle → ENUM DB
GENDER_MAP = {
    "Men":    "male",
    "Women":  "female",
    "Boys":   "male",
    "Girls":  "female",
    "Unisex": "unisex",
}

# Map usage Kaggle → style DB
USAGE_MAP = {
    "Casual":       "casual",
    "Formal":       "formal",
    "Sports":       "sport",
    "Party":        "party",
    "Smart Casual": "casual",
    "Travel":       "casual",
    "Home":         "casual",
    "Ethnic":       "casual",
    "Outdoor":      "casual",
}

# Cloudinary (tùy chọn — nếu không cấu hình thì dùng local path)
try:
    import cloudinary
    import cloudinary.uploader
    CLOUDINARY_ENABLED = bool(os.getenv("CLOUDINARY_CLOUD_NAME"))
    if CLOUDINARY_ENABLED:
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        )
except ImportError:
    CLOUDINARY_ENABLED = False


def upload_image_to_cloudinary(image_path: str, public_id: str) -> str | None:
    """Upload ảnh lên Cloudinary, trả về URL hoặc None nếu lỗi."""
    try:
        result = cloudinary.uploader.upload(
            image_path,
            public_id=f"smartfit/products/{public_id}",
            overwrite=False,
            resource_type="image",
        )
        return result["secure_url"]
    except Exception as e:
        print(f"    [WARN] Cloudinary upload failed: {e}")
        return None


def load_and_filter_dataset(dataset_path: str) -> pd.DataFrame:
    """Đọc styles.csv, filter giống notebook 04."""
    csv_path = os.path.join(dataset_path, "styles.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"Không tìm thấy {csv_path}\n"
            f"Hãy download dataset tại:\n"
            f"  https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small\n"
            f"Rồi giải nén vào: {dataset_path}"
        )

    df = pd.read_csv(csv_path, on_bad_lines="skip")
    print(f"Total rows in styles.csv: {len(df)}")

    # Filter giống notebook 04 (Apparel + Footwear + Accessories)
    df = df[df["masterCategory"].isin(["Apparel", "Footwear", "Accessories"])].copy()
    df = df.dropna(subset=["articleType", "baseColour", "gender"])

    # Chỉ giữ ảnh tồn tại trên disk
    image_dir = os.path.join(dataset_path, "images")
    if os.path.exists(image_dir):
        df["image_path"] = df["id"].apply(lambda x: os.path.join(image_dir, f"{x}.jpg"))
        df = df[df["image_path"].apply(os.path.exists)]
    else:
        print(f"[WARN] Không tìm thấy thư mục images tại {image_dir}. image_url sẽ để trống.")
        df["image_path"] = ""

    print(f"Filtered products (with existing images): {len(df)}")
    return df


def seed(dataset_path: str, limit: int | None = None, upload_cloudinary: bool = False):
    df = load_and_filter_dataset(dataset_path)

    if limit:
        df = df.head(limit)
        print(f"Limiting to {limit} products.")

    db = mysql.connector.connect(
        host=DB_HOST,
        port=int(DB_PORT),
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
    )
    cursor = db.cursor()

    # Kiểm tra đã seed chưa
    cursor.execute("SELECT COUNT(*) FROM products")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"[INFO] Database đã có {count} sản phẩm.")
        answer = input("Xoá hết và seed lại? (y/N): ").strip().lower()
        if answer != "y":
            print("Huỷ.")
            cursor.close()
            db.close()
            return
        cursor.execute("DELETE FROM products")
        db.commit()
        print("Đã xoá sản phẩm cũ.")

    insert_sql = """
        INSERT INTO products
            (id, category_id, name, description, brand, price,
             gender, style, primary_color, color_hex,
             size_options, material, image_url, is_available)
        VALUES
            (%s, %s, %s, %s, %s, %s,
             %s, %s, %s, %s,
             %s, %s, %s, 1)
    """

    inserted = 0
    skipped = 0

    for _, row in df.iterrows():
        kaggle_id = int(row["id"])

        # Map category_id
        sub_cat = str(row.get("subCategory", "")).strip()
        article_type = str(row.get("articleType", "")).strip()
        category_id = (
            SUBCATEGORY_MAP.get(article_type)
            or SUBCATEGORY_MAP.get(sub_cat)
            or 1  # fallback: Áo
        )

        # Map gender
        gender_raw = str(row.get("gender", "Unisex")).strip()
        gender = GENDER_MAP.get(gender_raw, "unisex")

        # Map style
        usage_raw = str(row.get("usage", "Casual")).strip()
        style = USAGE_MAP.get(usage_raw, "casual")

        # Image URL
        image_path = str(row.get("image_path", ""))
        image_url = ""

        if image_path and os.path.exists(image_path):
            if upload_cloudinary and CLOUDINARY_ENABLED:
                uploaded = upload_image_to_cloudinary(image_path, str(kaggle_id))
                image_url = uploaded or f"local:{image_path}"
            else:
                # Dùng local path — thay bằng Cloudinary URL sau
                image_url = image_path
        else:
            skipped += 1
            # Vẫn insert nhưng image_url trống
            image_url = ""

        # Giá: dataset Kaggle không có price → đặt mặc định 0
        price = float(row.get("price", 0) or 0)

        # Size options: dataset không có → để trống
        size_options = json.dumps(["S", "M", "L", "XL"])

        name = str(row.get("productDisplayName", f"Product {kaggle_id}"))
        brand = str(row.get("brand", "") or "")
        color = str(row.get("baseColour", "")).lower()
        season = str(row.get("season", ""))
        description = f"{article_type}. Season: {season}." if season else article_type

        try:
            cursor.execute(insert_sql, (
                kaggle_id,
                category_id,
                name,
                description,
                brand,
                price,
                gender,
                style,
                color,
                "",        # color_hex — dataset không có
                size_options,
                "",        # material — dataset không có
                image_url,
            ))
            inserted += 1
            if inserted % 100 == 0:
                db.commit()
                print(f"  [{inserted}] đã insert...")
        except mysql.connector.Error as e:
            print(f"  [ERROR] id={kaggle_id}: {e}")
            db.rollback()

    db.commit()
    cursor.close()
    db.close()

    print(f"\nHoàn thành!")
    print(f"  Inserted : {inserted}")
    print(f"  No image : {skipped}")
    print(f"\nLưu ý:")
    print(f"  - image_url hiện là local path. Để dùng Cloudinary, chạy lại với --upload-cloudinary")
    print(f"  - Product ID trong DB khớp với Kaggle ID → outfit_recommender.pkl hoạt động đúng")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed products từ Kaggle dataset")
    parser.add_argument(
        "--dataset",
        default=DEFAULT_DATASET_PATH,
        help=f"Đường dẫn tới dataset (default: {DEFAULT_DATASET_PATH})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Giới hạn số sản phẩm seed (mặc định: toàn bộ)",
    )
    parser.add_argument(
        "--upload-cloudinary",
        action="store_true",
        help="Upload ảnh lên Cloudinary (chậm, cần cấu hình .env)",
    )
    args = parser.parse_args()

    seed(
        dataset_path=args.dataset,
        limit=args.limit,
        upload_cloudinary=args.upload_cloudinary,
    )
