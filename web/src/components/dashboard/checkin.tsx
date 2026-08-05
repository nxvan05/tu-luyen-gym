"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKOUT_TYPES } from "@/lib/game";

type Step = "pick" | "photo" | "verifying" | "done";

interface Props {
  name: string;
  streak: number;
  checkedIn: boolean;
}

export function CheckIn({ name, streak, checkedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [photo, setPhoto] = useState<string | null>(null);
  const [exp, setExp] = useState(120);
  const fileRef = useRef<HTMLInputElement>(null);

  function openPanel() {
    setStep("pick");
    setPhoto(null);
    setOpen(true);
  }

  function startVerify() {
    setStep("verifying");
    setTimeout(() => setStep("done"), 1800);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
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
                          setExp(
                            t.key === "cardio" ? 90 : t.key === "rest" ? 40 : 120
                          );
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
                      <img src={photo} alt="Ảnh check-in" className="h-52 w-full object-cover" />
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

              {step === "done" && (
                <div className="flex flex-col items-center py-6 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-4xl"
                  >
                    ⚡
                  </motion.div>
                  <h3 className="mt-4 font-heading text-xl font-bold">
                    Đột Phá Thành Công!
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">{name}</strong> đã đột phá!
                    <br />
                    🔥 Chuỗi {streak + 1} ngày · +{exp} EXP
                  </p>
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
                    📣 Webhook sẽ thông báo chiến tích lên Discord
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
