"""Đăng nhập: Discord OAuth → upsert cultivator → trả JWT."""

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import db
from app.config import settings
from app.security import create_token

router = APIRouter(prefix="/api", tags=["auth"])

DISCORD_API = "https://discord.com/api"


class DiscordAuthRequest(BaseModel):
    code: str


def _discord_exchange(code: str) -> str:
    body = {
        "client_id": settings.discord_client_id,
        "client_secret": settings.discord_client_secret,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.discord_redirect_uri,
    }
    with httpx.Client(timeout=15) as client:
        res = client.post(f"{DISCORD_API}/oauth2/token", data=body)
        if res.status_code != 200:
            raise HTTPException(401, "Discord trao đổi code thất bại")
        return res.json()["access_token"]


def _discord_user(access_token: str) -> dict:
    with httpx.Client(timeout=15) as client:
        res = client.get(
            f"{DISCORD_API}/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if res.status_code != 200:
            raise HTTPException(401, "Không lấy được thông tin Discord")
        return res.json()


def _avatar_url(user: dict) -> str | None:
    if user.get("avatar"):
        return f"https://cdn.discordapp.com/avatars/{user['id']}/{user['avatar']}.png?size=128"
    idx = int(user.get("discriminator", "0")) % 5
    return f"https://cdn.discordapp.com/embed/avatars/{idx}.png"


def _upsert_cultivator(user: dict) -> dict:
    discord_id = str(user["id"])
    avatar = _avatar_url(user)
    name = user.get("global_name") or user["username"]

    existing = db.select_one("cultivators", discord_id=f"eq.{discord_id}")
    if existing:
        db.update(
            "cultivators",
            {"username": user["username"], "display_name": name, "avatar_url": avatar},
            discord_id=f"eq.{discord_id}",
        )
        return existing

    return db.insert(
        "cultivators",
        {
            "discord_id": discord_id,
            "username": user["username"],
            "display_name": name,
            "avatar_url": avatar,
        },
    )


@router.post("/auth/discord")
def auth_discord(req: DiscordAuthRequest) -> dict:
    access_token = _discord_exchange(req.code)
    user = _discord_user(access_token)
    cultivator = _upsert_cultivator(user)

    token = create_token(
        str(user["id"]),
        user["username"],
        name,
        cultivator.get("avatar_url"),
    )

    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "username": user["username"],
            "global_name": user.get("global_name"),
            "avatar_url": cultivator.get("avatar_url"),
            "cultivator_id": cultivator["id"],
        },
    }
