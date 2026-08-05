from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình backend. Đọc từ .env hoặc biến môi trường."""

    app_name: str = "Tu Luyện Gym API"
    env: str = "development"
    # CORS — URL frontend (Vercel khi deploy)
    cors_origins: list[str] = ["http://localhost:3000"]

    # Supabase (Project URL + secret key — key SECRET không bao giờ ở frontend)
    supabase_url: str = ""
    supabase_secret_key: str = ""

    # Discord OAuth — backend thực hiện trao đổi code
    discord_client_id: str = ""
    discord_client_secret: str = ""
    discord_redirect_uri: str = "http://localhost:3000/api/auth/discord/callback"

    # Khóa ký JWT (chia sẻ với web/.env.local để verify)
    jwt_secret: str = "dev-secret-doi-truoc-khi-deploy"
    jwt_expire_days: int = 30

    # Tuần 4: Discord webhook
    discord_webhook_url: str | None = None

    # C.3: Gemini AI xác nhận ảnh check-in (aistudio.google.com)
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-flash-latest"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
