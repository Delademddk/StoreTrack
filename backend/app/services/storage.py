import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException

from app.core.config import settings


ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _get_upload_dir() -> Path:
    upload_dir = Path(settings.PRODUCT_IMAGE_UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _validate_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return ext


def _validate_mime_type(content_type: str | None) -> None:
    if not content_type or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )


def _validate_file_size(size: int) -> None:
    max_bytes = settings.PRODUCT_IMAGE_MAX_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.PRODUCT_IMAGE_MAX_SIZE_MB}MB",
        )


async def save_product_image(file: UploadFile) -> str:
    _validate_mime_type(file.content_type)

    content = await file.read()
    _validate_file_size(len(content))

    ext = _validate_extension(file.filename or "image.jpg")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = _get_upload_dir()
    file_path = upload_dir / unique_name

    file_path.write_bytes(content)

    return f"/uploads/products/{unique_name}"


def delete_product_image(image_path: str | None) -> None:
    if not image_path:
        return

    if image_path.startswith("/uploads/products/"):
        filename = image_path.split("/uploads/products/")[-1]
        if filename and "/" not in filename:
            upload_dir = _get_upload_dir()
            file_path = upload_dir / filename
            if file_path.exists() and file_path.is_file():
                file_path.unlink(missing_ok=True)
