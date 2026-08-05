import { NextResponse } from "next/server";

import { discordAuthorizeUrl, generateState } from "@/lib/discord";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set("tlg_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(discordAuthorizeUrl(state));
}
