import "server-only";

import { backendUrl } from "@/lib/discord";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/** Gọi backend FastAPI. */
export async function api<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${backendUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      return {
        ok: false,
        status: res.status,
        data: null,
        error: typeof detail?.detail === "string" ? detail.detail : `HTTP ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: (await res.json()) as T, error: null };
  } catch {
    return { ok: false, status: 0, data: null, error: "Không kết nối được backend" };
  }
}
