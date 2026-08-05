import { NextResponse } from "next/server";

import { deleteSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST() {
  await deleteSessionCookie();
  return NextResponse.json({ ok: true });
}
