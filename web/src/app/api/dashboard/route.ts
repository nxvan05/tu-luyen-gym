import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { api } from "@/lib/backend";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const res = await api("/api/dashboard", { token: session.token });
  return NextResponse.json(res.data ?? { error: res.error }, {
    status: res.ok ? 200 : res.status || 502,
  });
}
