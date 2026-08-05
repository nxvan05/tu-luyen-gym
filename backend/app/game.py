"""Logic trò chơi: check-in, EXP, streak, boss, achievements, leaderboard."""

import base64
import random
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

# Bí Cảnh 7 ngày
REALM_CODE = "long_huyet"
REALM_NAME = "Long Huyệt Bí Cảnh"
REALM_DAYS = 7
REALM_STAGES = [
    "Sơn Môn Cổ Quan",
    "Thạch Trận Bát Quái",
    "Thủy Long Đàm",
    "Hỏa Diệm Động",
    "Huyền Băng Cốc",
    "Lôi Âm Điện",
    "Long Huyệt Tàng Bảo",
]
REALM_FLAVOR = [
    "Cánh cổng đá phủ rêu mở ra trước mắt đệ tử.",
    "Đá xoay chuyển theo Bát Quái, cần tâm tỉnh để tìm lối đi.",
    "Đáy vực vang tiếng gầm trầm — có linh thú canh giữ.",
    "Hơi nóng cuồn cuộn, lửa ngầm cháy dưới chân.",
    "Băng hàn thấu xương, hơi thở hóa sương mù.",
    "Sấm chớp rạch trời, đình trận rung chuyển.",
    "Bảo vật tỏa hào quang — chủ nhân thật sự cuối cùng cũng tới.",
]
REALM_DAY_EXP = 20
REALM_COMPLETE_EXP = 500
REALM_MAX_GAP_DAYS = 7

# Pháp Bảo rơi khi bế quan
ARTIFACT_DROP_CHANCE = 0.15
ARTIFACT_RARITIES = [
    {"code": "ha", "name": "Hạ Phẩm", "emoji": "🗡️", "weight": 55},
    {"code": "trung", "name": "Trung Phẩm", "emoji": "🛡️", "weight": 30},
    {"code": "thuong", "name": "Thượng Phẩm", "emoji": "🔮", "weight": 12},
    {"code": "tuyet", "name": "Tuyệt Phẩm", "emoji": "👑", "weight": 3},
]
ARTIFACT_POOLS = {
    "ha": [
        ("Thanh Phong Kiếm", "Kiếm phong nhẹ tựa gió xuân lướt lá."),
        ("Hắc Thiết Ấn", "Ấn sắt nặng tay, khắc cổ triện."),
        ("Túi Trữ Linh", "Túi vải cũ nhưng đựng được chút linh khí."),
        ("Đồng Tiền Quẻ", "Đồng tiền lấm lem, gieo xuống thấy hơi linh."),
    ],
    "trung": [
        ("Tử Kim Trọng Hoàn", "Vòng tay tím kim, gõ nhẹ vang tiếng đạo."),
        ("Hàn Băng Quạt", "Quạt phe phẩy ra làn hơi sương mát."),
        ("Lôi Châu", "Viên châu rung rung, nghe tiếng sấm xa vời."),
        ("Thanh Ngọc Bội", "Ngọc xanh ấm áp, ngăn tà khí nhẹ nhàng."),
    ],
    "thuong": [
        ("Long Văn Kiếm", "Thân kiếm khắc văn rồng uốn lượn."),
        ("Càn Khôn Đỉnh", "Chiếc đỉnh nhỏ mà chứa cả càn khôn."),
        ("Phong Hỏa Luân", "Hai bánh xe lửa, xoay là bốc cháy."),
        ("Phệ Linh Hồ Lô", "Hồ lô gáo vàng, hút trọn tà khí."),
    ],
    "tuyet": [
        ("Hỗn Độn Chung", "Chuông cổ vang lên, trời đất ngưng đọng."),
        ("Phi Tiên Cân", "Dải lụa bay, đạp lên là nhẹ tênh."),
        ("Tạo Hóa Bút", "Ngòi bút chấm mực là vẽ ra đạo."),
        ("Thái Cực Đồ", "Bức đồ xoay vần, âm dương tự nhiên."),
    ],
}
# Thưởng khi Boss bị hạ — top 3 sát thương
BOSS_SLAIN_REWARDS = {1: 1000, 2: 500, 3: 250}

