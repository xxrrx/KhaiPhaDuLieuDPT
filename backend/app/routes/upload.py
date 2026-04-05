"""
Route dùng để test Cloudinary upload/delete/list độc lập với Postman.
Không cần auth — chỉ dùng trong giai đoạn phát triển.
"""
from fastapi import APIRouter, UploadFile, File, Path, Query
from app.services.cloudinary_service import (
    upload_image,
    delete_image,
    get_images_in_folder,
    _validate_image,
)

router = APIRouter(prefix="/upload", tags=["Upload (Test)"])


@router.post("/image")
async def test_upload_image(
    file: UploadFile = File(...),
    folder: str = Query("smartfit/test"),
):
    """Test upload ảnh lên Cloudinary. Trả về URL trong < 3 giây."""
    contents = await file.read()
    _validate_image(contents, file.content_type)
    result = upload_image(contents, folder=folder)
    return {"success": True, "data": result}


@router.delete("/image")
def test_delete_image(public_id: str = Query(..., description="public_id từ Cloudinary")):
    """Xóa ảnh theo public_id."""
    result = delete_image(public_id)
    if result.get("result") != "ok":
        return {"success": False, "message": "Không tìm thấy ảnh hoặc đã xóa rồi"}
    return {"success": True, "message": "Đã xóa ảnh"}


@router.get("/images")
def test_list_images(
    folder: str = Query("smartfit/test"),
    max_results: int = Query(50, ge=1, le=500),
):
    """Lấy danh sách ảnh trong folder Cloudinary."""
    images = get_images_in_folder(folder, max_results)
    return {"success": True, "data": images, "count": len(images)}
