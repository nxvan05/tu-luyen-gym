"""C.4 — Gửi thông báo chiến tích lên Discord sau check-in.

Cần DISCORD_WEBHOOK_URL trong .env (Server Settings → Integrations → Webhooks).
Nếu chưa có thì bỏ qua im lặng.
"""

import httpx

from app.config import settings


def notify_checkin(name: str, streak: int, exp: int, damage: int) -> None:
    url = settings.discord_webhook_url
    if not url:
        return

    message = (
        f"⚡ **{name}** đã đột phá!\n"
        f"🔥 Chuỗi **{streak}** ngày · **+{exp} EXP**\n"
        f"🐉 Gây **{damage:,}** sát thương lên Boss tuần"
    )

    try:
        with httpx.Client(timeout=10) as client:
            client.post(url, json={"content": message})
    except Exception as e:
        print(f"[webhook] Discord notify failed: {e}")