ACTIVITY_META = {
    "push": {"emoji": "🏋️", "label": "Luyện Thể · Đẩy tạ"},
    "pull": {"emoji": "🤸", "label": "Luyện Thể · Kéo xà"},
    "legs": {"emoji": "🦵", "label": "Luyện Thể · Chân"},
    "cardio": {"emoji": "🏃", "label": "Thân Pháp · Chạy bộ"},
    "rest": {"emoji": "🧘", "label": "Tĩnh Tâm"},
    "meditation": {"emoji": "🪷", "label": "Thiền Định"},
    "reading": {"emoji": "📚", "label": "Đọc Sách"},
}


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


def _advance_realm(cultivator: dict) -> dict | None:
    """Hoạt động trong ngày → tiến Bí Cảnh. Trả thông tin nếu có tiến (hoặc hoàn thành)."""
    try:
        realm = db.select_one(
            "secret_realms",
            cultivator_id=f"eq.{cultivator['id']}",
            status="eq.active",
            order="created_at.desc",
            limit="1",
        )
    except Exception as e:
        print(f"[Realm] query failed: {e}")
        return None
    if not realm:
        return None

    today = _today_utc()
    last = realm.get("last_activity_date")
    if last:
        last_date = _parse_date(str(last)) if isinstance(last, str) else last
        if last_date == today:
            return None
        if (today - last_date).days >= REALM_MAX_GAP_DAYS:
            db.update(
                "secret_realms",
                {"status": "failed"},
                id=f"eq.{realm['id']}",
            )
            return None

    day = realm["current_day"] + 1
    if day > REALM_DAYS:
        db.update(
            "secret_realms",
            {
                "status": "completed",
                "current_day": REALM_DAYS,
                "completed_at": datetime.now(UTC).isoformat(),
            },
            id=f"eq.{realm['id']}",
        )
        leveled = _apply_exp(cultivator, REALM_COMPLETE_EXP)
        db.update("cultivators", leveled, id=f"eq.{cultivator['id']}")
        cultivator.update(leveled)
        damage = REALM_COMPLETE_EXP * BOSS_DAMAGE_PER_EXP
        _apply_boss_damage(cultivator, damage)
        return {
            "completed": True,
            "exp": REALM_COMPLETE_EXP,
            "damage": damage,
            "leveled_up": leveled["level"] > cultivator["level"],
        }

    db.update(
        "secret_realms",
        {"current_day": day, "last_activity_date": today.isoformat()},
        id=f"eq.{realm['id']}",
    )
    return {"completed": False, "day": day, "stage": REALM_STAGES[day - 1]}


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


def _freeze_gems(cultivator: dict) -> int:
    """Số Ngọc Bảo Vệ: mỗi 7 ngày kỷ lục được 1 viên, trừ số đã dùng."""
    grants = cultivator.get("best_streak", 0) // 7
    try:
        used = len(
            db.select(
                "freeze_uses",
                cultivator_id=f"eq.{cultivator['id']}",
                select="id",
            )
        )
    except Exception:
        used = 0
    return max(0, grants - used)


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


def _streak_with_freeze(cultivator: dict, today: date) -> tuple[int, int, bool]:
    """Tính streak; nếu chuỗi lẽ ra gãy mà còn Ngọc Bảo Vệ thì giữ chuỗi."""
    streak, best = _apply_streak(cultivator, today)
    if streak > 1:
        return streak, best, False
    if streak == 1 and not cultivator.get("last_checkin_date"):
        return 1, best, False
    # lẽ ra gãy (gap > 1 ngày) — thử dùng Ngọc
    if _freeze_gems(cultivator) > 0:
        return cultivator["streak"] + 1, max(cultivator["streak"] + 1, best), True
    return streak, best, False


def _roll_artifact(cultivator_id: str) -> dict | None:
    """15% rơi Pháp Bảo ngẫu nhiên khi bế quan."""
    if random.random() > ARTIFACT_DROP_CHANCE:
        return None
    rarity = random.choices(
        ARTIFACT_RARITIES,
        weights=[r["weight"] for r in ARTIFACT_RARITIES],
        k=1,
    )[0]
    name, effect = random.choice(ARTIFACT_POOLS[rarity["code"]])
    try:
        row = db.insert(
            "artifacts",
            {
                "cultivator_id": cultivator_id,
                "name": name,
                "rarity": rarity["code"],
                "emoji": rarity["emoji"],
                "effect": effect,
            },
        )
    except Exception as e:
        print(f"[Artifact] insert failed: {e}")
        return None
    return {
        "id": row["id"],
        "name": name,
        "rarity": rarity["code"],
        "rarity_name": rarity["name"],
        "emoji": rarity["emoji"],
        "effect": effect,
    }


