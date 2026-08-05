"""Logic trò chơi: check-in, EXP, streak, boss, achievements, leaderboard."""

import base64
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app import db
from app.ai import (
    check_reading_answer,
    evaluate_reading,
    generate_journal,
    verify_gym_photo,
)
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
# Tên Boss xoay vòng theo tuần
BOSS_NAMES = [
    "Cửu U Ma Long",
    "Huyền Vũ",
    "Thao Thiết",
    "Bạch Hổ Tinh Quân",
    "Chu Tước Thánh Thú",
    "Thanh Long",
    "Cửu Vĩ Hồ Yêu",
]
BOSS_WEEK_DAYS = 7
MAX_PHOTO_BYTES = 6 * 1024 * 1024

# Thiền định: phút -> Linh Khí
MEDITATE_OPTIONS = {5: 10, 10: 20, 20: 40}
MEDITATE_EXP = 20
# Đọc sách: thưởng gốc + thưởng trả lời đúng câu hỏi của AI
READ_EXP = 40
READ_QUIZ_BONUS = 20
# Linh Khí nền theo streak: 30 + streak*2
ENERGY_BASE = 30
ENERGY_PER_STREAK = 2
ENERGY_CAP = 100


def _boss_expired(boss: dict) -> bool:
    ends = boss.get("ends_at")
    if not ends:
        return True
    try:
        ends_dt = datetime.fromisoformat(str(ends).replace("Z", "+00:00"))
    except ValueError:
        return True
    return ends_dt <= datetime.now(UTC)


def _ensure_boss() -> dict | None:
    """Boss tuần hiện tại — tự tạo Boss mới khi hết hạn hoặc chưa có."""
    boss = db.select_one("bosses", season=f"eq.{BOSS_SEASON}")
    if boss and not _boss_expired(boss):
        return boss

    latest = db.select_one("bosses", order="season.desc", limit="1")
    if latest and not _boss_expired(latest):
        return latest

    next_season = (latest["season"] + 1) if latest else BOSS_SEASON
    name = BOSS_NAMES[(next_season - 1) % len(BOSS_NAMES)]
    hp = 10_000_000 * next_season
    try:
        return db.insert(
            "bosses",
            {
                "name": name,
                "season": next_season,
                "max_hp": hp,
                "hp": hp,
                "ends_at": (datetime.now(UTC) + timedelta(days=BOSS_WEEK_DAYS)).isoformat(),
            },
        )
    except Exception as e:
        print(f"[Boss] create failed: {e}")
        return None


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


def _apply_boss_damage(cultivator: dict, damage: int, checkin_id: str | None = None) -> None:
    boss = _ensure_boss()
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
    boss = _ensure_boss()
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


class MeditateRequest(BaseModel):
    minutes: int


