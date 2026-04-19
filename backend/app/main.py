import app.config  # Phải import trước để khởi tạo Cloudinary config

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.auth import router as auth_router
from app.routes.products import router as products_router
from app.routes.upload import router as upload_router
from app.routes.tryon import router as tryon_router
from app.routes.ai_stylist import router as ai_stylist_router
from app.routes.wardrobe import router as wardrobe_router
from app.routes.trends import router as trends_router

app = FastAPI(
    title="SmartFit API",
    version="1.0.0",
    description="AR Virtual Try-On Fashion Website - Backend API",
)

# CORS — cho phép React dev server gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(upload_router, prefix=API_PREFIX)
app.include_router(tryon_router, prefix=API_PREFIX)
app.include_router(ai_stylist_router, prefix=API_PREFIX)
app.include_router(wardrobe_router, prefix=API_PREFIX)
app.include_router(trends_router, prefix=API_PREFIX)


# Handler lỗi chung — thêm CORS headers thủ công để browser nhận được detail lỗi
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ["http://localhost:3000", "http://localhost:5173"]:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "INTERNAL_ERROR", "message": str(exc)},
        headers=headers,
    )


@app.get("/")
def root():
    return {"message": "SmartFit API đang chạy", "docs": "/docs"}
