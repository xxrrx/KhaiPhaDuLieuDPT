from fastapi import APIRouter, Depends, Query, HTTPException
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/wardrobe", tags=["Wardrobe"])


@router.get("")
def get_wardrobe(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    conditions = ["w.user_id = %s"]
    params = [current_user["id"]]
    if category:
        conditions.append("c.slug = %s")
        params.append(category)

    where = "WHERE " + " AND ".join(conditions)
    offset = (page - 1) * limit

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        f"""SELECT COUNT(*) AS total FROM wardrobe_items w
            JOIN products p ON p.id = w.product_id
            JOIN categories c ON c.id = p.category_id
            {where}""",
        params
    )
    total = cursor.fetchone()["total"]

    cursor.execute(
        f"""SELECT w.id, w.added_at,
                   p.id AS p_id, p.name, p.brand, p.price, p.image_url, p.primary_color, p.color_hex,
                   c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug
            FROM wardrobe_items w
            JOIN products p ON p.id = w.product_id
            JOIN categories c ON c.id = p.category_id
            {where}
            ORDER BY w.added_at DESC
            LIMIT %s OFFSET %s""",
        params + [limit, offset]
    )
    rows = cursor.fetchall()
    cursor.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "added_at": str(r["added_at"]),
            "product": {
                "id": r["p_id"],
                "name": r["name"],
                "brand": r["brand"],
                "price": float(r["price"]),
                "image_url": r["image_url"],
                "primary_color": r["primary_color"],
                "color_hex": r["color_hex"],
                "category": {"id": r["cat_id"], "name": r["cat_name"], "slug": r["cat_slug"]},
            },
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.post("", status_code=201)
def add_to_wardrobe(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    product_id = body.get("product_id")
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id là bắt buộc")

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    # Check duplicate
    cursor.execute("SELECT id FROM wardrobe_items WHERE user_id = %s AND product_id = %s", (current_user["id"], product_id))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=409, detail="Sản phẩm đã có trong tủ đồ")

    cursor.execute(
        "INSERT INTO wardrobe_items (user_id, product_id) VALUES (%s, %s)",
        (current_user["id"], product_id)
    )
    db.commit()
    item_id = cursor.lastrowid
    cursor.close()

    return {"success": True, "data": {"id": item_id, "product_id": product_id}}


@router.delete("/{wardrobe_item_id}")
def remove_from_wardrobe(
    wardrobe_item_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM wardrobe_items WHERE id = %s AND user_id = %s", (wardrobe_item_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    cursor.execute("DELETE FROM wardrobe_items WHERE id = %s", (wardrobe_item_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã xóa khỏi tủ đồ"}


