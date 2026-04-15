from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user
from app.services.cloudinary_service import upload_image, _validate_image

router = APIRouter(prefix="/ai-stylist", tags=["AI Stylist"])


@router.post("/analyze")
def analyze(
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    from app.services.ai_service import analyze_skin_tone, analyze_body_shape

    contents = photo.file.read()
    _validate_image(contents, photo.content_type)

    # Upload photo
    upload_result = upload_image(contents, folder="smartfit/analysis")
    photo_url = upload_result["url"]

    # Run models
    skin_result = analyze_skin_tone(contents)
    body_result = analyze_body_shape(contents)

    # Save to DB (best-effort)
    try:
        import json as _json
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """INSERT INTO user_analysis (user_id, photo_url, fitzpatrick_level, color_season,
               body_shape, recommended_colors)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                current_user["id"],
                photo_url,
                skin_result["fitzpatrick_level"],
                skin_result["color_season"],
                body_result["body_shape"],
                _json.dumps(skin_result["recommended_colors"]),
            )
        )
        db.commit()
        analysis_id = cursor.lastrowid
        cursor.close()
    except Exception:
        analysis_id = None

    from datetime import datetime
    return {
        "success": True,
        "data": {
            "analysis_id": analysis_id,
            "photo_url": photo_url,
            "skin_tone": {
                "fitzpatrick_level": skin_result["fitzpatrick_level"],
                "color_season": skin_result["color_season"],
                "season_description": skin_result.get("season_description", ""),
                "description": skin_result["description"],
                "recommended_colors": skin_result["recommended_colors"],
            },
            "body_shape": {
                "shape": body_result["body_shape"],
                "description": body_result["description"],
                "style_tips": body_result.get("style_tips", []),
            },
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }


@router.post("/recommend")
def recommend(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    from app.services.ai_service import recommend_outfits

    skin_tone = body.get("color_season", "Spring")
    body_shape = body.get("body_shape", "rectangle")
    occasion = body.get("occasion", "casual")
    gender = body.get("gender", "female")  # 'male' | 'female'
    if gender not in ("male", "female"):
        gender = "female"
    preferences = body.get("preferences", {})

    outfits = recommend_outfits(skin_tone, body_shape, occasion, gender, preferences, db)

    # product_suggestions: outfits already contains DB products
    product_suggestions = outfits

    return {
        "success": True,
        "data": {
            "outfits": outfits,
            "product_suggestions": product_suggestions,
            "occasion": occasion,
        }
    }


@router.get("/analysis-history")
def analysis_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    offset = (page - 1) * limit
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM user_analysis WHERE user_id = %s", (current_user["id"],))
        total = cursor.fetchone()["total"]
        cursor.execute(
            """SELECT id, photo_url, fitzpatrick_level, color_season, body_shape,
                      recommended_colors, created_at
               FROM user_analysis WHERE user_id = %s
               ORDER BY created_at DESC LIMIT %s OFFSET %s""",
            (current_user["id"], limit, offset)
        )
        rows = cursor.fetchall()
        cursor.close()
        import json as _json
        items = []
        for r in rows:
            colors = r["recommended_colors"]
            if isinstance(colors, str):
                try:
                    colors = _json.loads(colors)
                except Exception:
                    colors = []
            elif colors is None:
                colors = []
            items.append({
                "id": r["id"],
                "photo_url": r["photo_url"],
                "skin_tone": {
                    "fitzpatrick_level": r["fitzpatrick_level"],
                    "color_season": r["color_season"],
                    "recommended_colors": colors,
                },
                "body_shape": r["body_shape"],
                "created_at": str(r["created_at"]),
            })
    except Exception:
        items = []
        total = 0

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.get("/color-palette")
def color_palette(
    season: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    from app.services.ai_service import COLOR_PALETTES, SEASON_DESC

    if season and season in COLOR_PALETTES:
        palettes = {season: COLOR_PALETTES[season]}
    else:
        palettes = COLOR_PALETTES

    result = []
    season_names = {
        "Winter": "Mùa Đông",
        "Summer": "Mùa Hè",
        "Spring": "Mùa Xuân",
        "Autumn": "Mùa Thu",
    }
    for s, colors in palettes.items():
        result.append({
            "season": s,
            "season_vn": season_names.get(s, s),
            "season_description": SEASON_DESC.get(s, ""),
            "colors": colors,
        })

    return {"success": True, "data": result}
