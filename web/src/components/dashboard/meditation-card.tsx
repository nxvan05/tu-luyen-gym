"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { haptic, playLevelChime, playRewardTing } from "@/lib/sound";

const OPTIONS = [
  { minutes: 5, energy: 10, label: "Ngắn", emoji: "🪷" },
  { minutes: 10, energy: 20, label: "Vừa", emoji: "🧘" },
  { minutes: 20, energy: 40, label: "Sâu", emoji: "🔥" },
];

const BREATH_STYLE = `
  @keyframes tlg-breath { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.18); opacity: 1; } }
  .animate-breath-slow { animation: tlg-breath 8s ease-in-out infinite; }
`;

interface Props {
  onSuccess?: () => void;
}

type Phase = "idle" | "timer" | "done";

export function MeditationCard({ onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(0);
  const [selected, setSelected] = useState<number>(10);
  const [result, setResult] = useState<{ energy: number; exp: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function start(minutes: number) {
    setSelected(minutes);
    setError(null);
    setResult(null);
    setPhase("timer");
    setRemaining(minutes * 60);
    playRewardTing();
    haptic(20);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void finish(minutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("idle");
    setRemaining(0);
  }

  async function finish(minutes: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/meditate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      const data = (await res.json()) as {
        energy_gained?: number;
        exp_gained?: number;
        error?: string;
      };
      if (!res.ok || data.error) {
        setError(data.error ?? "Không ghi nhận được buổi thiền");
        setPhase("idle");
        return;
      }
      setResult({ energy: data.energy_gained ?? 0, exp: data.exp_gained ?? 0 });
      setPhase("done");
      playLevelChime();
      haptic(80);
      onSuccess?.();
    } catch {
      setError("Không kết nối được backend");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="card-glow rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">🧘 Thiền Định</h2>
        {phase === "timer" && (
          <button
            onClick={cancel}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Hủy
          </button>
        )}
      </div>

      {phase === "idle" && (
        <div>
          <p className="mb-3 text-xs text-muted-foreground">
            Nhắm mắt, thả lỏng. Hết giờ sư phụ sẽ ghi nhận linh khí hấp thu — 1 lần/ngày.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => start(opt.minutes)}
                className={cn(
                  "rounded-xl border border-slate-700/60 bg-slate-800/60 px-2 py-3 text-center transition hover:border-jade-400/60 hover:bg-slate-800",
                  busy && "pointer-events-none opacity-50"
                )}
              >
                <div className="text-xl">{opt.emoji}</div>
                <div className="mt-1 text-sm font-semibold">{opt.minutes} phút</div>
                <div className="text-[10px] text-muted-foreground">+{opt.energy} ⚡</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Mỗi buổi thêm EXP và sát thương lên Ma Thú
          </p>
        </div>
      )}

      {phase === "timer" && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <style>{BREATH_STYLE}</style>
          <button
            onClick={cancel}
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
          >
            Hủy thiền ✕
          </button>

          <div className="animate-pop-glow mb-6 text-4xl">🪷</div>

          <div className="relative flex h-56 w-56 items-center justify-center">
            <div className="animate-breath-slow absolute inset-0 rounded-full bg-gradient-to-br from-jade-400/25 via-primary/15 to-transparent blur-md" />
            <div className="animate-breath-slow absolute inset-4 rounded-full border border-jade-400/40 shadow-[0_0_60px_oklch(0.72_0.12_170/35%)]" />
            <div className="relative flex flex-col items-center">
              <span className="font-mono text-4xl font-bold tabular-nums text-white">
                {mm}:{ss}
              </span>
              <span className="mt-1 text-[10px] text-jade-300">{selected} phút · linh khí tụ về</span>
            </div>
          </div>

          <div className="mt-6 h-6 text-sm text-muted-foreground">
            {selected <= 5
              ? "Hít vào... thở ra... đều đặn như sóng biển."
              : selected <= 10
                ? "Đừng nghĩ gì cả — để linh khí tự chảy."
                : "Sâu hơn nữa... nội tức viên mãn, đan điền ấm dần."}
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="py-2 text-center">
          <div className="animate-pop-glow mx-auto mb-2 text-4xl">✨</div>
          <p className="mb-1 text-sm font-semibold text-jade-300">
            Tâm hồn thanh tịnh, linh khí hấp thu +{result.energy} ⚡
          </p>
          <p className="text-xs text-muted-foreground">+{result.exp} EXP · Boss mất 2.000 HP</p>
          <button
            onClick={() => setPhase("idle")}
            className="mt-3 rounded-lg border border-jade-400/40 px-4 py-1.5 text-xs text-jade-300 transition hover:bg-jade-400/10"
          >
            Quay lại
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
