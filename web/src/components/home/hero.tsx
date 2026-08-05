"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/count-up";
import { LiveStats } from "@/components/home/live-stats";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const FLOATERS = [
  { left: "-4%", top: "18%", emoji: "✨", delay: 0 },
  { left: "102%", top: "10%", emoji: "⚡", delay: 1.2 },
  { left: "104%", top: "52%", emoji: "🌿", delay: 0.6 },
  { left: "-6%", top: "64%", emoji: "🔥", delay: 1.8 },
];

const STATS = [
  { value: 500, suffix: "+", label: "đệ tử tu luyện" },
  { value: 10000, suffix: "+", label: "buổi bế quan" },
  { value: 98, suffix: "%", label: "giữ chuỗi hằng ngày" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-24 lg:grid-cols-2 lg:pt-24">
        <div>
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="show"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5 animate-pop-glow" />
              Duolingo dành cho Gym · lấy cảm hứng tu tiên
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="mt-6 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            Mỗi buổi tập là{" "}
            <span className="text-jade-gradient animate-gradient-x drop-shadow-[0_0_24px_oklch(0.7_0.11_170/45%)]">
              một bước tu luyện
            </span>
            .
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-md text-lg text-muted-foreground"
          >
            Bạn không đi tập — bạn tiếp tục hành trình. Check-in dưới 10 giây,
            tích EXP, phá cảnh, khiêu chiến Boss tuần cùng cộng đồng.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="animate-glow-pulse">
              <a href="/api/auth/discord">Bắt đầu tu luyện</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">Cách hoạt động</a>
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={4}
            initial="hidden"
            animate="show"
            className="mt-4 text-xs text-muted-foreground"
          >
            Đăng nhập bằng Discord · Miễn phí · Không cần tải app
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={5}
            initial="hidden"
            animate="show"
            className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border/60 pt-6"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-2xl font-bold text-jade-gradient">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl animate-pop-glow" />
          <div className="card-glow relative rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            {FLOATERS.map((f) => (
              <motion.span
                key={f.emoji}
                className="pointer-events-none absolute text-2xl"
                style={{ left: f.left, top: f.top }}
                animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4], rotate: [0, 12, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
              >
                {f.emoji}
              </motion.span>
            ))}

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">🏯 Động Phủ của bạn</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                Luyện Khí kỳ
              </span>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="relative">
                <div
                  className="animate-orbit absolute -inset-5 rounded-full border border-dashed border-primary/25"
                  style={{ boxShadow: "0 0 24px oklch(0.82 0.14 85 / 12%)" }}
                />
                <div className="animate-orbit-reverse absolute -inset-10 rounded-full border border-accent/20" />
                <div className="animate-breath relative rounded-full bg-gradient-to-b from-primary/35 to-transparent p-8">
                  <div className="flex size-24 items-center justify-center rounded-full bg-card text-6xl shadow-inner ring-1 ring-primary/30">
                    🧘
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="size-3.5 animate-pop-glow text-primary" /> Linh Khí
                  </span>
                  <span>62%</span>
                </div>
                <div className="relative overflow-hidden rounded-full">
                  <Progress value={62} className="h-2" />
                  <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>🐉 Boss tuần: Ma Thú Thái Cổ Hùng</span>
                  <span>72%</span>
                </div>
                <div className="relative overflow-hidden rounded-full">
                  <Progress value={72} className="h-2 [&>div]:bg-destructive" />
                  <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-sm font-semibold text-primary animate-pop-glow">
              Bế Quan Hôm Nay
            </div>
          </div>
        </motion.div>
      </div>

      <LiveStats />
    </section>
  );
}
