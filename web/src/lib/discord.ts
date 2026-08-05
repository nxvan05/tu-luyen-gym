import "server-only";

import { randomBytes } from "node:crypto";

import type { DiscordUser } from "@/lib/types";

const DISCORD_API = "https://discord.com/api";

export function discordConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Thiếu cấu hình Discord OAuth. Xem .env.local.example và tạo app tại https://discord.com/developers/applications"
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function discordAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = discordConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export function generateState(): string {
  return randomBytes(16).toString("hex");
}

export async function exchangeCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = discordConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord user fetch failed: ${res.status}`);
  }

  return (await res.json()) as DiscordUser;
}
