/**
 * Types + helper khớp với backend FastAPI (/api/dashboard, /api/checkin).
 */

export const REALMS = [
  "Luyện Khí kỳ",
  "Trúc Cơ kỳ",
  "Kim Đan kỳ",
  "Nguyên Anh kỳ",
  "Hóa Thần kỳ",
  "Hợp Thể kỳ",
  "Đại Thừa kỳ",
  "Độ Kiếp kỳ",
  "Chân Tiên",
] as const;

export const REALM_STAGES = [
  "Sơ kỳ",
  "Trung kỳ",
  "Hậu kỳ",
  "Đỉnh phong",
] as const;

export function realmAt(level: number): string {
  return REALMS[Math.min(REALMS.length - 1, Math.floor(level / 10))];
}

export function realmStage(level: number): string {
  return REALM_STAGES[Math.min(REALM_STAGES.length - 1, Math.floor((level % 10) / 3))];
}

export const WORKOUT_TYPES = [
  { key: "push", label: "Push", emoji: "🏋️" },
  { key: "pull", label: "Pull", emoji: "🧗" },
  { key: "legs", label: "Legs", emoji: "🦵" },
  { key: "cardio", label: "Cardio", emoji: "🏃" },
  { key: "rest", label: "Rest", emoji: "🧘" },
] as const;

export interface CultivatorData {
  id: string;
  discord_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  exp: number;
  exp_to_next: number;
  streak: number;
  best_streak: number;
  checked_in_today: boolean;
  energy?: number;
  last_checkin_date: string | null;
}

export interface BossData {
  name: string;
  hp: number;
  max_hp: number;
  ends_at: string | null;
  my_damage: number;
}

export interface QuestData {
  id: string;
  title: string;
  workout_type: string;
  exp: number;
  done: boolean;
}

export interface AchievementData {
  id: string;
  title: string;
  emoji: string;
  unlocked: boolean;
}

export interface DaoPath {
  code: string;
  name: string;
  emoji: string;
  exp: number;
  level: number;
  exp_to_next: number;
  rest: number;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  content: string;
}

export interface DashboardData {
  cultivator: CultivatorData;
  paths: DaoPath[];
  boss: BossData | null;
  quests: QuestData[];
  achievements: AchievementData[];
  journal: JournalEntry[];
}

export interface CheckinResult {
  exp_gained: number;
  streak: number;
  damage: number;
  level: number;
  leveled_up: boolean;
  new_achievements: { id: string; title: string; emoji: string }[];
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  username: string;
  avatar_url: string | null;
  level?: number;
  exp?: number;
  best_streak?: number;
  damage?: number;
}

export interface LeaderboardData {
  exp: LeaderboardRow[];
  streak: LeaderboardRow[];
  boss: LeaderboardRow[];
}
