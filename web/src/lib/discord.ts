import "server-only";

import { randomBytes } from "node:crypto";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator?: string;
}

export function discordConfig(): {
  clientId: string;
  redirectUri: string;
} {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error(
      "Thiếu cấu hình Discord OAuth. Xem .env.local.example và tạo app tại https://discord.com/developers/applications"
    );
  }
  return { clientId, redirectUri };
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
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export function generateState(): string {
  return randomBytes(16).toString("hex");
}

export function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error(
      "Thiếu BACKEND_URL trong .env.local (ví dụ http://localhost:8000)"
    );
  }
  return url;
}
