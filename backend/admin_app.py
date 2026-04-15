"""Admin Panel — chạy riêng tại port 8001, không cần đăng nhập."""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mysql.connector.connection import MySQLConnection

from app.config import *   # load cloudinary + DB config
from app.database import get_db
from app.services.cloudinary_service import upload_image, _validate_image, delete_image
from app.services.ai_service import classify_clothing

app = FastAPI(title="SmartFit Admin", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static admin UI
ADMIN_STATIC = os.path.join(os.path.dirname(__file__), "admin_ui")
os.makedirs(ADMIN_STATIC, exist_ok=True)
app.mount("/static", StaticFiles(directory=ADMIN_STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(os.path.join(ADMIN_STATIC, "index.html"))


# ── Mapping classify_clothing label → (category_id, style) ──────────────────
# Top-10 labels từ notebook 01 (Kaggle Fashion dataset)
LABEL_TO_META = {
    "Tshirts":      {"category_id": 6},
    "Shirts":       {"category_id": 7},
    "Casual Shoes": {"category_id": 4},
    "Watches":      {"category_id": 5},
    "Sports Shoes": {"category_id": 4},
    "Kurtas":       {"category_id": 7},
    "Tops":         {"category_id": 6},
    "Handbags":     {"category_id": 5},
    "Heels":        {"category_id": 4},
    "Sunglasses":   {"category_id": 5},
}


# ── Categories ───────────────────────────────────────────────────────────────
@app.get("/api/categories")
def get_categories(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name, slug FROM categories ORDER BY id")
    rows = cursor.fetchall()
    cursor.close()
    return {"success": True, "data": rows}


# ── Classify image ────────────────────────────────────────────────────────────
@app.post("/api/classify")
def classify(image: UploadFile = File(...)):
    """Upload ảnh → classify_clothing → trả về gợi ý category (style do admin tự chọn)."""
    contents = image.file.read()
    _validate_image(contents, image.content_type)
    result = classify_clothing(contents)
    label = result.get("category", "unknown")
    meta = LABEL_TO_META.get(label, {"category_id": 6})
    return {
        "success": True,
        "data": {
            "label": label,
            "confidence": round(result.get("confidence", 0.0), 3),
            "suggested_category_id": meta["category_id"],
        }
    }


# ── Upload ảnh lên Cloudinary ─────────────────────────────────────────────────
@app.post("/api/upload-image")
def upload(image: UploadFile = File(...)):
    contents = image.file.read()
    _validate_image(contents, image.content_type)
    result = upload_image(contents, folder="smartfit/products")
    return {"success": True, "data": result}


# ── Products CRUD ─────────────────────────────────────────────────────────────
@app.get("/api/products")
def list_products(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    db: MySQLConnection = Depends(get_db),
):
    offset = (page - 1) * limit
    cursor = db.cursor(dictionary=True)

    where = "WHERE 1=1"
    params = []
    if search:
        where += " AND (p.name LIKE %s OR p.brand LIKE %s)"
        params += [f"%{search}%", f"%{search}%"]

    cursor.execute(f"SELECT COUNT(*) AS total FROM products p {where}", params)
    total = cursor.fetchone()["total"]

    cursor.execute(
        f"""SELECT p.id, p.name, p.brand, p.price, p.gender, p.style,
                   p.primary_color, p.color_hex, p.image_url, p.is_available,
                   p.material, p.description,
                   c.id AS cat_id, c.name AS cat_name
            FROM products p
            JOIN categories c ON c.id = p.category_id
            {where}
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s""",
        params + [limit, offset]
    )
    rows = cursor.fetchall()
    cursor.close()

    for r in rows:
        r["price"] = float(r["price"])
        r["is_available"] = bool(r["is_available"])

    return {
        "success": True,
        "data": {
            "items": rows,
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit,
        }
    }


@app.post("/api/products")
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    brand: str = Form(""),
    price: float = Form(...),
    gender: str = Form("unisex"),
    style: str = Form("casual"),
    primary_color: str = Form(""),
    color_hex: str = Form(""),
    material: str = Form(""),
    category_id: int = Form(...),
    size_options: str = Form("[]"),   # JSON string
    image_url: str = Form(...),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute(
        """INSERT INTO products
            (category_id, name, description, brand, price, gender, style,
             primary_color, color_hex, size_options, material, image_url, is_available)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1)""",
        (category_id, name, description, brand, price, gender, style,
         primary_color, color_hex, size_options, material, image_url)
    )
    db.commit()
    new_id = cursor.lastrowid
    cursor.close()
    return {"success": True, "data": {"id": new_id}}


@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT p.*, c.name AS cat_name FROM products p
           JOIN categories c ON c.id = p.category_id
           WHERE p.id = %s""",
        (product_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    row["price"] = float(row["price"])
    row["is_available"] = bool(row["is_available"])
    row.pop("embedding_vector", None)
    for f in ("size_options", "image_urls"):
        if row.get(f) and isinstance(row[f], str):
            try:
                row[f] = json.loads(row[f])
            except Exception:
                pass
    row["created_at"] = str(row.get("created_at", ""))
    row["updated_at"] = str(row.get("updated_at", ""))
    return {"success": True, "data": row}


@app.put("/api/products/{product_id}")
def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(""),
    brand: str = Form(""),
    price: float = Form(...),
    gender: str = Form("unisex"),
    style: str = Form("casual"),
    primary_color: str = Form(""),
    color_hex: str = Form(""),
    material: str = Form(""),
    category_id: int = Form(...),
    size_options: str = Form("[]"),
    image_url: str = Form(...),
    is_available: int = Form(1),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor()
    cursor.execute(
        """UPDATE products SET
            category_id=%s, name=%s, description=%s, brand=%s, price=%s,
            gender=%s, style=%s, primary_color=%s, color_hex=%s,
            size_options=%s, material=%s, image_url=%s, is_available=%s
           WHERE id=%s""",
        (category_id, name, description, brand, price, gender, style,
         primary_color, color_hex, size_options, material, image_url,
         is_available, product_id)
    )
    db.commit()
    cursor.close()
    return {"success": True}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
    db.commit()
    cursor.close()
    return {"success": True}
