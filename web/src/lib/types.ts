export const AVATAR_URL = "https://cdn.discordapp.com";

/** Tạo URL avatar từ dữ liệu Discord (avatar_url đã lưu trong DB). */
export function avatarUrl(avatarUrlValue: string | null, size = 128): string {
  if (!avatarUrlValue) return `${AVATAR_URL}/embed/avatars/0.png`;
  if (avatarUrlValue.startsWith("http")) return avatarUrlValue;
  return `${AVATAR_URL}${avatarUrlValue}?size=${size}`;
}
