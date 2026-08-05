export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator?: string;
}

export interface Session {
  discord: DiscordUser;
  /** ID tu luyện giả định — thay bằng JWT khi backend FastAPI hoàn thiện */
  cultivationId: string;
  realm: number;
  exp: number;
}

export const AVATAR_URL = "https://cdn.discordapp.com";

export function discordAvatarUrl(user: DiscordUser, size = 128): string {
  if (!user.avatar) {
    const index = Number(user.discriminator) % 5;
    return `${AVATAR_URL}/embed/avatars/${index}.png`;
  }
  return `${AVATAR_URL}/avatars/${user.id}/${user.avatar}.png?size=${size}`;
}

export function avatarUrl(user: DiscordUser, size = 128): string {
  return discordAvatarUrl(user, size);
}
