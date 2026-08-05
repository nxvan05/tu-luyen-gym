import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { api } from "@/lib/backend";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const res = await api("/api/meditate", { token: session.token, method: "POST", body });
  return NextResponse.json(res.data ?? { error: res.error }, {
    status: res.ok ? 200 : res.status || 502,
  });
}
