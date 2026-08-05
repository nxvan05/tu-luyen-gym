"use client";

/**
 * Fetch có tự động thử lại — backend Render free hay "ngủ" sau 15 phút,
 * lần gọi đầu có thể lỗi 504. Thử lại nhiều lần cách nhau vài giây.
 */
export async function fetchWithRetry(
  url: string,
  attempts = 4,
  delayMs = 5000
): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok || (res.status !== 502 && res.status !== 504)) {
        return res;
      }
    } catch {
      /* backend chưa thức — thử lại */
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}
