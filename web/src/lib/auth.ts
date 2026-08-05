import "server-only";

import { getSessionCookie } from "@/lib/session";
import type { Session } from "@/lib/types";

export async function getSession(): Promise<Session | null> {
  const raw = await getSessionCookie();
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}
