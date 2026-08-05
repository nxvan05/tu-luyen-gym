from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.config import settings
from app.game import router as game_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend Tu Luyện Gym — Duolingo dành cho Gym, lấy cảm hứng tu tiên.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(game_router)


@app.get("/health")
def health() -> dict[str, str]:
    """Kiểm tra backend còn sống hay không."""
    return {"status": "ok", "time": datetime.now(UTC).isoformat()}
