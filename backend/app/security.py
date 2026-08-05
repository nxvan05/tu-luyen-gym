"""Tạo và xác minh JWT (HS256)."""

from datetime import UTC, datetime, timedelta

import jwt

from app.config import settings


def create_token(
    discord_id: str,
    username: str,
    display_name: str | None,
    avatar_url: str | None,
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": discord_id,
        "username": username,
        "display_name": display_name,
        "avatar": avatar_url,
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
