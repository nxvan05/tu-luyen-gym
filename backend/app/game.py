"""Logic trò chơi: check-in, EXP, streak, boss, achievements, leaderboard."""

import base64
from collections import defaultdict
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app import db
from app.ai import generate_journal, verify_gym_photo
from app.notify import notify_checkin
from app.security import verify_token
from app.storage import ensure_bucket, upload_image

router = APIRouter(prefix="/api", tags=["game"])

bearer = HTTPBearer(auto_error=False)

# EXP theo loại buổi tập — đồng bộ với bảng quests
WORKOUT_EXP = {"push": 120, "pull": 120, "legs": 130, "cardio": 90, "rest": 40}
WORKOUT_LABELS = {
    "push": "Luyện Thể · Đẩy tạ",
    "pull": "Luyện Thể · Kéo xà",
    "legs": "Luyện Thể · Chân",
    "cardio": "Thân Pháp · Chạy bộ",
    "rest": "Tĩnh Tâm",
}

# Nhánh Cây Đạo tương ứng với loại buổi tập
PATH_BY_WORKOUT = {
    "push": "luyen_the",
    "pull": "luyen_the",
    "legs": "luyen_the",
    "cardio": "than_phap",
    "rest": "tinh_tam",
}
PATH_META = {
    "luyen_the": {"name": "Luyện Thể", "emoji": "💪"},
    "than_phap": {"name": "Thân Pháp", "emoji": "🏃"},
    "tinh_tam": {"name": "Tĩnh Tâm", "emoji": "🧘"},
}
# Sát thương Boss = EXP * hệ số
BOSS_DAMAGE_PER_EXP = 100
BOSS_SEASON = 1
MAX_PHOTO_BYTES = 6 * 1024 * 1024


class CheckinRequest(BaseModel):
    workout_type: str
    photo_url: str | None = None
    photo: str | None = None  # data URL base64, ví dụ "data:image/jpeg;base64,..."


def current_cultivator(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
) -> dict:
    if not credentials:
        raise HTTPException(401, "Thiếu token")
    claims = verify_token(credentials.credentials)
    if not claims:
        raise HTTPException(401, "Token không hợp lệ")
    cultivator = db.select_one("cultivators", discord_id=f"eq.{claims['sub']}")
    if not cultivator:
        raise HTTPException(404, "Chưa có tài khoản tu luyện")
    return cultivator


def _today_utc() -> date:
    return datetime.now(UTC).date()


def exp_to_next(level: int) -> int:
    return 500 + (level - 1) * 250


def _apply_exp(cultivator: dict, gained: int) -> dict:
    exp = cultivator["exp"] + gained
    level = cultivator["level"]
    threshold = exp_to_next(level)
    while exp >= threshold:
        exp -= threshold
        level += 1
        threshold = exp_to_next(level)
    return {"level": level, "exp": exp}


def _apply_path_exp(cultivator_id: str, workout_type: str, gained: int) -> None:
    """Cộng EXP vào nhánh Cây Đạo tương ứng."""
    code = PATH_BY_WORKOUT.get(workout_type)
    if not code:
        return
    existing = db.select_one("dao_paths", cultivator_id=f"eq.{cultivator_id}", code=f"eq.{code}")
    if existing:
        db.update(
            "dao_paths",
            {"exp": existing["exp"] + gained},
            cultivator_id=f"eq.{cultivator_id}",
            code=f"eq.{code}",
        )
    else:
        db.insert(
            "dao_paths",
            {"cultivator_id": cultivator_id, "code": code, "exp": gained},
        )


def path_level_and_rest(exp: int) -> tuple[int, int]:
    """Mức nhánh từ EXP — công thức giống exp_to_next."""
    level = 1
    threshold = exp_to_next(level)
    rest = exp
    while rest >= threshold:
        rest -= threshold
        level += 1
        threshold = exp_to_next(level)
    return level, rest


def _apply_streak(cultivator: dict, today: date) -> tuple[int, int]:
    last = cultivator.get("last_checkin_date")
    if last is None:
        streak = 1
    else:
        last_date = datetime.fromisoformat(last).date() if isinstance(last, str) else last
        if last_date == today:
            streak = cultivator["streak"]
        elif (today - last_date).days == 1:
            streak = cultivator["streak"] + 1
        else:
            streak = 1
    return streak, max(streak, cultivator["best_streak"])


def _apply_boss_damage(cultivator: dict, damage: int, checkin_id: str) -> None:
    boss = db.select_one("bosses", season=f"eq.{BOSS_SEASON}")
    if not boss:
        return
    new_hp = max(0, boss["hp"] - damage)
    db.update("bosses", {"hp": new_hp}, id=f"eq.{boss['id']}")
    db.insert(
        "boss_damage",
        {
            "boss_id": boss["id"],
            "cultivator_id": cultivator["id"],
            "damage": damage,
            "checkin_id": checkin_id,
        },
    )


