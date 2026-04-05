from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/social", tags=["Social"])


def _format_post(r: dict, current_user_id: int = None) -> dict:
    return {
        "id": r["id"],
        "caption": r.get("caption", ""),
        "image_url": r.get("image_url", ""),
        "created_at": str(r.get("created_at", "")),
        "likes_count": r.get("like_count", 0),
        "comments_count": r.get("comment_count", 0),
        "is_liked": bool(r.get("is_liked", False)),
        "user": {
            "id": r.get("u_id"),
            "username": r.get("u_username"),
            "full_name": r.get("u_full_name"),
            "avatar_url": r.get("u_avatar"),
        },
        "product": {
            "id": r.get("p_id"),
            "name": r.get("p_name"),
            "image_url": r.get("p_image"),
        } if r.get("p_id") else None,
    }


@router.get("/feed")
def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    offset = (page - 1) * limit
    uid = current_user["id"]
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM social_posts WHERE is_visible = 1", [])
    total = cursor.fetchone()["total"]

    cursor.execute(
        """SELECT sp.id, sp.caption, sp.image_url, sp.created_at,
                  sp.like_count, sp.comment_count,
                  u.id AS u_id, u.username AS u_username, u.full_name AS u_full_name, u.avatar_url AS u_avatar,
                  p.id AS p_id, p.name AS p_name, p.image_url AS p_image,
                  (SELECT COUNT(*) FROM likes l WHERE l.post_id = sp.id AND l.user_id = %s) AS is_liked
           FROM social_posts sp
           JOIN users u ON u.id = sp.user_id
           LEFT JOIN try_on_history t ON t.id = sp.try_on_id
           LEFT JOIN products p ON p.id = t.product_id
           WHERE sp.is_visible = 1
           ORDER BY sp.created_at DESC
           LIMIT %s OFFSET %s""",
        [uid, limit, offset]
    )
    rows = cursor.fetchall()
    cursor.close()

    return {
        "success": True,
        "data": {
            "items": [_format_post(r, uid) for r in rows],
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.get("/posts/{post_id}")
def get_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    uid = current_user["id"]
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT sp.id, sp.caption, sp.image_url, sp.created_at, sp.like_count, sp.comment_count,
                  u.id AS u_id, u.username AS u_username, u.full_name AS u_full_name, u.avatar_url AS u_avatar,
                  p.id AS p_id, p.name AS p_name, p.image_url AS p_image,
                  (SELECT COUNT(*) FROM likes l WHERE l.post_id = sp.id AND l.user_id = %s) AS is_liked
           FROM social_posts sp
           JOIN users u ON u.id = sp.user_id
           LEFT JOIN try_on_history t ON t.id = sp.try_on_id
           LEFT JOIN products p ON p.id = t.product_id
           WHERE sp.id = %s""",
        [uid, post_id]
    )
    row = cursor.fetchone()
    cursor.close()
    if not row:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    return {"success": True, "data": _format_post(row, uid)}


@router.post("/posts", status_code=201)
def create_post(
    caption: str = Form(""),
    try_on_id: int = Form(None),
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    from app.services.cloudinary_service import upload_image, _validate_image

    image_url = ""
    if image:
        contents = image.file.read()
        _validate_image(contents, image.content_type)
        result = upload_image(contents, folder="smartfit/social")
        image_url = result["url"]

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO social_posts (user_id, try_on_id, caption, image_url) VALUES (%s, %s, %s, %s)",
        (current_user["id"], try_on_id, caption, image_url)
    )
    db.commit()
    post_id = cursor.lastrowid
    cursor.close()

    from datetime import datetime
    return {
        "success": True,
        "data": {
            "id": post_id,
            "caption": caption,
            "image_url": image_url,
            "try_on_id": try_on_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM social_posts WHERE id = %s AND user_id = %s", (post_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    cursor.execute("DELETE FROM social_posts WHERE id = %s", (post_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã xóa bài viết"}


@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM social_posts WHERE id = %s", (post_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    cursor.execute(
        "INSERT IGNORE INTO likes (post_id, user_id) VALUES (%s, %s)",
        (post_id, current_user["id"])
    )
    if cursor.rowcount > 0:
        cursor.execute("UPDATE social_posts SET like_count = like_count + 1 WHERE id = %s", (post_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã thích"}


@router.delete("/posts/{post_id}/like")
def unlike_post(
    post_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("DELETE FROM likes WHERE post_id = %s AND user_id = %s", (post_id, current_user["id"]))
    if cursor.rowcount > 0:
        cursor.execute("UPDATE social_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = %s", (post_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã bỏ thích"}


@router.get("/posts/{post_id}/comments")
def get_comments(
    post_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    offset = (page - 1) * limit
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) AS total FROM comments WHERE post_id = %s", (post_id,))
    total = cursor.fetchone()["total"]

    cursor.execute(
        """SELECT c.id, c.content, c.created_at,
                  u.id AS u_id, u.username AS u_username, u.full_name AS u_full_name, u.avatar_url AS u_avatar
           FROM comments c
           JOIN users u ON u.id = c.user_id
           WHERE c.post_id = %s
           ORDER BY c.created_at ASC
           LIMIT %s OFFSET %s""",
        (post_id, limit, offset)
    )
    rows = cursor.fetchall()
    cursor.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "content": r["content"],
            "created_at": str(r["created_at"]),
            "user": {"id": r["u_id"], "username": r["u_username"], "full_name": r["u_full_name"], "avatar_url": r["u_avatar"]},
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit}
        }
    }


@router.post("/posts/{post_id}/comments", status_code=201)
def add_comment(
    post_id: int,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Nội dung bình luận không được trống")

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM social_posts WHERE id = %s", (post_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")

    cursor.execute(
        "INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s)",
        (post_id, current_user["id"], content)
    )
    cursor.execute("UPDATE social_posts SET comment_count = comment_count + 1 WHERE id = %s", (post_id,))
    db.commit()
    comment_id = cursor.lastrowid
    cursor.close()

    from datetime import datetime
    return {
        "success": True,
        "data": {
            "id": comment_id,
            "content": content,
            "post_id": post_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
    }


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, post_id FROM comments WHERE id = %s AND user_id = %s", (comment_id, current_user["id"]))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy bình luận")
    post_id = row["post_id"]
    cursor.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
    cursor.execute("UPDATE social_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = %s", (post_id,))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã xóa bình luận"}


@router.post("/follow/{user_id}")
def follow_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Không thể tự theo dõi chính mình")
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    cursor.execute(
        "INSERT IGNORE INTO follows (follower_id, following_id) VALUES (%s, %s)",
        (current_user["id"], user_id)
    )
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã theo dõi"}


@router.delete("/follow/{user_id}")
def unfollow_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("DELETE FROM follows WHERE follower_id = %s AND following_id = %s", (current_user["id"], user_id))
    db.commit()
    cursor.close()
    return {"success": True, "message": "Đã bỏ theo dõi"}


@router.get("/users/{user_id}/profile")
def get_user_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, username, full_name, avatar_url, bio, created_at FROM users WHERE id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    if not user:
        cursor.close()
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    # Stats
    cursor.execute("SELECT COUNT(*) AS cnt FROM social_posts WHERE user_id = %s", (user_id,))
    posts_count = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) AS cnt FROM follows WHERE following_id = %s", (user_id,))
    followers_count = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) AS cnt FROM follows WHERE follower_id = %s", (user_id,))
    following_count = cursor.fetchone()["cnt"]
    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM follows WHERE follower_id = %s AND following_id = %s",
        (current_user["id"], user_id)
    )
    is_following = bool(cursor.fetchone()["cnt"])

    # Recent posts
    cursor.execute(
        """SELECT id, caption, image_url, like_count, comment_count, created_at
           FROM social_posts WHERE user_id = %s ORDER BY created_at DESC LIMIT 12""",
        (user_id,)
    )
    posts = cursor.fetchall()
    for p in posts:
        p["created_at"] = str(p["created_at"])

    cursor.close()

    user["created_at"] = str(user.get("created_at", ""))
    return {
        "success": True,
        "data": {
            "user": user,
            "stats": {
                "posts_count": posts_count,
                "followers_count": followers_count,
                "following_count": following_count,
            },
            "is_following": is_following,
            "recent_posts": posts,
        }
    }
