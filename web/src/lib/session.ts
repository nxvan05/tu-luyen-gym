import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "tlg_session";

/**
 * TODO(auth): Session hiện tại là payload JSON base64 (chỉ để demo flow OAuth).
 * Khi backend FastAPI + Supabase xong, thay bằng JWT do backend cấp
 * và dùng middleware/proxy để verify.
 */
export async function getSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCookie(value: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function deleteSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
