"use client";

import { Flame } from "lucide-react";

type Mood = "radiant" | "flourish" | "growing" | "neglected";

const QUOTES: Record<Mood, string> = {
  radiant: "Đạo tâm kiên định, đại đạo có thể kỳ.",
  flourish: "Đạo tâm ngày càng vững chãi.",
  growing: "Đạo tâm sơ khai, hãy kiên trì.",
  neglected: "Đạo tâm dao động — thế giới đang chờ ngươi trở lại.",
};

const SKY: Record<Mood, string> = {
  radiant:
    "bg-gradient-to-b from-[oklch(0.55_0.12_210)] via-[oklch(0.42_0.1_190)] to-[oklch(0.3_0.06_180)]",
  flourish:
    "bg-gradient-to-b from-[oklch(0.5_0.1_280)] via-[oklch(0.38_0.08_260)] to-[oklch(0.26_0.05_250)]",
  growing:
    "bg-gradient-to-b from-[oklch(0.42_0.09_300)] via-[oklch(0.3_0.06_280)] to-[oklch(0.2_0.04_270)]",
  neglected:
    "bg-gradient-to-b from-[oklch(0.3_0.02_265)] via-[oklch(0.24_0.02_260)] to-[oklch(0.17_0.02_255)]",
};

const PLANT: Record<Mood, { emoji: string; glow: string }> = {
  radiant: { emoji: "🌳", glow: "drop-shadow-[0_0_18px_oklch(0.7_0.11_170/80%)]" },
  flourish: { emoji: "🌿", glow: "drop-shadow-[0_0_12px_oklch(0.7_0.11_170/60%)]" },
  growing: { emoji: "🌱", glow: "" },
  neglected: { emoji: "🌱", glow: "" },
};

const PET: Record<Mood, { emoji: string; anim: string }> = {
  radiant: { emoji: "🐲", anim: "animate-bounce" },
  flourish: { emoji: "🦊", anim: "animate-bounce" },
  growing: { emoji: "🐢", anim: "animate-float" },
  neglected: { emoji: "😴", anim: "" },
};

const STARS = [
  { left: 8, top: 12, delay: 0, duration: 3.2 },
  { left: 22, top: 30, delay: 1.1, duration: 2.6 },
  { left: 38, top: 10, delay: 0.5, duration: 3.8 },
  { left: 55, top: 26, delay: 1.8, duration: 2.9 },
  { left: 70, top: 8, delay: 0.2, duration: 3.4 },
  { left: 85, top: 22, delay: 1.4, duration: 2.7 },
  { left: 93, top: 42, delay: 0.8, duration: 3.1 },
];

const CLOUDS = [
  { top: 18, size: 60, duration: 38, delay: 0, opacity: 0.35 },
  { top: 34, size: 40, duration: 52, delay: -18, opacity: 0.25 },
  { top: 48, size: 28, duration: 44, delay: -30, opacity: 0.2 },
];

const RAIN = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61) % 100,
  delay: (i * 0.37) % 1.8,
  duration: 0.9 + ((i * 17) % 5) * 0.12,
}));

const DUST = Array.from({ length: 8 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: 20 + ((i * 29) % 50),
  delay: i * 0.7,
}));

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function moodOf(streak: number, checkedInToday: boolean, lastCheckin: string | null): Mood {
  if (checkedInToday && streak === 1 && lastCheckin === today()) {
    return "growing";
  }
  if (streak >= 7) return "radiant";
  if (streak >= 3) return "flourish";
  if (streak >= 1) return "growing";
  return "neglected";
}

interface Props {
  streak: number;
  checkedInToday: boolean;
  lastCheckinDate: string | null;
}

export function RealmScene({ streak, checkedInToday, lastCheckinDate }: Props) {
  const mood = moodOf(streak, checkedInToday, lastCheckinDate);
  const plant = PLANT[mood];
  const pet = PET[mood];
  const neglected = mood === "neglected";

  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-border/70 shadow-inner">
      <div className={`absolute inset-0 ${SKY[mood]}`} />

      {!neglected && (
        <>
          <div
            className={`absolute right-8 top-4 size-9 rounded-full ${
              mood === "radiant"
                ? "animate-pop-glow bg-[oklch(0.95_0.1_85)] shadow-[0_0_34px_oklch(0.95_0.1_85/70%)]"
                : mood === "flourish"
                  ? "bg-[oklch(0.9_0.12_300)] shadow-[0_0_26px_oklch(0.9_0.12_300/60%)]"
                  : "bg-[oklch(0.88_0.06_320)] shadow-[0_0_22px_oklch(0.88_0.06_320/50%)]"
            }`}
          />
          {STARS.map((s, i) => (
            <span
              key={i}
              className="animate-twinkle absolute size-1 rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
          {CLOUDS.map((c, i) => (
            <span
              key={i}
              className="animate-drift absolute rounded-full bg-white/30 blur-[1px]"
              style={{
                top: `${c.top}%`,
                width: c.size,
                height: c.size / 2.4,
                opacity: c.opacity,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {neglected && (
        <>
          <div className="absolute inset-0 bg-[oklch(0.1_0.01_260/40%)]" />
          {RAIN.map((r, i) => (
            <span
              key={i}
              className="animate-rain absolute top-0 w-px bg-sky-200/60"
              style={{
                left: `${r.left}%`,
                height: 26,
                animationDelay: `${r.delay}s`,
                animationDuration: `${r.duration}s`,
              }}
            />
          ))}
          {DUST.map((d, i) => (
            <span
              key={i}
              className="animate-float absolute size-1.5 rounded-full bg-white/15"
              style={{ left: `${d.left}%`, top: `${d.top}%`, animationDelay: `${d.delay}s` }}
            />
          ))}
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-[oklch(0.16_0.03_150/60%)]" />

      <div
        className={`absolute bottom-1 left-6 text-4xl transition-all ${plant.glow} ${
          neglected ? "rotate-[-8deg] grayscale" : ""
        }`}
        title={neglected ? "Cây linh thảo đang héo" : "Linh thảo lớn dần"}
      >
        {plant.emoji}
      </div>

      <div className="absolute bottom-1 right-8 text-4xl">
        <span className={pet.anim}>{pet.emoji}</span>
        {neglected && <span className="absolute -top-3 left-2 text-xs text-white/60">💤</span>}
      </div>

      <div className="absolute bottom-2 left-1/2 flex w-max max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 backdrop-blur-sm">
        <Flame
          className={`size-3.5 shrink-0 ${neglected ? "text-white/50" : "animate-pop-glow text-primary"}`}
        />
        <p className="truncate text-xs text-white/90">
          <strong>Đạo Tâm · {streak} ngày</strong> — {QUOTES[mood]}
        </p>
      </div>
    </div>
  );
}
