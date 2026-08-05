import { NextResponse } from "next/server";

import { api } from "@/lib/backend";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await api("/api/boss/activity");
  return NextResponse.json(res.data ?? { error: res.error }, {
    status: res.ok ? 200 : res.status || 502,
  });
}
