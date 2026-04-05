"""
Script seed sản phẩm mẫu cho SmartFit.
Chạy từ thư mục backend/: python seed_products.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import mysql.connector
import cloudinary
import cloudinary.uploader
import json
from app.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# ---------------------------------------------------------------------------
# Dữ liệu sản phẩm mẫu
# Ảnh lấy từ Unsplash (public, miễn phí) – URL trực tiếp đến ảnh quần áo
# ---------------------------------------------------------------------------
PRODUCTS = [
    # ---- ÁO PHÔNG (category_id=6) ----
    {
        "category_id": 6,
        "name": "Áo phông basic trắng",
        "description": "Áo phông cotton 100%, form rộng, thoáng mát, phù hợp nhiều dịp.",
        "brand": "BasicWear",
        "price": 199000,
        "gender": "unisex",
        "style": "casual",
        "primary_color": "white",
        "color_hex": "#FFFFFF",
        "size_options": ["XS", "S", "M", "L", "XL"],
        "material": "Cotton 100%",
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
    },
    {
        "category_id": 6,
        "name": "Áo phông đen oversize",
        "description": "Áo phông đen form oversize, phong cách streetwear.",
        "brand": "UrbanStyle",
        "price": 249000,
        "gender": "unisex",
        "style": "streetwear",
        "primary_color": "black",
        "color_hex": "#000000",
        "size_options": ["S", "M", "L", "XL", "XXL"],
        "material": "Cotton 95%, Spandex 5%",
        "image_url": "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600",
    },
    {
        "category_id": 6,
        "name": "Áo phông in hoạ tiết",
        "description": "Áo phông in graphic, năng động trẻ trung.",
        "brand": "GraphicTee",
        "price": 279000,
        "gender": "male",
        "style": "casual",
        "primary_color": "navy",
        "color_hex": "#001F5B",
        "size_options": ["S", "M", "L", "XL"],
        "material": "Cotton 100%",
        "image_url": "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600",
    },
    {
        "category_id": 6,
        "name": "Áo phông nữ crop top",
        "description": "Áo phông ngắn dành cho nữ, phong cách năng động.",
        "brand": "FemStyle",
        "price": 219000,
        "gender": "female",
        "style": "casual",
        "primary_color": "pink",
        "color_hex": "#FFB6C1",
        "size_options": ["XS", "S", "M", "L"],
        "material": "Cotton 100%",
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600",
    },
    # ---- ÁO SƠ MI (category_id=7) ----
    {
        "category_id": 7,
        "name": "Áo sơ mi trắng công sở",
        "description": "Áo sơ mi trắng form slim, phù hợp đi làm và sự kiện trang trọng.",
        "brand": "OfficePro",
        "price": 399000,
        "gender": "male",
        "style": "formal",
        "primary_color": "white",
        "color_hex": "#FFFFFF",
        "size_options": ["S", "M", "L", "XL", "XXL"],
        "material": "Polyester 65%, Cotton 35%",
        "image_url": "https://images.unsplash.com/photo-1602810316693-3667c854239a?w=600",
    },
    {
        "category_id": 7,
        "name": "Áo sơ mi kẻ caro",
        "description": "Áo sơ mi kẻ caro dài tay, phong cách casual-formal.",
        "brand": "CheckStyle",
        "price": 349000,
        "gender": "male",
        "style": "casual",
        "primary_color": "blue",
        "color_hex": "#4169E1",
        "size_options": ["S", "M", "L", "XL"],
        "material": "Cotton 100%",
        "image_url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600",
    },
    {
        "category_id": 7,
        "name": "Áo sơ mi nữ lụa",
        "description": "Áo sơ mi nữ chất liệu lụa mềm, sang trọng.",
        "brand": "SilkLady",
        "price": 450000,
        "gender": "female",
        "style": "formal",
        "primary_color": "beige",
        "color_hex": "#F5F5DC",
        "size_options": ["XS", "S", "M", "L"],
        "material": "Lụa nhân tạo 100%",
        "image_url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600",
    },
    # ---- ÁO KHOÁC (category_id=8) ----
    {
        "category_id": 8,
        "name": "Áo khoác dù unisex",
        "description": "Áo khoác dù nhẹ chống gió, phù hợp mùa thu đông.",
        "brand": "WindBreaker",
        "price": 599000,
        "gender": "unisex",
        "style": "casual",
        "primary_color": "olive",
        "color_hex": "#808000",
        "size_options": ["S", "M", "L", "XL"],
        "material": "Nylon 100%",
        "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
    },
    {
        "category_id": 8,
        "name": "Áo khoác bomber đen",
        "description": "Áo bomber classic màu đen, style streetwear.",
        "brand": "BomberKing",
        "price": 699000,
        "gender": "male",
        "style": "streetwear",
        "primary_color": "black",
        "color_hex": "#000000",
        "size_options": ["S", "M", "L", "XL"],
        "material": "Polyester 100%",
        "image_url": "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600",
    },
    {
        "category_id": 8,
        "name": "Áo khoác cardigan nữ",
        "description": "Cardigan len mỏng, phong cách vintage nữ tính.",
        "brand": "KnitLove",
        "price": 480000,
        "gender": "female",
        "style": "vintage",
        "primary_color": "cream",
        "color_hex": "#FFFDD0",
        "size_options": ["XS", "S", "M", "L"],
        "material": "Acrylic 80%, Wool 20%",
        "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
    },
    # ---- QUẦN JEANS (category_id=9) ----
    {
        "category_id": 9,
        "name": "Quần jeans slim xanh",
        "description": "Quần jeans slim fit màu xanh đậm, đa năng.",
        "brand": "DenimCo",
        "price": 499000,
        "gender": "male",
        "style": "casual",
        "primary_color": "blue",
        "color_hex": "#1C3D6E",
        "size_options": ["28", "29", "30", "31", "32", "33", "34"],
        "material": "Denim 98%, Spandex 2%",
        "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
    },
    {
        "category_id": 9,
        "name": "Quần jeans nữ skinny",
        "description": "Quần jeans skinny nữ ôm dáng, tôn vóc dáng.",
        "brand": "SkinnyCut",
        "price": 459000,
        "gender": "female",
        "style": "casual",
        "primary_color": "black",
        "color_hex": "#1A1A1A",
        "size_options": ["25", "26", "27", "28", "29", "30"],
        "material": "Denim 95%, Spandex 5%",
        "image_url": "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600",
    },
    {
        "category_id": 9,
        "name": "Quần jeans rách streetwear",
        "description": "Quần jeans rách phong cách streetwear cá tính.",
        "brand": "UrbanDenim",
        "price": 549000,
        "gender": "unisex",
        "style": "streetwear",
        "primary_color": "light blue",
        "color_hex": "#ADD8E6",
        "size_options": ["28", "29", "30", "31", "32"],
        "material": "Denim 100%",
        "image_url": "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600",
    },
    # ---- QUẦN ÂU (category_id=10) ----
    {
        "category_id": 10,
        "name": "Quần âu nam đen",
        "description": "Quần tây nam màu đen, phù hợp công sở và sự kiện.",
        "brand": "FormalWear",
        "price": 599000,
        "gender": "male",
        "style": "formal",
        "primary_color": "black",
        "color_hex": "#000000",
        "size_options": ["28", "29", "30", "31", "32", "33", "34"],
        "material": "Polyester 70%, Viscose 30%",
        "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
    },
    {
        "category_id": 10,
        "name": "Quần âu nữ ống suông",
        "description": "Quần âu nữ ống suông thanh lịch, phù hợp đi làm.",
        "brand": "LadyOffice",
        "price": 520000,
        "gender": "female",
        "style": "formal",
        "primary_color": "grey",
        "color_hex": "#808080",
        "size_options": ["25", "26", "27", "28", "29"],
        "material": "Polyester 65%, Wool 35%",
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4b4e5d?w=600",
    },
    # ---- VÁY (category_id=3) ----
    {
        "category_id": 3,
        "name": "Váy maxi hoa nhí",
        "description": "Váy dài họa tiết hoa nhí, phong cách vintage nữ tính.",
        "brand": "FloralDream",
        "price": 580000,
        "gender": "female",
        "style": "vintage",
        "primary_color": "floral",
        "color_hex": "#FFE4E1",
        "size_options": ["XS", "S", "M", "L"],
        "material": "Vải voan 100%",
        "image_url": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600",
    },
    {
        "category_id": 3,
        "name": "Váy mini đen dự tiệc",
        "description": "Váy mini đen basic, phù hợp tiệc tùng và dạ hội.",
        "brand": "NightOut",
        "price": 650000,
        "gender": "female",
        "style": "party",
        "primary_color": "black",
        "color_hex": "#000000",
        "size_options": ["XS", "S", "M", "L"],
        "material": "Polyester 100%",
        "image_url": "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600",
    },
    {
        "category_id": 3,
        "name": "Chân váy tennis trắng",
        "description": "Chân váy tennis phong cách thể thao năng động.",
        "brand": "SportChic",
        "price": 380000,
        "gender": "female",
        "style": "sport",
        "primary_color": "white",
        "color_hex": "#FFFFFF",
        "size_options": ["XS", "S", "M", "L", "XL"],
        "material": "Polyester 90%, Spandex 10%",
        "image_url": "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600",
    },
    # ---- GIÀY (category_id=4) ----
    {
        "category_id": 4,
        "name": "Giày sneaker trắng",
        "description": "Giày sneaker trắng classic, đa năng phối đồ.",
        "brand": "SneakerLab",
        "price": 890000,
        "gender": "unisex",
        "style": "casual",
        "primary_color": "white",
        "color_hex": "#FFFFFF",
        "size_options": ["36", "37", "38", "39", "40", "41", "42", "43"],
        "material": "Da tổng hợp + Vải lưới",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    },
    {
        "category_id": 4,
        "name": "Giày cao gót nude 7cm",
        "description": "Giày cao gót màu nude 7cm, sang trọng tôn dáng.",
        "brand": "HeelQueen",
        "price": 750000,
        "gender": "female",
        "style": "formal",
        "primary_color": "nude",
        "color_hex": "#E8C9A0",
        "size_options": ["35", "36", "37", "38", "39"],
        "material": "Da PU cao cấp",
        "image_url": "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600",
    },
    {
        "category_id": 4,
        "name": "Giày thể thao running",
        "description": "Giày chạy bộ đế cao su, thoáng khí.",
        "brand": "RunFast",
        "price": 1200000,
        "gender": "unisex",
        "style": "sport",
        "primary_color": "blue",
        "color_hex": "#0000CD",
        "size_options": ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
        "material": "Mesh + TPU",
        "image_url": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600",
    },
    # ---- PHỤ KIỆN (category_id=5) ----
    {
        "category_id": 5,
        "name": "Túi tote canvas",
        "description": "Túi tote vải canvas, đơn giản tiện dụng.",
        "brand": "CanvasBag",
        "price": 280000,
        "gender": "unisex",
        "style": "casual",
        "primary_color": "beige",
        "color_hex": "#F5F5DC",
        "size_options": ["One Size"],
        "material": "Canvas 100%",
        "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600",
    },
    {
        "category_id": 5,
        "name": "Mũ bucket hat",
        "description": "Mũ bucket style retro, chống nắng thời trang.",
        "brand": "HatGame",
        "price": 195000,
        "gender": "unisex",
        "style": "streetwear",
        "primary_color": "khaki",
        "color_hex": "#C3B091",
        "size_options": ["Free Size"],
        "material": "Cotton 100%",
        "image_url": "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600",
    },
    {
        "category_id": 5,
        "name": "Kính mắt vintage oval",
        "description": "Kính mắt gọng oval phong cách vintage.",
        "brand": "VintageGlass",
        "price": 350000,
        "gender": "unisex",
        "style": "vintage",
        "primary_color": "tortoise",
        "color_hex": "#8B6914",
        "size_options": ["Free Size"],
        "material": "Acetate",
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600",
    },
]


def seed():
    db = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
    )
    cursor = db.cursor()

    # Xoá sản phẩm cũ nếu muốn seed lại
    cursor.execute("SELECT COUNT(*) FROM products")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Database đã có {count} sản phẩm. Bỏ qua seed.")
        print("Nếu muốn seed lại, chạy: DELETE FROM products; rồi chạy lại script.")
        cursor.close()
        db.close()
        return

    insert_sql = """
        INSERT INTO products
            (category_id, name, description, brand, price, gender, style,
             primary_color, color_hex, size_options, material, image_url, is_available)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
    """

    inserted = 0
    for p in PRODUCTS:
        cursor.execute(insert_sql, (
            p["category_id"],
            p["name"],
            p["description"],
            p["brand"],
            p["price"],
            p["gender"],
            p["style"],
            p["primary_color"],
            p["color_hex"],
            json.dumps(p["size_options"]),
            p["material"],
            p["image_url"],
        ))
        inserted += 1
        print(f"  [{inserted}] Thêm: {p['name']}")

    db.commit()
    cursor.close()
    db.close()
    print(f"\nHoàn thành! Đã thêm {inserted} sản phẩm.")


if __name__ == "__main__":
    seed()