def _on_boss_slain(boss: dict, killer: dict) -> dict:
    """Boss vừa bị hạ: thưởng top 3 sát thương + thành tựu cho người hạ sát."""
    totals: dict[str, int] = defaultdict(int)
    for r in db.select(
        "boss_damage",
        boss_id=f"eq.{boss['id']}",
        select="cultivator_id,damage",
    ):
        totals[r["cultivator_id"]] += r["damage"]

    ranked = sorted(totals, key=totals.get, reverse=True)[:3]
    killer_rank = None
    for i, cid in enumerate(ranked):
        gained = BOSS_SLAIN_REWARDS.get(i + 1, 0)
        row = db.select_one("cultivators", id=f"eq.{cid}")
        if not row:
            continue
        leveled = _apply_exp(row, gained)
        db.update("cultivators", leveled, id=f"eq.{cid}")
        if str(cid) == str(killer["id"]):
            killer_rank = i + 1
            killer.update(leveled)

    if ranked:
        ach = db.select_one("achievements", code="eq.boss_killer")
        if ach and not db.select_one(
            "user_achievements",
            cultivator_id=f"eq.{ranked[0]}",
            achievement_id=f"eq.{ach['id']}",
        ):
            db.insert(
                "user_achievements",
                {"cultivator_id": ranked[0], "achievement_id": ach["id"]},
            )

    db.update(
        "bosses",
        {"ends_at": datetime.now(UTC).isoformat()},
        id=f"eq.{boss['id']}",
    )
    return {
        "defeated": True,
        "rank": killer_rank,
        "reward": BOSS_SLAIN_REWARDS.get(killer_rank or 0, 0),
    }


def _apply_boss_damage(cultivator: dict, damage: int, checkin_id: str | None = None) -> dict | None:
    boss = _ensure_boss()
    if not boss:
        return None
    if boss["hp"] <= 0:
        return None
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
    if new_hp == 0:
        return _on_boss_slain(boss, cultivator)
    return None


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


def _handle_photo(req: CheckinRequest, cultivator: dict) -> tuple[str | None, str | None]:
    """Xác nhận ảnh bằng AI (nếu cấu hình) rồi upload lên Storage.

    Trả về (đường dẫn ảnh, lời nhận xét của Sư phụ AI).
    """
    if not req.photo:
        return None, None

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

    _GENERIC = ("chưa được cấu hình", "tạm lỗi", "không đọc được")
    comment = None
    if verdict.reason and len(verdict.reason) > 5 and not any(g in verdict.reason for g in _GENERIC):
        comment = verdict.reason.strip()

    ensure_bucket()
    return upload_image(cultivator["id"], image_bytes, mime), comment


