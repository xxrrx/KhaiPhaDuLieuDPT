from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from mysql.connector.connection import MySQLConnection
from app.database import get_db
from app.services.auth_service import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: MySQLConnection = Depends(get_db),
) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = int(payload["sub"])

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, username, email, full_name, avatar_url, bio, role, is_active FROM users WHERE id = %s",
        (user_id,),
    )
    user = cursor.fetchone()
    cursor.close()

    if not user or not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại")
    return user
