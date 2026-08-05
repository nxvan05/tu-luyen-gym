"use client";

import { useEffect, useRef, useState } from "react";

import { Flame } from "lucide-react";

import { CultivatorCharacter, type CharPose } from "@/components/dashboard/cultivator-character";
import { BUILD_STAGES, realmAt, realmStage } from "@/lib/game";
import { haptic, playAmbient, playRewardTing, playLevelChime, stopAmbient } from "@/lib/sound";

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

/* ---------- Tương tác: vật phẩm trong Động Phủ ---------- */
interface Toast {
  id: number;
  emoji: string;
  text: string;
}

interface Burst {
  id: number;
  emoji: string;
  left: number;
  top: number;
}

const TREE_LINES = [
  "Cây Đạo reo vui hấp thụ linh khí.",
  "Một chiếc lá mới nhú — đạo lộ thêm dấu chân.",
  "Rễ cây quấn quanh tảng đá, kiên cố hơn mỗi ngày.",
  "Cây Đạo xào xạc như đang thì thầm tâm pháp.",
];

const STONE_LINES = [
  "Ngươi nâng tạ đá — khí huyết sôi trào!",
  "Ba hơi thở, một lần đẩy — cơ bắp gào lên.",
  "Tạ đá rung lên theo nhịp mạch đập của ngươi.",
  "Mồ hôi rơi xuống, sức mạnh trồi lên.",
];

const MAT_LINES = [
  "Tâm như chỉ thủy, linh khí tụ về bồ đoàn.",
  "Một hơi thở vào, một vòng tuần hoàn.",
  "Tạp niệm tan đi như sương sớm.",
  "Nội tức viên mãn, đan điền ấm áp.",
];

const ALTAR_LINES = [
  "Ngươi dâng một nén hương, xin đạo tâm bền vững.",
  "Khói hương bay lên — cát tường đang gõ cửa.",
  "Linh khí quanh bàn thờ xoáy nhẹ một vòng.",
  "Sư tổ phù hộ, hôm nay ắt gặp chuyện lành.",
];

const PET_LINES = [
  "Linh thú vui vẻ nhảy quanh chủ nhân.",
  "Nó cọ đầu vào chân ngươi, mắt sáng rực.",
  "Linh thú thở ra một ngụm linh khí ngọt lành.",
  "Nó vểnh tai, như đang ghi nhớ công phu của ngươi.",
];

const FORTUNES = [
  "Đại cát — hôm nay linh khí thuận tay.",
  "Trung cát — kiên trì là thắng lợi.",
  "Tiểu cát — gặp người hiền, nhớ mỉm cười.",
  "Đại hung nhỏ — đừng bỏ bữa tập hôm nay.",
  "Bình thản — luyện chậm mà chắc.",
  "Hỷ thần chiếu mệnh — ắt có điều vui.",
  "Tài vận dồi dào — EXP đang chờ ngươi.",
  "Thiên địa đồng lòng — tập nặng hơn một chút.",
  "Mưa thuận gió hòa — thân pháp ngày càng uyển chuyển.",
  "Quẻ này vô danh — nhưng đường ngươi tự mở.",
];

const INTERACT_STYLE = `
  @keyframes tlg-burst { 0% { transform: translateY(0) scale(.6); opacity: 1; } 100% { transform: translateY(-46px) scale(1.2); opacity: 0; } }
  .animate-burst { animation: tlg-burst 1.2s ease-out forwards; }
  @keyframes tlg-toast { 0% { opacity: 0; transform: translate(-50%, 6px); } 12% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; } 100% { opacity: 0; } }
  .animate-toast { animation: tlg-toast 3.4s ease-in-out forwards; }
  @keyframes tlg-ring { 0% { box-shadow: 0 0 0 0 oklch(0.9 0.15 85 / .35); } 100% { box-shadow: 0 0 0 10px oklch(0.9 0.15 85 / 0); } }
  .animate-ring { animation: tlg-ring 2s ease-out infinite; }
  @keyframes tlg-shoot { 0% { transform: translate(0, 0) rotate(-16deg); opacity: 0; } 8% { opacity: 1; } 45% { opacity: 0; } 100% { transform: translate(140px, 48px) rotate(-16deg); opacity: 0; } }
  .animate-shoot { animation: tlg-shoot 3.4s linear infinite; }
`;

interface Props {
  streak: number;
  checkedInToday: boolean;
  lastCheckinDate: string | null;
  name?: string;
  level?: number;
  celebrate?: number;
  interactive?: boolean;
}

