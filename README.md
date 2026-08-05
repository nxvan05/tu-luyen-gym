# Tu Luyện Gym 🏯

**Duolingo dành cho Gym, lấy cảm hứng từ thế giới tu tiên.**

Người dùng không "đi tập" — họ đăng nhập để tiếp tục hành trình tu luyện.
Discord chỉ làm mạng xã hội; web mới là game.

## Kiến trúc

```
Discord (Cộng đồng + BXH)
   │  Webhook thông báo
   ▼
Web App (PWA) ──► PostgreSQL / Supabase
   ├── Check-in      ├── EXP / Streak
   ├── Pet           ├── Boss / Quest
   └── Thành tựu     └── Rank
```

## Cấu trúc repo

```
web/        Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + Framer Motion
backend/    FastAPI (Python) — API game + AI xác nhận ảnh + webhook Discord
```

## Chạy local

### Web (frontend)

```bash
cd web
cp .env.local.example .env.local   # điền DISCORD_CLIENT_ID/SECRET từ Discord Developer Portal
npm install
npm run dev        # http://localhost:3000
```

Tạo app Discord tại https://discord.com/developers/applications:
- **OAuth2 → Redirects**: `http://localhost:3000/api/auth/discord/callback`
- **Scope**: `identify`

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
# Health check: http://localhost:8000/health
```

## Lộ trình 30 ngày

| Tuần | Nội dung |
|------|----------|
| 1 | Trang chủ, login Discord, Dashboard, Check-in (đang ở đây) |
| 2 | EXP, Streak, Achievement, Leaderboard |
| 3 | Boss, Quest, Pet |
| 4 | Discord Webhook, Animation, Mobile UI, PWA |

## TODO nổi bật

- [ ] Thay session base64 bằng JWT do backend cấp (Tuần 1-2)
- [ ] AI xác nhận ảnh check-in (Tuần 1-2)
- [ ] Supabase schema + sync (Tuần 2)
- [ ] Webhook Discord sau mỗi check-in (Tuần 4)
- [ ] PWA offline-first (Tuần 4)
