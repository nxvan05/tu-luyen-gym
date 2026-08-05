import { NextResponse } from "next/server";

import { api } from "@/lib/backend";
import type { CheckinResult } from "@/lib/game";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    workout_type?: string;
    photo?: string | null;
    photo_url?: string | null;
  } | null;

  if (!body?.workout_type) {
    return NextResponse.json({ error: "Thiếu workout_type" }, { status: 422 });
  }

  const res = await api<CheckinResult>("/api/checkin", {
    method: "POST",
    token: session.token,
    body: {
      workout_type: body.workout_type,
      photo: body.photo ?? null,
      photo_url: body.photo_url ?? null,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error ?? "Check-in thất bại" },
      { status: res.status || 500 }
    );
  }

  return NextResponse.json(res.data);
}
