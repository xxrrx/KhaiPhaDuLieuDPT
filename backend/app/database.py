import mysql.connector
from mysql.connector import pooling
from app.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="smartfit_pool",
            pool_size=10,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
        )
    return _pool


def get_db():
    """Dependency: trả về connection, tự động đóng sau khi dùng."""
    pool = get_pool()
    conn = pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()
