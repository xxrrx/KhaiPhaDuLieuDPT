from fastapi import APIRouter, Depends, Query, UploadFile, File
from mysql.connector.connection import MySQLConnection
from app.database import get_db
import json

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/categories")
def get_categories(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name, slug, parent_id FROM categories ORDER BY sort_order, id")
    rows = cursor.fetchall()
    cursor.close()

    # Xây dạng cây
    top_level = [r for r in rows if r["parent_id"] is None]
    for parent in top_level:
        parent["children"] = [r for r in rows if r["parent_id"] == parent["id"]]

    return {"success": True, "data": top_level}


@router.get("")
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: int = Query(None),
    gender: str = Query(None),
    style: str = Query(None),
    color: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    search: str = Query(None),
    sort: str = Query("newest"),
    db: MySQLConnection = Depends(get_db),
):
    conditions = ["p.is_available = 1"]
    params = []

    if category_id:
        conditions.append("p.category_id = %s")
        params.append(category_id)
    if gender:
        conditions.append("p.gender = %s")
        params.append(gender)
    if style:
        conditions.append("p.style = %s")
        params.append(style)
    if color:
        conditions.append("p.primary_color LIKE %s")
        params.append(f"%{color}%")
    if min_price is not None:
        conditions.append("p.price >= %s")
        params.append(min_price)
    if max_price is not None:
        conditions.append("p.price <= %s")
        params.append(max_price)
    if search:
        conditions.append("MATCH(p.name, p.description) AGAINST(%s IN BOOLEAN MODE)")
        params.append(f"{search}*")

    where = "WHERE " + " AND ".join(conditions)

    sort_map = {
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "newest": "p.created_at DESC",
        "popular": "p.view_count DESC",
    }
    order_by = sort_map.get(sort, "p.created_at DESC")

    offset = (page - 1) * limit

    cursor = db.cursor(dictionary=True)

    # Count
    cursor.execute(f"SELECT COUNT(*) AS total FROM products p {where}", params)
    total = cursor.fetchone()["total"]

    # Data
    cursor.execute(
        f"""
        SELECT p.id, p.name, p.brand, p.price, p.gender, p.style,
               p.primary_color, p.color_hex, p.image_url, p.is_available,
               c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        {where}
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
        """,
        params + [limit, offset],
    )
    rows = cursor.fetchall()
    cursor.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "name": r["name"],
            "brand": r["brand"],
            "price": float(r["price"]),
            "gender": r["gender"],
            "style": r["style"],
            "primary_color": r["primary_color"],
            "color_hex": r["color_hex"],
            "image_url": r["image_url"],
            "is_available": bool(r["is_available"]),
            "category": {"id": r["cat_id"], "name": r["cat_name"], "slug": r["cat_slug"]},
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/{product_id}")
def get_product(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # Tăng view_count
    cursor.execute("UPDATE products SET view_count = view_count + 1 WHERE id = %s", (product_id,))
    db.commit()

    cursor.execute(
        """
        SELECT p.*, c.id AS cat_id, c.name AS cat_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = %s
        """,
        (product_id,),
    )
    row = cursor.fetchone()
    cursor.close()

    if not row:
        return {"success": False, "error": "NOT_FOUND", "message": "Sản phẩm không tồn tại"}

    row["price"] = float(row["price"])
    row["is_available"] = bool(row["is_available"])
    row["category"] = {"id": row.pop("cat_id"), "name": row.pop("cat_name")}

    # Parse JSON fields
    for field in ("size_options", "image_urls"):
        if row.get(field) and isinstance(row[field], str):
            row[field] = json.loads(row[field])

    # Loại bỏ embedding_vector (binary, không gửi ra ngoài)
    row.pop("embedding_vector", None)
    row["created_at"] = str(row.get("created_at", ""))
    row["updated_at"] = str(row.get("updated_at", ""))

    return {"success": True, "data": row}


@router.get("/{product_id}/similar")
def get_similar_products(product_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    # Get category_id of the product
    cursor.execute("SELECT category_id FROM products WHERE id = %s", (product_id,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        return {"success": False, "error": "NOT_FOUND", "message": "Sản phẩm không tồn tại"}

    category_id = row["category_id"]
    cursor.execute(
        """
        SELECT p.id, p.name, p.brand, p.price, p.gender, p.style,
               p.primary_color, p.color_hex, p.image_url, p.is_available,
               c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.category_id = %s AND p.id != %s AND p.is_available = 1
        ORDER BY p.view_count DESC
        LIMIT 10
        """,
        (category_id, product_id),
    )
    rows = cursor.fetchall()
    cursor.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "name": r["name"],
            "brand": r["brand"],
            "price": float(r["price"]),
            "gender": r["gender"],
            "style": r["style"],
            "primary_color": r["primary_color"],
            "color_hex": r["color_hex"],
            "image_url": r["image_url"],
            "is_available": bool(r["is_available"]),
            "category": {"id": r["cat_id"], "name": r["cat_name"], "slug": r["cat_slug"]},
        })

    return {"success": True, "data": items}


@router.post("/search-by-image")
def search_by_image(
    image: UploadFile = File(...),
    db: MySQLConnection = Depends(get_db),
):
    import time
    from app.services.cloudinary_service import upload_image
    contents = image.file.read()
    upload_image(contents, folder="smartfit/search")
    start = time.time()
    search_time_ms = round((time.time() - start) * 1000, 2)
    return {
        "success": True,
        "data": {
            "similar_products": [],
            "search_time_ms": search_time_ms,
        }
    }