@router.post("/checkin")
def checkin(req: CheckinRequest, cultivator: dict = Depends(current_cultivator)) -> dict:
    if req.workout_type not in WORKOUT_EXP:
        raise HTTPException(422, "Loại buổi tập không hợp lệ")

    today = _today_utc()
    if cultivator["last_checkin_date"] and _parse_date(cultivator["last_checkin_date"]) == today:
        raise HTTPException(409, "Hôm nay đã bế quan rồi")

    photo_url, coach_comment = _handle_photo(req, cultivator)

    gained = WORKOUT_EXP[req.workout_type]
    streak, best_streak, freeze_used = _streak_with_freeze(cultivator, today)
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

    if freeze_used:
        try:
            db.insert(
                "freeze_uses",
                {"cultivator_id": cultivator["id"], "used_on": today.isoformat()},
            )
        except Exception as e:
            print(f"[Freeze] insert failed: {e}")

    cultivator.update({**leveled, "streak": streak, "best_streak": best_streak})

    _apply_path_exp(cultivator["id"], req.workout_type, gained)

    damage = gained * BOSS_DAMAGE_PER_EXP
    slain = _apply_boss_damage(cultivator, damage, record["id"])
    achievements = _apply_achievements(cultivator)

    realm_result = _advance_realm(cultivator)
    artifact = _roll_artifact(cultivator["id"])

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
        "realm": realm_result,
        "artifact": artifact,
        "boss_slain": slain,
        "freeze_used": freeze_used,
        "coach_comment": coach_comment,
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

    # EXP tuần này (thứ 2 -> hôm nay): bế quan + thiền + đọc sách
    monday = _today_utc() - timedelta(days=_today_utc().weekday())
    weekly: dict[str, int] = defaultdict(int)
    for c in db.select(
        "checkins",
        checked_in_date=f"gte.{monday.isoformat()}",
        select="cultivator_id,exp_gained",
    ):
        weekly[c["cultivator_id"]] += c["exp_gained"]
    for table, col in (("meditations", "meditated_on"), ("reading_sessions", "session_date")):
        try:
            for r in db.select(
                table,
                **{f"{col}": f"gte.{monday.isoformat()}"},
                select="cultivator_id,exp_gained",
            ):
                weekly[r["cultivator_id"]] += r["exp_gained"]
        except Exception:
            pass

    week_ids = list(weekly.keys())
    week_names: dict[str, dict] = {}
    if week_ids:
        for chunk_start in range(0, len(week_ids), 50):
            chunk = week_ids[chunk_start : chunk_start + 50]
            for c in db.select(
                "cultivators",
                id=f"in.({','.join(chunk)})",
                select="id,username,display_name,avatar_url",
            ):
                week_names[c["id"]] = c

    week_board = [
        {
            "rank": i + 1,
            "name": (week_names[cid].get("display_name") or week_names[cid]["username"]),
            "username": week_names[cid]["username"],
            "avatar_url": week_names[cid].get("avatar_url"),
            "exp": weekly[cid],
        }
        for i, cid in enumerate(sorted(weekly, key=weekly.get, reverse=True)[:LEADERBOARD_LIMIT])
    ]

    return {"exp": exp_board, "streak": streak_board, "boss": boss_board, "week": week_board}


@router.get("/cultivators")
def cultivators() -> dict:
    """Sư Môn: danh sách toàn bộ tu sĩ — thông tin công khai."""
    rows = db.select(
        "cultivators",
        order="level.desc,exp.desc,best_streak.desc",
        limit="100",
        select="username,display_name,avatar_url,level,exp,streak,best_streak,last_checkin_date",
    )
    members = [
        {
            "display_name": r.get("display_name"),
            "username": r["username"],
            "avatar_url": r.get("avatar_url"),
            "level": r["level"],
            "exp": r["exp"],
            "streak": r["streak"],
            "best_streak": r["best_streak"],
            "last_checkin_date": r.get("last_checkin_date"),
            "realm_stage": _realm_stage_name(r["streak"]),
        }
        for r in rows
    ]
    return {"members": members}


@router.get("/boss/activity")
def boss_activity() -> dict:
    """Chiến trường: các đòn đánh gần nhất lên Ma Thú hiện tại (công khai)."""
    boss = _ensure_boss()
    if not boss:
        return {"boss": None, "activity": []}
    rows = db.select(
        "boss_damage",
        boss_id=f"eq.{boss['id']}",
        order="created_at.desc",
        limit="15",
        select="cultivator_id,damage,created_at",
    )
    ids = list({r["cultivator_id"] for r in rows})
    names: dict[str, dict] = {}
    if ids:
        for chunk_start in range(0, len(ids), 50):
            chunk = ids[chunk_start : chunk_start + 50]
            for c in db.select(
                "cultivators",
                id=f"in.({','.join(chunk)})",
                select="id,username,display_name,avatar_url",
            ):
                names[c["id"]] = c
    activity = [
        {
            "name": (names.get(r["cultivator_id"], {}).get("display_name")
                     or names.get(r["cultivator_id"], {}).get("username")
                     or "Ẩn sĩ"),
            "avatar_url": names.get(r["cultivator_id"], {}).get("avatar_url"),
            "damage": r["damage"],
            "at": r.get("created_at"),
        }
        for r in rows
    ]
    return {"boss": {"name": boss["name"], "killed": boss["hp"] <= 0}, "activity": activity}