@router.post("/meditate")
def meditate(req: MeditateRequest, cultivator: dict = Depends(current_cultivator)) -> dict:
    """Thiền định: timer 5/10/20 phút -> +Linh Khí (1 lần/ngày)."""
    if req.minutes not in MEDITATE_OPTIONS:
        raise HTTPException(422, "Chọn 5, 10 hoặc 20 phút")

    today = _today_utc()
    if db.select_one(
        "meditations",
        cultivator_id=f"eq.{cultivator['id']}",
        meditated_on=f"eq.{today.isoformat()}",
    ):
        raise HTTPException(409, "Hôm nay đã thiền định rồi")

    energy_gained = MEDITATE_OPTIONS[req.minutes]
    leveled = _apply_exp(cultivator, MEDITATE_EXP)

    record = db.insert(
        "meditations",
        {
            "cultivator_id": cultivator["id"],
            "minutes": req.minutes,
            "energy_gained": energy_gained,
            "exp_gained": MEDITATE_EXP,
            "meditated_on": today.isoformat(),
        },
    )

    db.update("cultivators", leveled, id=f"eq.{cultivator['id']}")
    cultivator.update(leveled)

    _apply_path_exp(cultivator["id"], "rest", MEDITATE_EXP)

    damage = MEDITATE_EXP * BOSS_DAMAGE_PER_EXP
    _apply_boss_damage(cultivator, damage)
    _apply_achievements(cultivator)

    try:
        entry = generate_journal(
            name=cultivator.get("display_name") or cultivator["username"],
            workout_label="Thiền Định",
            exp=MEDITATE_EXP,
            streak=cultivator["streak"],
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
        print(f"[Journal] meditate skip: {e}")

    return {
        "meditation": record,
        "energy_gained": energy_gained,
        "exp_gained": MEDITATE_EXP,
        "damage": damage,
        "level": cultivator["level"],
        "leveled_up": leveled["level"] > cultivator["level"],
    }


class ReadRequest(BaseModel):
    title: str
    note: str


@router.post("/read")
def read_session(req: ReadRequest, cultivator: dict = Depends(current_cultivator)) -> dict:
    """Đọc sách: nộp tựa + tóm tắt -> AI ra 1 câu hỏi; trả lời đúng được thưởng."""
    title = req.title.strip()
    note = req.note.strip()
    if not title or len(title) > 120:
        raise HTTPException(422, "Nhập tên sách (tối đa 120 ký tự)")
    if len(note) < 30:
        raise HTTPException(422, "Tóm tắt ít nhất 30 ký tự — sư phụ muốn thấy tâm đắc của đệ")
    if len(note) > 2000:
        raise HTTPException(422, "Tóm tắt tối đa 2000 ký tự")

    today = _today_utc()
    if db.select_one(
        "reading_sessions",
        cultivator_id=f"eq.{cultivator['id']}",
        session_date=f"eq.{today.isoformat()}",
    ):
        raise HTTPException(409, "Hôm nay đã đọc sách rồi")

    eval_result = evaluate_reading(title, note)
    if not eval_result.get("valid", True):
        raise HTTPException(422, f"Đệ tử chưa đọc thật lòng: {eval_result.get('reason', '')}")

    leveled = _apply_exp(cultivator, READ_EXP)
    record = db.insert(
        "reading_sessions",
        {
            "cultivator_id": cultivator["id"],
            "session_date": today.isoformat(),
            "title": title,
            "note": note,
            "question": eval_result.get("question", ""),
            "correct_answer": eval_result.get("answer", ""),
            "exp_gained": READ_EXP,
        },
    )

    db.update("cultivators", leveled, id=f"eq.{cultivator['id']}")
    cultivator.update(leveled)

    damage = READ_EXP * BOSS_DAMAGE_PER_EXP
    _apply_boss_damage(cultivator, damage)
    _apply_achievements(cultivator)

    return {
        "session_id": record["id"],
        "title": title,
        "question": eval_result.get("question", ""),
        "exp_gained": READ_EXP,
        "damage": damage,
        "level": cultivator["level"],
        "leveled_up": leveled["level"] > cultivator["level"],
    }


class ReadAnswerRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/read/answer")
def read_answer(req: ReadAnswerRequest, cultivator: dict = Depends(current_cultivator)) -> dict:
    session = db.select_one("reading_sessions", id=f"eq.{req.session_id}")
    if not session or str(session["cultivator_id"]) != str(cultivator["id"]):
        raise HTTPException(404, "Buổi đọc không tồn tại")
    if session.get("answered"):
        raise HTTPException(409, "Đã trả lời câu hỏi này rồi")

    answer = req.answer.strip()
    if not answer:
        raise HTTPException(422, "Nhập câu trả lời")

    correct = True
    if session["question"]:
        correct = check_reading_answer(
            session["title"], session["question"], session["correct_answer"], answer
        )

    bonus = READ_QUIZ_BONUS if correct else 0
    prev_level = cultivator["level"]
    leveled = _apply_exp(cultivator, bonus) if bonus else {"level": cultivator["level"], "exp": cultivator["exp"]}

    db.update(
        "reading_sessions",
        {
            "answered": True,
            "exp_gained": session["exp_gained"] + bonus,
        },
        id=f"eq.{session['id']}",
    )

    if bonus:
        db.update("cultivators", leveled, id=f"eq.{cultivator['id']}")
        cultivator.update(leveled)
        _apply_boss_damage(cultivator, bonus * BOSS_DAMAGE_PER_EXP)

    return {
        "correct": correct,
        "bonus": bonus,
        "exp_gained": bonus,
        "level": cultivator["level"],
        "leveled_up": leveled["level"] > prev_level,
    }


@router.get("/dashboard")
def dashboard(cultivator: dict = Depends(current_cultivator)) -> dict:
    today = _today_utc()
    boss = _ensure_boss()
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

    med_today = None
    try:
        med_today = db.select_one(
            "meditations",
            cultivator_id=f"eq.{cultivator['id']}",
            meditated_on=f"eq.{today.isoformat()}",
        )
    except Exception:
        med_today = None
    energy = min(
        ENERGY_CAP,
        ENERGY_BASE + cultivator["streak"] * ENERGY_PER_STREAK
        + (med_today["energy_gained"] if med_today else 0),
    )

    return {
        "cultivator": {
            **cultivator,
            "exp_to_next": exp_to_next(cultivator["level"]),
            "checked_in_today": bool(today_checkins),
            "energy": energy,
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