_ACHIEVEMENT_RULES = {
    "first_checkin": lambda c: c["streak"] >= 1,
    "streak_7": lambda c: c["streak"] >= 7,
    "streak_30": lambda c: c["streak"] >= 30,
    "streak_100": lambda c: c["streak"] >= 100,
    "realm_golden": lambda c: c["level"] >= 30,
    "boss_killer": lambda c: False,  # cập nhật khi boss bị hạ
}


def _apply_achievements(cultivator: dict) -> list[dict]:
    unlocked = [
        a["achievement_id"]
        for a in db.select(
            "user_achievements",
            cultivator_id=f"eq.{cultivator['id']}",
            select="achievement_id",
        )
    ]
    earned: list[dict] = []
    for code, rule in _ACHIEVEMENT_RULES.items():
        if rule(cultivator):
            ach = db.select_one("achievements", code=f"eq.{code}")
            if ach and ach["id"] not in unlocked:
                db.insert(
                    "user_achievements",
                    {"cultivator_id": cultivator["id"], "achievement_id": ach["id"]},
                )
                earned.append(ach)
    return earned


def _handle_photo(req: CheckinRequest, cultivator: dict) -> str | None:
    """Xác nhận ảnh bằng AI (nếu cấu hình) rồi upload lên Storage."""
    if not req.photo:
        return None

    header, _, b64 = req.photo.partition(",")
    mime = (
        header.removeprefix("data:").split(";")[0]
        if header.startswith("data:")
        else "image/jpeg"
    )
    try:
        image_bytes = base64.b64decode(b64 or req.photo)
    except Exception:
        raise HTTPException(422, "Ảnh không hợp lệ (base64 sai)")

    if len(image_bytes) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "Ảnh quá lớn (tối đa 6MB)")

    verdict = verify_gym_photo(image_bytes, mime)
    if not verdict.valid:
        raise HTTPException(422, f"Ảnh không hợp lệ: {verdict.reason}")

    ensure_bucket()
    return upload_image(cultivator["id"], image_bytes, mime)


@router.post("/checkin")
def checkin(req: CheckinRequest, cultivator: dict = Depends(current_cultivator)) -> dict:
    if req.workout_type not in WORKOUT_EXP:
        raise HTTPException(422, "Loại buổi tập không hợp lệ")

    today = _today_utc()
    if cultivator["last_checkin_date"] and _parse_date(cultivator["last_checkin_date"]) == today:
        raise HTTPException(409, "Hôm nay đã bế quan rồi")

    photo_url = _handle_photo(req, cultivator)

    gained = WORKOUT_EXP[req.workout_type]
    streak, best_streak = _apply_streak(cultivator, today)
    leveled = _apply_exp(cultivator, gained)

    record = db.insert(
        "checkins",
        {
            "cultivator_id": cultivator["id"],
            "workout_type": req.workout_type,
            "photo_url": photo_url or req.photo_url,
            "exp_gained": gained,
            "checked_in_date": today.isoformat(),
        },
    )

    db.update(
        "cultivators",
        {
            **leveled,
            "streak": streak,
            "best_streak": best_streak,
            "last_checkin_date": today.isoformat(),
        },
        id=f"eq.{cultivator['id']}",
    )

    cultivator.update({**leveled, "streak": streak, "best_streak": best_streak})

    _apply_path_exp(cultivator["id"], req.workout_type, gained)

    damage = gained * BOSS_DAMAGE_PER_EXP
    _apply_boss_damage(cultivator, damage, record["id"])
    achievements = _apply_achievements(cultivator)

    notify_checkin(
        name=cultivator.get("display_name") or cultivator["username"],
        streak=streak,
        exp=gained,
        damage=damage,
    )

    try:
        entry = generate_journal(
            name=cultivator.get("display_name") or cultivator["username"],
            workout_label=WORKOUT_LABELS.get(req.workout_type, req.workout_type),
            exp=gained,
            streak=streak,
            level_text=f"Lv {cultivator['level']}",
        )
        if entry:
            db.insert(
                "journal_entries",
                {
                    "cultivator_id": cultivator["id"],
                    "entry_date": today.isoformat(),
                    "content": entry,
                },
            )
    except Exception as e:
        print(f"[Journal] skip: {e}")

    return {
        "checkin": record,
        "exp_gained": gained,
        "streak": streak,
        "damage": damage,
        "level": cultivator["level"],
        "leveled_up": leveled["level"] > cultivator["level"],
        "new_achievements": achievements,
    }


LEADERBOARD_LIMIT = 20


