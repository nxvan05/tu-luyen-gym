"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKOUT_TYPES, type CheckinResult } from "@/lib/game";

type Step = "pick" | "photo" | "verifying" | "done";

const CONFETTI = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const dist = 90 + (i % 5) * 34;
  const colors = [
    "oklch(0.82 0.14 85)",
    "oklch(0.7 0.11 170)",
    "oklch(0.75 0.16 25)",
    "oklch(0.72 0.14 300)",
  ];
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 20,
    r: (i % 2 ? 1 : -1) * (180 + i * 12),
    d: 1 + (i % 6) * 0.12,
    color: colors[i % colors.length],
  };
});

interface Props {
  name: string;
  checkedIn: boolean;
  onSuccess?: () => void;
}

export function CheckIn({ name, checkedIn, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openPanel() {
    setStep("pick");
    setWorkoutType(null);
    setPhoto(null);
    setError(null);
    setResult(null);
    setOpen(true);
  }

  async function startVerify() {
    setError(null);
    setStep("verifying");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workout_type: workoutType,
          photo: photo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Check-in thất bại");
      }
      setResult((await res.json()) as CheckinResult);
      setStep("done");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setStep("pick");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError("Ảnh quá lớn (tối đa 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.onerror = () => setError("Không đọc được ảnh");
    reader.readAsDataURL(file);
  }

  return (
    <>
      <Button
        size="lg"
        onClick={openPanel}
        disabled={checkedIn}
        className="animate-glow-pulse text-base font-semibold"
      >
        {checkedIn ? <Check className="mr-1.5" /> : "🧘"}
        {checkedIn ? "Đã bế quan hôm nay" : "Bế Quan Hôm Nay"}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold">🏯 Bế Quan Hôm Nay</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Đóng"
                >
                  <X className="size-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {step === "pick" && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Hôm nay ngươi luyện gì, {name}?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WORKOUT_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setWorkoutType(t.key);
                          setStep("photo");
                        }}
                        className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-muted/40 p-4 transition-all hover:border-primary/50 hover:bg-primary/10"
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "photo" && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Chụp ảnh phòng gym, đồng hồ hoặc máy chạy bộ. AI sẽ kiểm chứng.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={onFile}
                  />
                  {photo ? (
                    <div className="relative overflow-hidden rounded-2xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt="Ảnh check-in"
                        className="h-52 w-full object-cover"
                      />
                      <button
                        onClick={() => setPhoto(null)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur"
                        aria-label="Xóa ảnh"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      <Camera className="size-8" />
                      <span className="text-sm">Bấm để chụp / chọn ảnh</span>
                    </button>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => setStep("pick")}>
                      Quay lại
                    </Button>
                    <Button className="flex-1" disabled={!photo} onClick={startVerify}>
                      Xác nhận & Bế Quan
                    </Button>
                  </div>
                </div>
              )}

              {step === "verifying" && (
                <div className="flex flex-col items-center py-10">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <Loader2 className="relative size-12 animate-spin text-primary" />
                  </div>
                  <p className="mt-5 font-medium">AI đang kiểm chứng ảnh...</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Đối chiếu với hồ sơ tu luyện của ngươi
                  </p>
                </div>
              )}

              {step === "done" && result && (
                <div className="relative flex flex-col items-center py-6 text-center">
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                    {CONFETTI.map((c, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                        animate={{ opacity: 0, x: c.x, y: c.y, rotate: c.r, scale: 0.5 }}
                        transition={{ duration: c.d, ease: "easeOut" }}
                        className="absolute left-1/2 top-10 size-2 rounded-sm"
                        style={{ background: c.color }}
                      />
                    ))}
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-4xl"
                  >
                    ⚡
                  </motion.div>
                  <h3 className="mt-4 font-heading text-xl font-bold">
                    {result.leveled_up ? "Đột Phá Cảnh Giới!" : "Đột Phá Thành Công!"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">{name}</strong> đã đột phá!
                    <br />
                    🔥 Đạo Tâm {result.streak} ngày · +{result.exp_gained} EXP
                    <br />
                    🐉 Gây {result.damage.toLocaleString("vi-VN")} sát thương lên Boss
                  </p>
                  {result.new_achievements.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.new_achievements.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm text-accent"
                        >
                          {a.emoji} Thành tựu mới: {a.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.artifact && (
                    <div className="animate-pop-glow mt-3 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                      💎 Rơi Pháp Bảo: {result.artifact.emoji} <strong>{result.artifact.name}</strong>{" "}
                      · {result.artifact.rarity_name}
                    </div>
                  )}
                  {result.freeze_used && (
                    <div className="mt-3 rounded-xl border border-sky-500/50 bg-sky-500/10 px-4 py-2 text-sm text-sky-300">
                      🛡️ Ngọc Bảo Vệ Đạo Tâm đã kích hoạt — chuỗi không bị gãy!
                    </div>
                  )}
                  {result.boss_slain && (
                    <div className="mt-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                      🏅 <strong>Ma Thú đã bị hạ!</strong>
                      {result.boss_slain.rank
                        ? ` Đệ tử xếp hạng ${result.boss_slain.rank} nhận +${result.boss_slain.reward} EXP.`
                        : " Boss mới đang thức tỉnh..."}
                    </div>
                  )}
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
                    📣 Webhook sẽ thông báo chiến tích lên Discord (Tuần 4)
                  </div>
                  <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
                    Về Động Phủ
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
