/**
 * Dữ liệu game giả định — Tuần 1 chỉ để render UI.
 * TODO(game): Thay bằng dữ liệu thật từ backend FastAPI + Supabase.
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

export function realmAt(level: number): string {
  return REALMS[Math.min(REALMS.length - 1, Math.floor(level / 10))];
}

export const REALM_STAGES = [
  "Sơ kỳ",
  "Trung kỳ",
  "Hậu kỳ",
  "Đỉnh phong",
] as const;

export interface CultivatorState {
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  streak: number;
  bestStreak: number;
  energy: number; // Linh Khí 0-100
  checkedInToday: boolean;
}

export function defaultState(name: string): CultivatorState {
  return {
    name,
    level: 27,
    exp: 720,
    expToNext: 1000,
    streak: 37,
    bestStreak: 52,
    energy: 62,
    checkedInToday: false,
  };
}

export interface BossState {
  name: string;
  hp: number;
  maxHp: number;
  weeklyDamage: number;
  reward: number;
}

export const WEEKLY_BOSS: BossState = {
  name: "Ma Thú Thái Cổ Hùng",
  hp: 72,
  maxHp: 100,
  weeklyDamage: 243_000,
  reward: 5_000,
};

export interface Quest {
  id: string;
  title: string;
  type: "push" | "pull" | "legs" | "cardio" | "rest";
  exp: number;
  done: boolean;
}

export const QUESTS: Quest[] = [
  { id: "q1", title: "Đẩy tạ — Push day", type: "push", exp: 120, done: false },
  { id: "q2", title: "Kéo xà — Pull day", type: "pull", exp: 120, done: false },
  { id: "q3", title: "Chân — Legs day", type: "legs", exp: 130, done: false },
  { id: "q4", title: "Chạy 30 phút — Cardio", type: "cardio", exp: 90, done: false },
  { id: "q5", title: "Nghỉ ngơi — Rest day", type: "rest", exp: 40, done: false },
];

export const WORKOUT_TYPES = [
  { key: "push", label: "Push", emoji: "🏋️" },
  { key: "pull", label: "Pull", emoji: "🧗" },
  { key: "legs", label: "Legs", emoji: "🦵" },
  { key: "cardio", label: "Cardio", emoji: "🏃" },
  { key: "rest", label: "Rest", emoji: "🧘" },
] as const;

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "Bắt đầu tu luyện", emoji: "🌱", unlocked: true },
  { id: "a2", title: "Chuỗi 7 ngày", emoji: "🔥", unlocked: true },
  { id: "a3", title: "Chuỗi 30 ngày", emoji: "⛩️", unlocked: true },
  { id: "a4", title: "Đột phá Kim Đan", emoji: "💛", unlocked: true },
  { id: "a5", title: "Hạ sát Boss tuần", emoji: "🐉", unlocked: false },
  { id: "a6", title: "Chuỗi 100 ngày", emoji: "👑", unlocked: false },
];