@router.get("/leaderboard")
def leaderboard() -> dict:
    """BXH: Top EXP (level+exp), Top Streak, Top Boss Damage."""

    def public(row: dict, rank: int) -> dict:
        return {
            "rank": rank,
            "name": row.get("display_name") or row["username"],
            "username": row["username"],
            "avatar_url": row.get("avatar_url"),
        }

    exp_rows = db.select(
        "cultivators",
        order="level.desc,exp.desc",
        limit=f"{LEADERBOARD_LIMIT}",
        select="username,display_name,avatar_url,level,exp",
    )
    exp_board = [
        {**public(r, i + 1), "level": r["level"], "exp": r["exp"]}
        for i, r in enumerate(exp_rows)
    ]

    streak_rows = db.select(
        "cultivators",
        order="best_streak.desc",
        limit=f"{LEADERBOARD_LIMIT}",
        select="username,display_name,avatar_url,best_streak",
    )
    streak_board = [
        {**public(r, i + 1), "best_streak": r["best_streak"]}
        for i, r in enumerate(streak_rows)
    ]

    # Top sát thương Boss tuần (tính tổng trong Python — đủ cho quy mô hiện tại)
    boss = db.select_one("bosses", season=f"eq.{BOSS_SEASON}")
    damage_totals: dict[str, int] = defaultdict(int)
    if boss:
        rows = db.select(
            "boss_damage",
            boss_id=f"eq.{boss['id']}",
            select="cultivator_id,damage",
        )
        for r in rows:
            damage_totals[r["cultivator_id"]] += r["damage"]

    ids = list(damage_totals.keys())
    cultivators: dict[str, dict] = {}
    if ids:
        for chunk_start in range(0, len(ids), 50):
            chunk = ids[chunk_start : chunk_start + 50]
            for c in db.select(
                "cultivators",
                id=f"in.({','.join(chunk)})",
                select="id,username,display_name,avatar_url",
            ):
                cultivators[c["id"]] = c

    boss_board = [
        {
            "rank": i + 1,
            "name": (cultivators[cid].get("display_name") or cultivators[cid]["username"]),
            "username": cultivators[cid]["username"],
            "avatar_url": cultivators[cid].get("avatar_url"),
            "damage": damage_totals[cid],
        }
        for i, cid in enumerate(
            sorted(damage_totals, key=damage_totals.get, reverse=True)[:LEADERBOARD_LIMIT]
        )
    ]

    return {"exp": exp_board, "streak": streak_board, "boss": boss_board}


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


@router.get("/dashboard")
def dashboard(cultivator: dict = Depends(current_cultivator)) -> dict:
    today = _today_utc()
    boss = db.select_one("bosses", season=f"eq.{BOSS_SEASON}")
    quests = db.select("quests", active="eq.true")
    achievements = db.select("achievements")
    unlocked_ids = {
        a["achievement_id"]
        for a in db.select(
            "user_achievements",
            cultivator_id=f"eq.{cultivator['id']}",
            select="achievement_id",
        )
    }
    today_checkins = {
        c["workout_type"]
        for c in db.select("checkins", cultivator_id=f"eq.{cultivator['id']}")
        if _parse_date(c["checked_in_date"]) == today
    }
    my_damage_rows = db.select(
        "boss_damage",
        cultivator_id=f"eq.{cultivator['id']}",
        boss_id=f"eq.{boss['id']}",
        select="damage",
    ) if boss else []

    try:
        journal_rows = db.select(
            "journal_entries",
            cultivator_id=f"eq.{cultivator['id']}",
            order="entry_date.desc",
            limit="5",
        )
    except Exception:
        journal_rows = []

    try:
        path_rows = db.select(
            "dao_paths",
            cultivator_id=f"eq.{cultivator['id']}",
        )
    except Exception:
        path_rows = []
    path_exp = {p["code"]: p["exp"] for p in path_rows}

    return {
        "cultivator": {
            **cultivator,
            "exp_to_next": exp_to_next(cultivator["level"]),
            "checked_in_today": bool(today_checkins),
        },
        "paths": [
            {
                "code": code,
                "name": meta["name"],
                "emoji": meta["emoji"],
                "exp": path_exp.get(code, 0),
                "level": path_level_and_rest(path_exp.get(code, 0))[0],
                "exp_to_next": exp_to_next(path_level_and_rest(path_exp.get(code, 0))[0]),
                "rest": path_level_and_rest(path_exp.get(code, 0))[1],
            }
            for code, meta in PATH_META.items()
        ],
        "journal": [
            {
                "id": j["id"],
                "entry_date": j["entry_date"],
                "content": j["content"],
            }
            for j in journal_rows
        ],
        "boss": {
            "name": boss["name"],
            "hp": boss["hp"],
            "max_hp": boss["max_hp"],
            "ends_at": boss["ends_at"],
            "my_damage": sum(r["damage"] for r in my_damage_rows),
        }
        if boss
        else None,
        "quests": [
            {
                "id": q["id"],
                "title": q["title"],
                "workout_type": q["workout_type"],
                "exp": q["exp"],
                "done": q["workout_type"] in today_checkins,
            }
            for q in quests
        ],
        "achievements": [
            {
                "id": a["id"],
                "title": a["title"],
                "emoji": a["emoji"],
                "unlocked": a["id"] in unlocked_ids,
            }
            for a in achievements
        ],
    }
