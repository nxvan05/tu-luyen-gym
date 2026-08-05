"""Supabase Storage — lưu ảnh check-in (bucket công khai "checkins")."""

import uuid
from datetime import UTC, datetime

import httpx

from app.config import settings

BUCKET = "checkins"

_headers = {
    "Authorization": f"Bearer {settings.supabase_secret_key}",
    "apikey": settings.supabase_secret_key,
}

storage_base = settings.supabase_url.rstrip("/") + "/storage/v1"


def ensure_bucket() -> None:
    """Tạo bucket nếu chưa có (an toàn khi chạy lại)."""
    with httpx.Client(timeout=15) as client:
        res = client.post(
            f"{storage_base}/bucket",
            json={"name": BUCKET, "public": True},
            headers=_headers,
        )
        if res.status_code == 409:  # đã tồn tại
            return
        if res.status_code != 200:
            print(f"[storage] create bucket failed: {res.status_code} {res.text[:200]}")


def upload_image(cultivator_id: str, image_bytes: bytes, mime: str) -> str | None:
    """Upload ảnh lên bucket, trả URL công khai."""
    ext = "jpg" if "png" not in mime else "png"
    date = datetime.now(UTC).strftime("%Y%m%d")
    path = f"{cultivator_id}/{date}/{uuid.uuid4().hex}.{ext}"
    try:
        with httpx.Client(timeout=20) as client:
            res = client.post(
                f"{storage_base}/object/{BUCKET}/{path}",
                headers={**_headers, "Content-Type": mime or "image/jpeg"},
                content=image_bytes,
            )
            res.raise_for_status()
        return f"{settings.supabase_url}/storage/v1/object/public/{BUCKET}/{path}"
    except Exception as e:
        print(f"[storage] upload failed: {e}")
        return None
