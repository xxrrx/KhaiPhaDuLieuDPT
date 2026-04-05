import cloudinary.uploader
import cloudinary.api
from fastapi import HTTPException
import base64
import re

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _validate_image(content: bytes, content_type: str):
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file JPG, PNG, WEBP")
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File quá lớn, tối đa 10MB")


def upload_image(file_bytes: bytes, folder: str = "smartfit") -> dict:
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result["width"],
        "height": result["height"],
        "format": result["format"],
    }


def upload_base64_image(data_uri: str, folder: str = "smartfit") -> dict:
    """Upload ảnh base64 (từ AR canvas snapshot)."""
    # Tách phần header data:image/jpeg;base64,...
    match = re.match(r"data:image/(\w+);base64,(.+)", data_uri, re.DOTALL)
    if not match:
        raise HTTPException(status_code=400, detail="Định dạng base64 không hợp lệ")
    img_bytes = base64.b64decode(match.group(2))
    return upload_image(img_bytes, folder=folder)


def delete_image(public_id: str) -> dict:
    result = cloudinary.uploader.destroy(public_id)
    return result


def get_images_in_folder(folder: str = "smartfit", max_results: int = 50) -> list:
    result = cloudinary.api.resources(
        type="upload",
        prefix=folder,
        max_results=max_results,
    )
    return [
        {"url": r["secure_url"], "public_id": r["public_id"]}
        for r in result.get("resources", [])
    ]
