"use client";

import { useEffect, useRef, useState } from "react";

import { Flame } from "lucide-react";

import { BUILD_STAGES } from "@/lib/game";

type Mood = "radiant" | "flourish" | "growing" | "neglected";

const QUOTES: Record<Mood, string> = {
  radiant: "Đạo tâm kiên định, đại đạo có thể kỳ.",
  flourish: "Đạo tâm ngày càng vững chãi.",
  growing: "Đạo tâm sơ khai, hãy kiên trì.",
  neglected: "Đạo tâm dao động — thế giới đang chờ ngươi trở lại.",
};

/* ---------- Ngày / đêm theo giờ thật ---------- */
type Period = "dawn" | "day" | "dusk" | "night";

function periodOf(hour: number): Period {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

const PERIOD_META: Record<
  Period,
  {
    sky: string;
    sun?: boolean;
    moon?: boolean;
    stars?: boolean;
    glow: string;
    label: string;
  }
> = {
  dawn: {
    sky: "bg-gradient-to-b from-[oklch(0.62_0.09_55)] via-[oklch(0.45_0.1_75)] to-[oklch(0.32_0.08_190)]",
    sun: true,
    glow: "bg-[oklch(0.95_0.12_75)] shadow-[0_0_30px_oklch(0.95_0.12_75/70%)]",
    label: "Bình minh",
  },
  day: {
    sky: "bg-gradient-to-b from-[oklch(0.55_0.12_210)] via-[oklch(0.42_0.1_190)] to-[oklch(0.3_0.06_180)]",
    sun: true,
    glow: "bg-[oklch(0.95_0.1_85)] shadow-[0_0_34px_oklch(0.95_0.1_85/70%)]",
    label: "Ban ngày",
  },
  dusk: {
    sky: "bg-gradient-to-b from-[oklch(0.6_0.13_45)] via-[oklch(0.42_0.12_300)] to-[oklch(0.28_0.07_265)]",
    moon: true,
    stars: true,
    glow: "bg-[oklch(0.92_0.1_70)] shadow-[0_0_26px_oklch(0.92_0.1_70/60%)]",
    label: "Hoàng hôn",
  },
  night: {
    sky: "bg-gradient-to-b from-[oklch(0.32_0.06_270)] via-[oklch(0.24_0.05_265)] to-[oklch(0.17_0.04_260)]",
    moon: true,
    stars: true,
    glow: "bg-[oklch(0.9_0.04_250)] shadow-[0_0_22px_oklch(0.9_0.04_250/55%)]",
    label: "Màn đêm",
  },
};

/* ---------- Thời tiết theo ngày (seed từ ngày thật) ---------- */
type Weather = "clear" | "clouds" | "rain" | "fog";

const WEATHER_NAMES: Record<Weather, string> = {
  clear: "trời quang",
  clouds: "mây lững thững",
  rain: "mưa nhẹ",
  fog: "sương mù",
};

function hashDate(iso: string): number {
  let h = 0;
  for (let i = 0; i < iso.length; i++) {
    h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  }
  return h;
}

function weatherOf(iso: string): Weather {
  const r = hashDate(iso) % 100;
  if (r < 50) return "clear";
  if (r < 70) return "clouds";
  if (r < 85) return "rain";
  return "fog";
}

/* ---------- Động Phủ lớn dần theo chuỗi (BUILD_STAGES dùng chung từ lib/game) ---------- */
function buildStageOf(streak: number): { emoji: string; name: string; idx: number } {
  let stage = BUILD_STAGES[0];
  let idx = 0;
  for (let i = 0; i < BUILD_STAGES.length; i++) {
    if (streak >= BUILD_STAGES[i].at) {
      stage = BUILD_STAGES[i];
      idx = i;
    }
  }
  return { emoji: stage.emoji, name: stage.name, idx };
}

/* ---------- Mặt trăng / sao / đom đóm ---------- */
const STARS = [
  { left: 8, top: 12, delay: 0, duration: 3.2 },
  { left: 22, top: 30, delay: 1.1, duration: 2.6 },
  { left: 38, top: 10, delay: 0.5, duration: 3.8 },
  { left: 55, top: 26, delay: 1.8, duration: 2.9 },
  { left: 70, top: 8, delay: 0.2, duration: 3.4 },
  { left: 85, top: 22, delay: 1.4, duration: 2.7 },
  { left: 93, top: 42, delay: 0.8, duration: 3.1 },
];

const FIREFLIES = Array.from({ length: 7 }, (_, i) => ({
  left: 8 + ((i * 37) % 84),
  top: 18 + ((i * 29) % 55),
  delay: i * 0.6,
  duration: 2.2 + (i % 4) * 0.5,
}));

const LEAVES = Array.from({ length: 4 }, (_, i) => ({
  left: 10 + i * 22,
  delay: i * 1.4,
  duration: 6 + (i % 3) * 2,
  drift: (i % 2 ? 1 : -1) * (30 + i * 14),
}));

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

const CLOUDS = [
  { top: 16, size: 60, duration: 38, delay: 0, opacity: 0.35 },
  { top: 32, size: 40, duration: 52, delay: -18, opacity: 0.25 },
  { top: 46, size: 28, duration: 44, delay: -30, opacity: 0.2 },
];

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

function firstLine(
  period: Period,
  weather: Weather,
  mood: Mood,
  streak: number,
  stageName: string
): string {
  const time = PERIOD_META[period].label;
  if (mood === "neglected") {
    return `Màn đêm vắng lặng — động phủ đã ${streak === 0 ? "lâu" : streak} ngày không có chủ nhân.`;
  }
  const dayPart =
    period === "night" && weather === "clear"
      ? "trăng thanh gió mát"
      : `${WEATHER_NAMES[weather]}, linh khí ${weather === "rain" ? "nồng đượm" : weather === "fog" ? "ẩm mát" : "dồi dào"}`;
  return `${time} · ${dayPart} · ${stageName} của đệ tử đang hấp thụ linh khí.`;
}

const PET: Record<Mood, { emoji: string; anim: string; name: string }> = {
  radiant: { emoji: "🐲", anim: "animate-bounce", name: "Huyền Long Thú" },
  flourish: { emoji: "🦊", anim: "animate-bounce", name: "Linh Hồ Thú" },
  growing: { emoji: "🐢", anim: "animate-float", name: "Linh Quy Sơ Khai" },
  neglected: { emoji: "😴", anim: "", name: "Linh thú ngủ gật" },
};

const MOOD_RANK: Record<Mood, number> = {
  neglected: 0,
  growing: 1,
  flourish: 2,
  radiant: 3,
};

interface Props {
  streak: number;
  checkedInToday: boolean;
  lastCheckinDate: string | null;
}

export function RealmScene({ streak, checkedInToday, lastCheckinDate }: Props) {
  const mood = moodOf(streak, checkedInToday, lastCheckinDate);
  const neglected = mood === "neglected";
  const [now, setNow] = useState(() => new Date());

  const prevRank = useRef(MOOD_RANK[mood]);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const prev = prevRank.current;
    const cur = MOOD_RANK[mood];
    prevRank.current = cur;
    if (cur > prev && cur >= 2 && !neglected) {
      setEvolving(true);
      const t = setTimeout(() => setEvolving(false), 2600);
      return () => clearTimeout(t);
    }
  }, [mood, neglected]);

  const period = periodOf(now.getHours());
  const meta = PERIOD_META[period];
  const weather = weatherOf(today());
  const stage = buildStageOf(streak);
  const isNight = period === "night";
  const isRain = weather === "rain";
  const isFog = weather === "fog";
  const pet = PET[mood];
  const petSleeping = isNight && mood !== "neglected";
  const line = firstLine(period, weather, mood, streak, stage.name);

  return (
    <div className="relative h-48 overflow-hidden rounded-2xl border border-border/70 shadow-inner">
      <div className={`absolute inset-0 transition-colors duration-1000 ${meta.sky}`} />

      {/* mặt trời / trăng */}
      {meta.sun && (
        <div
          className={`absolute right-8 top-4 size-9 rounded-full transition-colors duration-1000 ${meta.glow}`}
        />
      )}
      {meta.moon && (
        <div
          className={`absolute right-8 top-4 size-9 rounded-full transition-colors duration-1000 ${meta.glow}`}
        />
      )}

      {/* sao */}
      {meta.stars && (
        <>
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
          {/* đom đóm */}
          {FIREFLIES.map((f, i) => (
            <span
              key={i}
              className="animate-twinkle absolute size-1.5 rounded-full bg-[oklch(0.9_0.15_110)] shadow-[0_0_8px_oklch(0.9_0.15_110/80%)]"
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                animationDelay: `${f.delay}s`,
                animationDuration: `${f.duration}s`,
              }}
            />
          ))}
        </>
      )}

      {/* mây — lúc mưa dày hơn */}
      {(meta.stars || meta.sun || weather === "clouds") &&
        !isRain &&
        CLOUDS.map((c, i) => (
          <span
            key={i}
            className="animate-drift absolute rounded-full bg-white/30 blur-[1px]"
            style={{
              top: `${c.top}%`,
              width: c.size,
              height: c.size / 2.4,
              opacity: isNight ? c.opacity * 0.5 : c.opacity,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

      {/* mưa */}
      {isRain && !neglected && (
        <>
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
          <div className="absolute inset-0 bg-sky-900/10" />
        </>
      )}

      {/* sương mù */}
      {isFog && (
        <div className="animate-float absolute inset-0 bg-[oklch(0.8_0.02_240/14%)] backdrop-blur-[1px]" />
      )}

      {/* lá bay (ban ngày, trời quang) */}
      {weather === "clear" && period === "day" && !neglected &&
        LEAVES.map((l, i) => (
          <span
            key={i}
            className="animate-leaf absolute top-1/4 text-sm"
            style={
              {
                left: `${l.left}%`,
                animationDelay: `${l.delay}s`,
                animationDuration: `${l.duration}s`,
                "--drift": `${l.drift}px`,
              } as React.CSSProperties
            }
          >
            🍃
          </span>
        ))}

      {/* bụi linh khí */}
      {!neglected &&
        DUST.map((d, i) => (
          <span
            key={i}
            className="animate-float absolute size-1.5 rounded-full bg-white/25"
            style={{ left: `${d.left}%`, top: `${d.top}%`, animationDelay: `${d.delay}s` }}
          />
        ))}

      {neglected && <div className="absolute inset-0 bg-[oklch(0.1_0.01_260/40%)]" />}

      <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-[oklch(0.16_0.03_150/60%)]" />

      {/* Động Phủ — càng lớn càng xịn */}
      <div className="absolute bottom-1 left-4 flex flex-col items-center gap-0.5">
        <span
          className={`text-3xl transition-all duration-700 ${stage.idx >= 3 ? "animate-pop-glow" : ""}`}
        >
          {stage.emoji}
        </span>
        <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[9px] text-white/80 backdrop-blur-sm">
          {stage.name}
        </span>
      </div>

      {/* Linh thú */}
      <div className="absolute bottom-1 right-8 text-right">
        <div className="mb-0.5">
          <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
            🐾 {petSleeping ? `${pet.name} · đang ngủ` : pet.name}
          </span>
        </div>
        <span className="relative inline-block text-4xl">
          <span className={petSleeping ? "" : pet.anim}>{pet.emoji}</span>
          {petSleeping && <span className="absolute -top-3 left-2 animate-twinkle text-xs text-white/60">💤</span>}
          {neglected && <span className="absolute -top-3 left-2 text-xs text-white/60">💤</span>}
        </span>
      </div>

      {evolving && (
        <div className="animate-pop-glow absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="text-5xl">⚡</div>
          <p className="font-heading mt-2 text-sm font-bold tracking-[0.3em] text-amber-300">
            TIẾN HÓA
          </p>
          <p className="mt-1 text-xs text-white/80">
            {pet.emoji} {pet.name}
          </p>
        </div>
      )}

      {/* Lửa Đạo Tâm — chuỗi càng dài lửa càng rực */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 backdrop-blur-sm">
        <Flame
          className={`size-3.5 transition-all ${
            neglected
              ? "text-white/40"
              : streak >= 30
                ? "animate-pop-glow text-red-400"
                : streak >= 7
                  ? "animate-pop-glow text-primary"
                  : "text-amber-400"
          }`}
        />
        <span className="text-[10px] font-semibold text-white/90">{streak}</span>
      </div>

      <div className="absolute bottom-2 left-1/2 flex w-max max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 backdrop-blur-sm">
        <p className="truncate text-[11px] text-white/90">
          {neglected ? QUOTES[mood] : line}
        </p>
      </div>
    </div>
  );
}