@router.get("/boss-history")
def boss_history() -> dict:
    """Sử kiện các Ma Thú qua các mùa — kèm kẻ hạ sát."""
    rows = db.select("bosses", order="season.desc", limit="10")
    history: list[dict] = []
    for b in rows:
        totals: dict[str, int] = defaultdict(int)
        for r in db.select(
            "boss_damage",
            boss_id=f"eq.{b['id']}",
            select="cultivator_id,damage",
        ):
            totals[r["cultivator_id"]] += r["damage"]
        killer = None
        if totals:
            top_id = max(totals, key=totals.get)
            top = db.select_one("cultivators", id=f"eq.{top_id}")
            if top:
                killer = {
                    "name": top.get("display_name") or top["username"],
                    "username": top["username"],
                    "avatar_url": top.get("avatar_url"),
                    "damage": totals[top_id],
                }
        history.append(
            {
                "season": b["season"],
                "name": b["name"],
                "max_hp": b["max_hp"],
                "killed": b["hp"] <= 0,
                "ends_at": b.get("ends_at"),
                "killer": killer,
            }
        )
    return {"bosses": history}


# Động Phủ lớn dần theo chuỗi — đồng bộ với BUILD_STAGES bên web
REALM_BUILD_STAGES = [
    (0, "Đất Hoang"),
    (30, "Linh Điền"),
    (60, "Tĩnh Xá"),
    (120, "Sơn Môn"),
    (300, "Tông Môn"),
]


def _realm_stage_name(streak: int) -> str:
    name = REALM_BUILD_STAGES[0][1]
    for at, stage_name in REALM_BUILD_STAGES:
        if streak >= at:
            name = stage_name
    return name


@router.get("/profile/{username}")
def profile(username: str) -> dict:
    """Động Phủ của một tu sĩ — dữ liệu công khai để mọi người ghé thăm."""
    c = db.select_one(
        "cultivators",
        username=f"eq.{username}",
        select="id,username,display_name,avatar_url,level,exp,streak,best_streak,last_checkin_date",
    )
    if not c:
        raise HTTPException(status_code=404, detail="Tu sĩ này chưa từng xuất hiện ở đây.")

    try:
        damage_rows = db.select(
            "boss_damage",
            cultivator_id=f"eq.{c['id']}",
            select="damage",
        )
        damage_total = sum(r["damage"] for r in damage_rows)
    except Exception:
        damage_total = 0

    artifact_rows: list[dict] = []
    try:
        artifact_rows = db.select(
            "artifacts",
            cultivator_id=f"eq.{c['id']}",
            order="obtained_at.desc",
            limit="6",
        )
    except Exception:
        pass

    return {
        "display_name": c.get("display_name"),
        "username": c["username"],
        "avatar_url": c.get("avatar_url"),
        "level": c["level"],
        "exp": c["exp"],
        "streak": c["streak"],
        "best_streak": c["best_streak"],
        "last_checkin_date": c.get("last_checkin_date"),
        "realm_stage": _realm_stage_name(c["streak"]),
        "boss_damage_total": damage_total,
        "artifact_count": len(artifact_rows),
        "artifacts": [
            {
                "id": a["id"],
                "name": a["name"],
                "rarity": a["rarity"],
                "emoji": a["emoji"],
                "effect": a["effect"],
            }
            for a in artifact_rows
        ],
    }


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


