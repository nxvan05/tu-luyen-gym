import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendUrl } from "@/lib/discord";
import { setSessionCookie } from "@/lib/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("tlg_oauth_state")?.value;

  cookieStore.delete("tlg_oauth_state");

  if (error) {
    return NextResponse.redirect(`${appUrl()}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${appUrl()}/?error=state_mismatch`);
  }

  try {
    const res = await fetch(`${backendUrl()}/api/auth/discord`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Backend auth failed", res.status);
      return NextResponse.redirect(`${appUrl()}/?error=auth_failed`);
    }

    const data = (await res.json()) as { token: string };
    await setSessionCookie(data.token);
    return NextResponse.redirect(`${appUrl()}/dashboard`);
  } catch (e) {
    console.error("Discord OAuth callback failed", e);
    return NextResponse.redirect(`${appUrl()}/?error=auth_failed`);
  }
}