@router.get("/outfits")
def get_outfits(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    offset = (page - 1) * limit
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) AS total FROM outfits WHERE user_id = %s", (current_user["id"],))
    total = cursor.fetchone()["total"]

    cursor.execute(
        """SELECT id, name, description, occasion, preview_url, created_at
           FROM outfits WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s""",
        (current_user["id"], limit, offset)
    )
    outfits = cursor.fetchall()

    result = []
    for o in outfits:
        cursor.execute(
            """SELECT oi.id, p.id AS p_id, p.name, p.image_url, p.primary_color
               FROM outfit_items oi
               JOIN wardrobe_items w ON w.id = oi.wardrobe_item_id
               JOIN products p ON p.id = w.product_id
               WHERE oi.outfit_id = %s""",
            (o["id"],)
        )
        items = cursor.fetchall()
        result.append({
            "id": o["id"],
            "name": o["name"],
            "description": o["description"],
            "occasion": o["occasion"],
            "preview_url": o["preview_url"],
            "created_at": str(o["created_at"]),
            "items": [{"id": i["id"], "product": {"id": i["p_id"], "name": i["name"], "image_url": i["image_url"], "primary_color": i["primary_color"]}} for i in items],
        })

    cursor.close()
    return {
        "success": True,
        "data": {
            "items": result,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.post("/outfits", status_code=201)
def create_outfit(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    name = body.get("name", "Outfit mới")
    description = body.get("description", "")
    occasion = body.get("occasion", "casual")
    wardrobe_item_ids = body.get("wardrobe_item_ids", [])
    preview_url = body.get("preview_url", "")

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO outfits (user_id, name, description, occasion, preview_url) VALUES (%s, %s, %s, %s, %s)",
        (current_user["id"], name, description, occasion, preview_url)
    )
    db.commit()
    outfit_id = cursor.lastrowid

    for wid in wardrobe_item_ids:
        cursor.execute("INSERT IGNORE INTO outfit_items (outfit_id, wardrobe_item_id) VALUES (%s, %s)", (outfit_id, wid))
    db.commit()
    cursor.close()

    return {"success": True, "data": {"id": outfit_id, "name": name}}


@router.get("/outfits/{outfit_id}")
def get_outfit(
    outfit_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM outfits WHERE id = %s AND user_id = %s", (outfit_id, current_user["id"]))
    outfit = cursor.fetchone()
    if not outfit:
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy outfit")

    cursor.execute(
        """SELECT oi.id, p.id AS p_id, p.name, p.image_url, p.primary_color, p.color_hex, p.brand, p.price
           FROM outfit_items oi
           JOIN wardrobe_items w ON w.id = oi.wardrobe_item_id
           JOIN products p ON p.id = w.product_id
           WHERE oi.outfit_id = %s""",
        (outfit_id,)
    )
    items = cursor.fetchall()
    cursor.close()

    outfit["created_at"] = str(outfit.get("created_at", ""))
    outfit["updated_at"] = str(outfit.get("updated_at", ""))
    outfit["items"] = [
        {"id": i["id"], "product": {"id": i["p_id"], "name": i["name"], "image_url": i["image_url"],
                                     "primary_color": i["primary_color"], "color_hex": i["color_hex"],
                                     "brand": i["brand"], "price": float(i["price"])}}
        for i in items
    ]
    return {"success": True, "data": outfit}


@router.put("/outfits/{outfit_id}")
def update_outfit(
    outfit_id: int,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM outfits WHERE id = %s AND user_id = %s", (outfit_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy outfit")

    updates = []
    params = []
    for field in ("name", "description", "occasion", "preview_url"):
        if field in body:
            updates.append(f"{field} = %s")
            params.append(body[field])

    if updates:
        cursor.execute(f"UPDATE outfits SET {', '.join(updates)} WHERE id = %s", params + [outfit_id])
        db.commit()

    if "wardrobe_item_ids" in body:
        cursor.execute("DELETE FROM outfit_items WHERE outfit_id = %s", (outfit_id,))
        for wid in body["wardrobe_item_ids"]:
            cursor.execute("INSERT IGNORE INTO outfit_items (outfit_id, wardrobe_item_id) VALUES (%s, %s)", (outfit_id, wid))
        db.commit()

    cursor.close()
    return {"success": True, "message": "Đã cập nhật outfit"}


@router.delete("/outfits/{outfit_id}")
def delete_outfit(
    outfit_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM outfits WHERE id = %s AND user_id = %s", (outfit_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy outfit")
    cursor.execute("DELETE FROM outfit_items WHERE outfit_id = %s", (outfit_id,))
    cursor.execute("DELETE FROM outfits WHERE id = %s", (outfit_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã xóa outfit"}


@router.post("/outfits/{outfit_id}/export")
def export_outfit(
    outfit_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM outfits WHERE id = %s AND user_id = %s", (outfit_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy outfit")
    cursor.close()

    # Mock export
    export_url = f"https://smartfit.example.com/exports/outfit_{outfit_id}.png"
    return {
        "success": True,
        "data": {
            "export_url": export_url,
            "outfit_id": outfit_id,
        }
    }