@router.get("/history")
def history(cultivator: dict = Depends(current_cultivator)) -> dict:
    """Lịch sử tu luyện: hoạt động gần đây + lưới 7 ngày gần nhất."""
    cid = cultivator["id"]

    activities: list[dict] = []
    try:
        for c in db.select(
            "checkins",
            cultivator_id=f"eq.{cid}",
            order="checked_in_date.desc",
            limit="15",
        ):
            meta = ACTIVITY_META.get(c["workout_type"], {})
            activities.append(
                {
                    "date": str(c["checked_in_date"]),
                    "type": "checkin",
                    "emoji": meta.get("emoji", "⚡"),
                    "label": meta.get("label", c["workout_type"]),
                    "exp": c["exp_gained"],
                    "detail": f"+{c['exp_gained']} EXP",
                }
            )
    except Exception:
        pass
    try:
        for m in db.select(
            "meditations",
            cultivator_id=f"eq.{cid}",
            order="meditated_on.desc",
            limit="10",
        ):
            activities.append(
                {
                    "date": str(m["meditated_on"]),
                    "type": "meditation",
                    "emoji": ACTIVITY_META["meditation"]["emoji"],
                    "label": f"Thiền {m['minutes']} phút",
                    "exp": m["exp_gained"],
                    "detail": f"+{m['energy_gained']} ⚡ Linh Khí",
                }
            )
    except Exception:
        pass
    try:
        for r in db.select(
            "reading_sessions",
            cultivator_id=f"eq.{cid}",
            order="session_date.desc",
            limit="10",
        ):
            activities.append(
                {
                    "date": str(r["session_date"]),
                    "type": "reading",
                    "emoji": ACTIVITY_META["reading"]["emoji"],
                    "label": f"Đọc: {r['title'][:36]}",
                    "exp": r["exp_gained"],
                    "detail": f"+{r['exp_gained']} EXP",
                }
            )
    except Exception:
        pass

    activities.sort(key=lambda a: a["date"], reverse=True)

    week: list[dict] = []
    today = _today_utc()
    by_date: dict[str, list[str]] = {}
    for a in activities:
        d = str(a["date"])[:10]
        by_date.setdefault(d, []).append(a["emoji"])
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        iso = day.isoformat()
        items = by_date.get(iso, [])
        week.append(
            {
                "date": iso,
                "label": "Hôm nay" if offset == 0 else ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day.weekday()],
                "count": len(items),
                "emojis": items[:4],
            }
        )

    return {
        "activities": activities[:30],
        "week": week,
        "total_exp_week": sum(
            a["exp"]
            for a in activities
            if str(a["date"])[:10] >= (today - timedelta(days=6)).isoformat()
        ),
    }


class WeeklySummaryRequest(BaseModel):
    pass


@router.post("/weekly-summary")
def weekly_summary(cultivator: dict = Depends(current_cultivator)) -> dict:
    """Sư phụ (AI) tổng kết tuần tu luyện."""
    data = history(cultivator)
    week_items = [
        a for a in data["activities"] if str(a["date"])[:10] >= (_today_utc() - timedelta(days=6)).isoformat()
    ]
    if not week_items:
        raise HTTPException(422, "Tuần này đệ tử chưa có hoạt động nào — hãy tu luyện đã")

    lines = [
        f"- {a['date']}: {a['label']} ({a['detail']})"
        for a in reversed(week_items)
    ]
    name = cultivator.get("display_name") or cultivator["username"]

    try:
        from app.ai import generate_weekly_summary

        summary = generate_weekly_summary(name, "\n".join(lines))
    except Exception as e:
        print(f"[WeeklySummary] failed: {e}")
        summary = None
    if not summary:
        summary = (
            f"Tuần này {name} luyện tập {len(week_items)} buổi, "
            f"thu về {data['total_exp_week']} EXP. Đạo tâm cần giữ lửa!"
        )
    return {"summary": summary, "activity_count": len(week_items)}


