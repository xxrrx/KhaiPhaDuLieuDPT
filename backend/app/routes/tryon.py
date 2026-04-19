from fastapi import APIRouter, Depends, Query, HTTPException
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user
from app.services.cloudinary_service import upload_base64_image

router = APIRouter(prefix="/tryon", tags=["Try-On"])


@router.post("/save-ar-result", status_code=201)
def save_ar_result(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    image_base64 = body.get("image_base64", "")
    product_id = body.get("product_id")

    result = upload_base64_image(image_base64, folder="smartfit/tryon/ar")
    result_url = result["url"]

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """INSERT INTO try_on_history (user_id, product_id, user_photo_url, result_url, method, processing_time)
           VALUES (%s, %s, %s, %s, 'webcam', 0)""",
        (current_user["id"], product_id, result_url, result_url)
    )
    db.commit()
    history_id = cursor.lastrowid
    cursor.close()

    from datetime import datetime
    return {
        "success": True,
        "data": {
            "history_id": history_id,
            "result_url": result_url,
            "user_photo_url": result_url,
            "product_id": product_id,
            "processing_time": 0,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }


@router.get("/history")
def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    product_id: int = Query(None),
    method: str = Query(None),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    conditions = ["h.user_id = %s"]
    params = [current_user["id"]]

    if product_id:
        conditions.append("h.product_id = %s")
        params.append(product_id)
    if method:
        conditions.append("h.method = %s")
        params.append(method)

    where = "WHERE " + " AND ".join(conditions)
    offset = (page - 1) * limit

    cursor = db.cursor(dictionary=True)
    cursor.execute(f"SELECT COUNT(*) AS total FROM try_on_history h {where}", params)
    total = cursor.fetchone()["total"]

    cursor.execute(
        f"""SELECT h.id, h.result_url, h.method, h.processing_time, h.created_at,
                   p.id AS p_id, p.name AS p_name, p.image_url AS p_image
            FROM try_on_history h
            JOIN products p ON p.id = h.product_id
            {where}
            ORDER BY h.created_at DESC
            LIMIT %s OFFSET %s""",
        params + [limit, offset]
    )
    rows = cursor.fetchall()
    cursor.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "product": {"id": r["p_id"], "name": r["p_name"], "image_url": r["p_image"]},
            "result_url": r["result_url"],
            "method": r["method"],
            "processing_time": float(r["processing_time"] or 0),
            "created_at": str(r["created_at"]),
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.delete("/history/{history_id}")
def delete_history(
    history_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM try_on_history WHERE id = %s AND user_id = %s", (history_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    cursor.execute("DELETE FROM try_on_history WHERE id = %s", (history_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã xóa"}
