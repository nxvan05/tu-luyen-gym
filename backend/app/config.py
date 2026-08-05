from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình backend. Đọc từ .env hoặc biến môi trường."""

    app_name: str = "Tu Luyện Gym API"
    env: str = "development"
    # CORS — URL frontend (Vercel khi deploy)
    cors_origins: list[str] = ["http://localhost:3000"]
    # Discord webhook — thêm trong Tuần 4
    discord_webhook_url: str | None = None
    # Supabase (Tuần 2+)
    supabase_url: str | None = None
    supabase_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