export function RealmScene({ streak, checkedInToday, lastCheckinDate, name, level, celebrate, interactive = true }: Props) {
  const mood = moodOf(streak, checkedInToday, lastCheckinDate);
  const neglected = mood === "neglected";

  const [pose, setPose] = useState<CharPose | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [hint, setHint] = useState(true);
  const [petHop, setPetHop] = useState(0);
  const idRef = useRef(0);
  const [now, setNow] = useState(() => new Date());
  const [ambient, setAmbient] = useState(() => {
    try {
      return localStorage.getItem("tlg_ambient") === "1";
    } catch {
      return false;
    }
  });

  const prevRank = useRef(MOOD_RANK[mood]);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ambient) playAmbient();
    else stopAmbient();
    return () => stopAmbient();
  }, [ambient]);

  useEffect(() => {
    if (celebrate && celebrate > 0) {
      playLevelChime();
      haptic(60);
      const t = {
        id: ++idRef.current,
        emoji: "⚡",
        text: "Ngươi vừa hoàn thành bế quan — đạo tâm tăng tiến!",
      };
      setToasts((prev) => [...prev.slice(-2), t]);
      const timer = setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
      return () => clearTimeout(timer);
    }
  }, [celebrate]);

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

  function interact(opts: {
    pose?: CharPose;
    burst?: { emoji: string; left: number; top: number };
    text: string;
    emoji: string;
  }) {
    setHint(false);
    playRewardTing();
    haptic(20);
    if (opts.pose) {
      if (poseTimer.current) clearTimeout(poseTimer.current);
      setPose(opts.pose);
      poseTimer.current = setTimeout(() => setPose(null), 5200);
    }
    if (opts.burst) {
      const b = { id: ++idRef.current, ...opts.burst };
      setBursts((prev) => [...prev, b]);
      setTimeout(() => setBursts((prev) => prev.filter((x) => x.id !== b.id)), 1300);
    }
    const t = { id: ++idRef.current, emoji: opts.emoji, text: opts.text };
    setToasts((prev) => [...prev.slice(-2), t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
  }

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

  const fortune = FORTUNES[hashDate(`${today()}-${name ?? "vo-danh"}`) % FORTUNES.length];

  function defaultPose(): CharPose {
    const h = now.getHours();
    if (h >= 21 || h < 5) return "sleep";
    if (!checkedInToday) return "train";
    return "idle";
  }
  const activePose = pose ?? defaultPose();

  return (
    <div className="relative h-52 overflow-hidden rounded-2xl border border-border/70 shadow-inner sm:h-64">
      <style>{INTERACT_STYLE}</style>
      <div className={`absolute inset-0 transition-colors duration-1000 ${meta.sky}`} />

      {/* mặt trời / trăng */}
      {(meta.sun || meta.moon) && (
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
          {[0, 1].map((i) => (
            <span
              key={`shoot-${i}`}
              className="animate-shoot absolute h-px w-16 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ left: `${4 + i * 42}%`, top: `${5 + i * 16}%`, animationDelay: `${2.5 + i * 6.8}s` }}
            />
          ))}
        </>
      )}

      {/* cực quang — chuỗi dài đêm thanh */}
      {isNight && weather === "clear" && streak >= 30 && (
        <div className="animate-float absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-emerald-300/15 via-teal-400/5 to-transparent blur-md" />
      )}

      {/* mây */}
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

      {/* lá bay */}
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

      {/* Động Phủ */}
      <div className="absolute bottom-1 left-3 z-[3] flex flex-col items-center gap-0.5">
        <span
          className={`text-3xl transition-all duration-700 ${stage.idx >= 3 ? "animate-pop-glow" : ""}`}
        >
          {stage.emoji}
        </span>
        <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[9px] text-white/80 backdrop-blur-sm">
          {stage.name}
        </span>
      </div>

      {/* NHÂN VẬT 2D */}
      <div className="absolute bottom-1 left-[24%] z-[4] h-[72%] w-auto sm:left-[28%]">
        <CultivatorCharacter level={Math.max(1, level ?? streak)} pose={activePose} />
      </div>

      {/* nameplate nhân vật */}
      {name && (
        <div className="absolute bottom-[74%] left-[24%] z-[5] sm:left-[28%]">
          <span className="whitespace-nowrap rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[9px] text-white/85 backdrop-blur-sm">
            {name} · Lv {Math.max(1, level ?? streak)} · {realmAt(Math.max(1, level ?? streak))}{" "}
            {realmStage(Math.max(1, level ?? streak))}
          </span>
        </div>
      )}

      {/* Linh thú */}
      <div className="absolute bottom-1 right-7 z-[4] text-right">
        <div className="mb-0.5">
          <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
            🐾 {petSleeping ? `${pet.name} · đang ngủ` : pet.name}
          </span>
        </div>
        <span key={petHop} className="relative inline-block text-4xl">
          <span className={petSleeping ? "" : pet.anim}>{pet.emoji}</span>
          {petSleeping && <span className="animate-twinkle absolute -top-3 left-2 text-xs text-white/60">💤</span>}
          {neglected && <span className="absolute -top-3 left-2 text-xs text-white/60">💤</span>}
        </span>
      </div>

      {/* vật phẩm tương tác */}
      {interactive && (
        <>
          <button
            onClick={() =>
              interact({
                burst: { emoji: "✨", left: 8, top: 55 },
                text: TREE_LINES[hashDate(today()) % TREE_LINES.length],
                emoji: "🌳",
              })
            }
            title="Tưới Cây Đạo"
            className="animate-ring absolute bottom-[30%] left-[7%] z-[6] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-base backdrop-blur-sm transition-transform active:scale-90"
          >
            🌳
          </button>
          <button
            onClick={() =>
              interact({
                pose: "train",
                burst: { emoji: "💦", left: 60, top: 55 },
                text: STONE_LINES[hashDate(today()) % STONE_LINES.length],
                emoji: "🪨",
              })
            }
            title="Tập tạ đá"
            className="animate-ring absolute bottom-[28%] right-[16%] z-[6] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-base backdrop-blur-sm transition-transform active:scale-90"
          >
            🏋️
          </button>
          <button
            onClick={() =>
              interact({
                pose: "meditate",
                burst: { emoji: "🪷", left: 52, top: 40 },
                text: MAT_LINES[hashDate(today()) % MAT_LINES.length],
                emoji: "🧘",
              })
            }
            title="Ngồi thiền"
            className="animate-ring absolute bottom-[38%] right-[30%] z-[6] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-base backdrop-blur-sm transition-transform active:scale-90"
          >
            🧘
          </button>
          <button
            onClick={() =>
              interact({
                burst: { emoji: "🕯️", left: 88, top: 32 },
                text: ALTAR_LINES[hashDate(today()) % ALTAR_LINES.length],
                emoji: "🪔",
              })
            }
            title="Dâng hương"
            className="animate-ring absolute bottom-[52%] right-[6%] z-[6] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-base backdrop-blur-sm transition-transform active:scale-90"
          >
            🪔
          </button>
          <button
            onClick={() => {
              setPetHop((k) => k + 1);
              interact({
                burst: { emoji: "💕", left: 90, top: 70 },
                text: PET_LINES[hashDate(today()) % PET_LINES.length],
                emoji: pet.emoji,
              });
            }}
            title="Vuốt ve linh thú"
            className="animate-ring absolute bottom-[12%] right-[18%] z-[6] flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-base backdrop-blur-sm transition-transform active:scale-90"
          >
            🐾
          </button>
        </>
      )}

      {/* hiệu ứng bắn ra khi tương tác */}
      {bursts.map((b) => (
        <span
          key={b.id}
          className="animate-burst pointer-events-none absolute z-[7] text-lg"
          style={{ left: `${b.left}%`, top: `${b.top}%` }}
        >
          {b.emoji}
        </span>
      ))}

      {/* lời thoại tương tác */}
      {toasts.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-[8] flex flex-col items-center gap-1">
          {toasts.map((t) => (
            <span
              key={t.id}
              className="animate-toast max-w-[90%] truncate rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[11px] text-white/90 backdrop-blur-sm"
            >
              {t.emoji} {t.text}
            </span>
          ))}
        </div>
      )}

      {hint && interactive && !neglected && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[8] -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] text-white/80 backdrop-blur-sm">
          👆 Chạm vào các vật phẩm để tương tác
        </div>
      )}

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

      {/* Lửa Đạo Tâm */}
      <div className="absolute right-3 top-3 z-[5] flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 backdrop-blur-sm">
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

      {/* nhạc nền */}
      <button
        onClick={() => {
          setAmbient((a) => {
            const next = !a;
            try {
              localStorage.setItem("tlg_ambient", next ? "1" : "0");
            } catch {
              /* bỏ qua */
            }
            return next;
          });
        }}
        title={ambient ? "Tắt nhạc nền" : "Bật nhạc nền"}
        className="absolute right-[88px] top-3 z-[5] flex size-7 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[11px] backdrop-blur-sm transition-transform active:scale-90"
      >
        {ambient ? "🔊" : "🔇"}
      </button>

      {/* Quẻ hôm nay */}
      {name && (
        <div className="absolute left-3 top-3 z-[5] flex max-w-[55%] items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 backdrop-blur-sm">
          <span className="text-[10px]">☯️</span>
          <span className="truncate text-[10px] text-white/80">{fortune}</span>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 z-[5] flex w-max max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 backdrop-blur-sm">
        <p className="truncate text-[11px] text-white/90">
          {neglected ? QUOTES[mood] : line}
        </p>
      </div>
    </div>
  );
}
