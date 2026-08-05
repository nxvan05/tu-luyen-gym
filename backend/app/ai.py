"""C.3 — AI xác nhận ảnh check-in bằng Gemini.

Nếu chưa có GEMINI_API_KEY trong .env thì tự động bỏ qua (coi như hợp lệ)
để flow không bị chặn khi đang phát triển.
"""

import base64
import json
import re

import httpx

from app.config import settings

PROMPT = """Bạn là giám khảo kiểm tra bằng chứng tập luyện của một app check-in gym.

Xem bức ảnh. Đánh giá xem đây có phải bằng chứng tập luyện HỢP LỆ không. Hợp lệ khi ảnh chứa:
- Phòng gym (dụng cụ, tạ, máy tập)
- Máy chạy bộ / xe đạp cố định
- Đồng hồ thông minh / Apple Watch / máy đo nhịp tim hiển thị bài tập
- Người đang tập luyện
- Thảm tập / dụng cụ yoga / tạ tay tại nhà

KHÔNG hợp lệ khi: ảnh mèo, ảnh màn hình điện thoại thông thường, ảnh chữ, ảnh mờ hoàn toàn, ảnh không liên quan tập luyện.

Trả lời DUY NHẤT một chuỗi JSON, không kèm giải thích:
{"valid": true|false, "reason": "lý do ngắn gọn bằng tiếng Việt (nếu valid thì lý do là mô tả ngắn bằng chứng nhìn thấy)"}"""


class VerifyResult:
    def __init__(self, valid: bool, reason: str):
        self.valid = valid
        self.reason = reason