@router.post("/realm/start")
def realm_start(cultivator: dict = Depends(current_cultivator)) -> dict:
    """Bước vào Bí Cảnh — ngày 1 bắt đầu ngay hôm nay."""
    today = _today_utc()
    try:
        existing = db.select_one(
            "secret_realms",
            cultivator_id=f"eq.{cultivator['id']}",
            status="eq.active",
            order="created_at.desc",
            limit="1",
        )
    except Exception:
        raise HTTPException(502, "Bảng Bí Cảnh chưa được khởi tạo")
    if existing:
        raise HTTPException(409, "Đang ở trong Bí Cảnh rồi — hãy kiên trì đến ngày thứ 7")

    realm = db.insert(
        "secret_realms",
        {
            "cultivator_id": cultivator["id"],
            "realm_code": REALM_CODE,
            "start_date": today.isoformat(),
            "current_day": 1,
            "last_activity_date": today.isoformat(),
        },
    )
    return {"realm": realm}


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
    slain = _apply_boss_damage(cultivator, damage)
    _apply_achievements(cultivator)

    realm_result = _advance_realm(cultivator)

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
        "realm": realm_result,
        "boss_slain": slain,
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
    slain = _apply_boss_damage(cultivator, damage)
    _apply_achievements(cultivator)

    realm_result = _advance_realm(cultivator)

    return {
        "session_id": record["id"],
        "title": title,
        "question": eval_result.get("question", ""),
        "exp_gained": READ_EXP,
        "damage": damage,
        "level": cultivator["level"],
        "leveled_up": leveled["level"] > cultivator["level"],
        "realm": realm_result,
        "boss_slain": slain,
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

    # 7 ngày gần nhất cho lưới tu luyện trên Động Phủ
    week_days: list[dict] = []
    try:
        week_rows = db.select(
            "checkins",
            cultivator_id=f"eq.{cultivator['id']}",
            checked_in_date=f"gte.{(today - timedelta(days=6)).isoformat()}",
            select="checked_in_date,workout_type",
        )
        week_by_date: dict[str, list[str]] = defaultdict(list)
        for c in week_rows:
            week_by_date[str(c["checked_in_date"])].append(
                ACTIVITY_META.get(c["workout_type"], {}).get("emoji", "⚡")
            )
        for offset in range(6, -1, -1):
            day = today - timedelta(days=offset)
            iso = day.isoformat()
            emojis = week_by_date.get(iso, [])
            week_days.append(
                {
                    "date": iso,
                    "label": "Hôm nay" if offset == 0 else ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day.weekday()],
                    "count": len(emojis),
                    "emojis": emojis[:4],
                }
            )
    except Exception:
        week_days = []
    my_damage_rows = db.select(
        "boss_damage",
        cultivator_id=f"eq.{cultivator['id']}",
        boss_id=f"eq.{boss['id']}",
        select="damage",
    ) if boss else []

    server_damage = 0
    boss_killer = None
    if boss:
        try:
            damage_rows = db.select(
                "boss_damage",
                boss_id=f"eq.{boss['id']}",
                select="cultivator_id,damage",
            )
            server_damage = sum(r["damage"] for r in damage_rows)
            totals: dict[str, int] = defaultdict(int)
            for r in damage_rows:
                totals[r["cultivator_id"]] += r["damage"]
            if totals:
                top_id = max(totals, key=totals.get)
                top = db.select_one("cultivators", id=f"eq.{top_id}")
                if top:
                    boss_killer = top.get("display_name") or top["username"]
        except Exception:
            server_damage = 0

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

    realm_payload = None
    try:
        realm = db.select_one(
            "secret_realms",
            cultivator_id=f"eq.{cultivator['id']}",
            order="created_at.desc",
            limit="1",
        )
        if realm:
            day = realm["current_day"]
            realm_payload = {
                "code": realm.get("realm_code", REALM_CODE),
                "name": REALM_NAME,
                "current_day": day,
                "days_total": REALM_DAYS,
                "status": realm["status"],
                "stage": REALM_STAGES[day - 1] if realm["status"] == "active" else None,
                "flavor": REALM_FLAVOR[day - 1] if realm["status"] == "active" else None,
            }
    except Exception:
        realm_payload = None

    try:
        artifact_rows = db.select(
            "artifacts",
            cultivator_id=f"eq.{cultivator['id']}",
            order="obtained_at.desc",
            limit="12",
        )
    except Exception:
        artifact_rows = []

    return {
        "cultivator": {
            **cultivator,
            "exp_to_next": exp_to_next(cultivator["level"]),
            "checked_in_today": bool(today_checkins),
            "energy": energy,
            "freeze_gems": _freeze_gems(cultivator),
        },
        "realm": realm_payload,
        "week_days": week_days,
        "artifacts": [
            {
                "id": a["id"],
                "name": a["name"],
                "rarity": a["rarity"],
                "emoji": a["emoji"],
                "effect": a["effect"],
            }
            for a in artifact_rows
        ],
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
            "season": boss["season"],
            "my_damage": sum(r["damage"] for r in my_damage_rows),
            "server_damage": server_damage,
            "killed": boss["hp"] <= 0,
            "killer": boss_killer,
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
