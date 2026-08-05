import "server-only";

import { jwtVerify } from "jose";

import { getSessionCookie } from "@/lib/session";

export interface Session {
  token: string;
  discord: {
    id: string;
    username: string;
    global_name: string | null;
    avatar_url: string | null;
  };
}

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Thiếu JWT_SECRET trong .env.local — phải giống backend/.env"
    );
  }
  return new TextEncoder().encode(secret);
}

/** Đọc + xác minh JWT từ cookie. Trả null nếu không có hoặc hết hạn. */
export async function getSession(): Promise<Session | null> {
  const raw = await getSessionCookie();
  if (!raw) return null;

  try {
    const { payload } = await jwtVerify(raw, jwtSecret());
    const sub = payload.sub;
    if (!sub) return null;
    return {
      token: raw,
      discord: {
        id: sub,
        username: String(payload.username ?? ""),
        global_name: String(payload.display_name ?? payload.username ?? ""),
        avatar_url: payload.avatar ? String(payload.avatar) : null,
      },
    };
  } catch {
    return null;
  }
}
