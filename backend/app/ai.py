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
        "generationConfig": {"temperature": 0, "maxOutputTokens": 200},
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
