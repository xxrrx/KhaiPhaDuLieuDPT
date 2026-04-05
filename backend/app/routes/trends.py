from fastapi import APIRouter, Depends, Query
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/trends", tags=["Trends"])

MOCK_TRENDS = [
    {"id": 1, "name": "Minimalist Fashion", "name_vn": "Thời trang tối giản", "category": "style", "score": 95, "change_pct": 12.5, "color": "#2C2C2C", "image_url": ""},
    {"id": 2, "name": "Y2K Revival", "name_vn": "Phong cách Y2K", "category": "style", "score": 88, "change_pct": 25.3, "color": "#FF69B4", "image_url": ""},
    {"id": 3, "name": "Cottagecore", "name_vn": "Phong cách đồng quê", "category": "style", "score": 75, "change_pct": 8.2, "color": "#8FBC8F", "image_url": ""},
    {"id": 4, "name": "Sage Green", "name_vn": "Xanh lá sáng", "category": "color", "score": 92, "change_pct": 18.7, "color": "#B2C4B2", "image_url": ""},
    {"id": 5, "name": "Butter Yellow", "name_vn": "Vàng bơ", "category": "color", "score": 85, "change_pct": 15.4, "color": "#FFFAA0", "image_url": ""},
    {"id": 6, "name": "Dusty Rose", "name_vn": "Hồng xám", "category": "color", "score": 80, "change_pct": 10.1, "color": "#DCAE96", "image_url": ""},
    {"id": 7, "name": "Wide-Leg Pants", "name_vn": "Quần ống rộng", "category": "item", "score": 90, "change_pct": 22.0, "color": "#8B6914", "image_url": ""},
    {"id": 8, "name": "Oversized Blazer", "name_vn": "Blazer oversized", "category": "item", "score": 87, "change_pct": 16.8, "color": "#708090", "image_url": ""},
    {"id": 9, "name": "Platform Shoes", "name_vn": "Giày đế bệt cao", "category": "item", "score": 82, "change_pct": 11.5, "color": "#2F2F2F", "image_url": ""},
]

MOCK_CHART_DATA = {
    "labels": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
    "datasets": [
        {
            "label": "Thời trang tối giản",
            "data": [60, 62, 68, 71, 74, 78, 82, 85, 88, 90, 93, 95],
            "color": "#2C2C2C",
        },
        {
            "label": "Phong cách Y2K",
            "data": [30, 35, 42, 50, 58, 62, 68, 73, 78, 82, 85, 88],
            "color": "#FF69B4",
        },
        {
            "label": "Xanh lá sáng",
            "data": [50, 55, 60, 65, 70, 73, 76, 80, 84, 87, 90, 92],
            "color": "#B2C4B2",
        },
    ]
}

MOCK_PREDICTIONS = [
    {"trend": "Quiet Luxury", "trend_vn": "Sang trọng tinh tế", "probability": 0.87, "timeline": "Q2 2026", "description": "Phong cách sang trọng nhưng tinh tế, ít logo, chất liệu cao cấp"},
    {"trend": "Digital Fashion", "trend_vn": "Thời trang kỹ thuật số", "probability": 0.72, "timeline": "Q3 2026", "description": "Trang phục AR/VR và NFT fashion"},
    {"trend": "Upcycled Fashion", "trend_vn": "Thời trang tái chế", "probability": 0.81, "timeline": "Q2 2026", "description": "Xu hướng thời trang bền vững từ vật liệu tái chế"},
    {"trend": "Gender Fluid", "trend_vn": "Thời trang phi giới tính", "probability": 0.76, "timeline": "Q1 2026", "description": "Trang phục không phân biệt giới tính"},
]


@router.get("")
def get_trends(
    category: str = Query(None, description="style|color|item"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    # Try DB first
    try:
        cursor = db.cursor(dictionary=True)
        conditions = []
        params = []
        if category:
            conditions.append("category = %s")
            params.append(category)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        cursor.execute(f"SELECT COUNT(*) AS total FROM trend_data {where}", params)
        total = cursor.fetchone()["total"]

        if total > 0:
            offset = (page - 1) * limit
            cursor.execute(
                f"SELECT * FROM trend_data {where} ORDER BY popularity_score DESC LIMIT %s OFFSET %s",
                params + [limit, offset]
            )
            rows = cursor.fetchall()
            cursor.close()
            for r in rows:
                r["recorded_at"] = str(r.get("recorded_at", ""))
            return {
                "success": True,
                "data": {
                    "items": rows,
                    "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
                }
            }
        cursor.close()
    except Exception:
        pass

    # Fallback to mock data
    trends = MOCK_TRENDS
    if category:
        trends = [t for t in trends if t["category"] == category]

    offset = (page - 1) * limit
    total = len(trends)
    paginated = trends[offset:offset + limit]

    return {
        "success": True,
        "data": {
            "items": paginated,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.get("/chart-data")
def get_chart_data(
    period: str = Query("year", description="month|quarter|year"),
    trend_ids: str = Query(None),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    # Try DB first, fall back to mock
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS cnt FROM trend_data")
        cnt = cursor.fetchone()["cnt"]
        cursor.close()
        if cnt == 0:
            raise Exception("empty")
    except Exception:
        pass

    return {"success": True, "data": MOCK_CHART_DATA}


@router.get("/predictions")
def get_predictions(
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    return {"success": True, "data": MOCK_PREDICTIONS}