def verify_gym_photo(image_bytes: bytes, mime: str) -> VerifyResult:
    key = settings.gemini_api_key
    if not key:
        return VerifyResult(True, "AI chưa được cấu hình — bỏ qua xác nhận")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime or "image/jpeg",
                            "data": base64.b64encode(image_bytes).decode("ascii"),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 2000,
        },
    }

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": key},
                json=payload,
            )
            res.raise_for_status()
            text = (
                res.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
    except Exception as e:
        # Lỗi hạ tầng AI — chấp nhận để không chặn user (log lại để theo dõi)
        print(f"[AI] Gemini call failed: {e}")
        return VerifyResult(True, "AI tạm lỗi — bỏ qua xác nhận")

    try:
        cleaned = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        data = json.loads(cleaned)
        return VerifyResult(bool(data.get("valid")), str(data.get("reason", "")))
    except Exception:
        print(f"[AI] Cannot parse Gemini response: {text[:200]}")
        return VerifyResult(True, "AI trả lời không đọc được — chấp nhận")


JOURNAL_PROMPT = """Bạn là nhà văn viết tiểu thuyết tu tiên, chuyên viết nhật ký tu luyện hằng ngày cho một người tập gym.

Thông tin hôm nay:
- Người tu luyện: {name}
- Buổi luyện: {workout}
- Đạo tâm (chuỗi ngày liên tiếp): {streak} ngày
- Linh khí tăng: +{exp} EXP
- Cảnh giới hiện tại: {level_text}

Nhiệm vụ: Viết DUY NHẤT một đoạn nhật ký 3-4 câu bằng tiếng Việt, giọng văn cổ phong tu tiên, kể chuyện người tu luyện vừa kết thúc buổi luyện: bước vào phòng luyện công, vận công, linh khí luân chuyển trong kinh mạch, cảm nhận tiến bộ. Nếu chuỗi >= 7 ngày, nhắc đến đạo tâm kiên định. Không nhắc lại danh sách thông tin, không giải thích, không tiêu đề, không dấu sao."""


def generate_journal(
    name: str,
    workout_label: str,
    exp: int,
    streak: int,
    level_text: str,
) -> str | None:
    """Viết nhật ký tu tiên sau khi bế quan. Trả None nếu AI lỗi."""
    key = settings.gemini_api_key
    if not key:
        return None

    prompt = JOURNAL_PROMPT.format(
        name=name,
        workout=workout_label,
        exp=exp,
        streak=streak,
        level_text=level_text,
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 8192,
        },
    }

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": key},
                json=payload,
            )
            res.raise_for_status()
            text = (
                res.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
    except Exception as e:
        print(f"[AI] Journal generation failed: {e}")
        return None

WEEKLY_SUMMARY_PROMPT = """Bạn là sư phụ trong app tu luyện, tổng kết tuần cho đệ tử.

Đệ tử: {name}
Hoạt động 7 ngày qua:
{items}

Viết 3-5 câu tổng kết bằng tiếng Việt, giọng sư phụ tu tiên: khen tiến bộ, nhắc điểm cần giữ,
gợi mở điều cải thiện. Không dùng dấu đầu dòng, chỉ là đoạn văn xuôi."""


def generate_weekly_summary(name: str, items_text: str) -> str | None:
    key = settings.gemini_api_key
    if not key:
        return None

    prompt = WEEKLY_SUMMARY_PROMPT.format(name=name, items=items_text)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 1500},
    }

    try:
        with httpx.Client(timeout=45) as client:
            res = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": key},
                json=payload,
            )
            res.raise_for_status()
            text = (
                res.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
    except Exception as e:
        print(f"[AI] Weekly summary failed: {e}")
        return None

    cleaned = text.strip().strip('"')
    return cleaned if len(cleaned) >= 20 else None


READ_EVAL_PROMPT = """Bạn là sư phụ kiểm tra tâm đắc đọc sách của đệ tử trong app tu tiên.

Sách: {title}
Đệ tử viết: {note}

Nhiệm vụ:
1. Đánh giá xem note có phải là tóm tắt/ý hiểu thật sự về sách không (không phải chữ vô nghĩa, spam, hay nhại lại đề bài).
2. Nếu hợp lệ, ra MỘT câu hỏi khó vừa phải về ý chính trong note (đáp án nằm trong note).
3. Lưu đáp án đúng.

Trả lời DUY NHẤT một chuỗi JSON, không kèm giải thích:
{{"valid": true|false, "reason": "lý do ngắn", "question": "câu hỏi (bỏ trống nếu không hợp lệ)", "answer": "đáp án đúng (bỏ trống nếu không hợp lệ)"}}"""


def evaluate_reading(title: str, note: str) -> dict:
    """Đánh giá note đọc sách + tạo câu hỏi. Trả dict valid/reason/question/answer."""
    key = settings.gemini_api_key
    if not key:
        return {"valid": True, "reason": "", "question": "", "answer": ""}

    prompt = READ_EVAL_PROMPT.format(title=title, note=note)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 2000},
    }

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": key},
                json=payload,
            )
            res.raise_for_status()
            text = (
                res.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
    except Exception as e:
        print(f"[AI] Reading eval failed: {e}")
        return {"valid": True, "reason": "", "question": "", "answer": ""}

    try:
        cleaned = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)
    except Exception:
        print(f"[AI] Cannot parse reading eval: {text[:200]}")
        return {"valid": True, "reason": "", "question": "", "answer": ""}


READ_CHECK_PROMPT = """Sách: {title}
Câu hỏi: {question}
Đáp án đúng: {answer}
Đệ tử trả lời: {user_answer}

Đánh giá câu trả lời của đệ tử so với đáp án đúng (chấp nhận diễn đạt khác nhưng đúng ý).

Trả lời DUY NHẤT chuỗi JSON: {{"correct": true|false}}"""


def check_reading_answer(title: str, question: str, answer: str, user_answer: str) -> bool:
    key = settings.gemini_api_key
    if not key:
        return True

    prompt = READ_CHECK_PROMPT.format(
        title=title, question=question, answer=answer, user_answer=user_answer
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 500},
    }

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": key},
                json=payload,
            )
            res.raise_for_status()
            text = (
                res.json()
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
        cleaned = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return bool(json.loads(cleaned).get("correct"))
    except Exception as e:
        print(f"[AI] Reading check failed: {e}")
        return True
