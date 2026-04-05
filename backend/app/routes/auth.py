from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.dependencies import get_current_user
from app.models.schemas import RegisterRequest, LoginRequest, UpdateProfileRequest
from app.services.auth_service import hash_password, verify_password, create_access_token, JWT_EXPIRE_HOURS
from app.services.cloudinary_service import upload_image, _validate_image
from app.config import JWT_EXPIRE_HOURS

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # Kiểm tra trùng username/email
    cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (body.username, body.email))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=400, detail="Username hoặc email đã tồn tại")

    hashed = hash_password(body.password)
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, full_name) VALUES (%s, %s, %s, %s)",
        (body.username, body.email, hashed, body.full_name),
    )
    db.commit()
    user_id = cursor.lastrowid

    cursor.execute("SELECT id, username, email, full_name, created_at FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    return {
        "success": True,
        "data": {
            "user_id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": str(user["created_at"]),
        },
        "message": "Đăng ký thành công",
    }


@router.post("/login")
def login(body: LoginRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, username, email, full_name, avatar_url, password_hash, role, is_active FROM users WHERE username = %s",
        (body.username,),
    )
    user = cursor.fetchone()
    cursor.close()

    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khoá")

    token = create_access_token(user["id"], user["username"])

    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": JWT_EXPIRE_HOURS * 3600,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "avatar_url": user["avatar_url"],
                "role": user["role"],
            },
        },
    }


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    # JWT stateless — client xoá token phía mình
    return {"success": True, "message": "Đã đăng xuất"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"success": True, "data": current_user}


@router.put("/me")
def update_me(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    fields, values = [], []
    if body.full_name is not None:
        fields.append("full_name = %s")
        values.append(body.full_name)
    if body.bio is not None:
        fields.append("bio = %s")
        values.append(body.bio)

    if not fields:
        raise HTTPException(status_code=400, detail="Không có trường nào để cập nhật")

    values.append(current_user["id"])
    cursor = db.cursor(dictionary=True)
    cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
    db.commit()

    cursor.execute(
        "SELECT id, username, email, full_name, avatar_url, bio, role FROM users WHERE id = %s",
        (current_user["id"],),
    )
    updated = cursor.fetchone()
    cursor.close()
    return {"success": True, "data": updated}


@router.post("/avatar")
def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: MySQLConnection = Depends(get_db),
):
    contents = avatar.file.read()
    _validate_image(contents, avatar.content_type)

    result = upload_image(contents, folder="smartfit/avatars")
    avatar_url = result["url"]

    cursor = db.cursor()
    cursor.execute("UPDATE users SET avatar_url = %s WHERE id = %s", (avatar_url, current_user["id"]))
    db.commit()
    cursor.close()

    return {"success": True, "data": {"avatar_url": avatar_url}}
