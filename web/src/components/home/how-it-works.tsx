"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    emoji: "🔗",
    title: "Đăng nhập Discord",
    desc: "Bạn bè, server và cộng đồng sẵn có — chỉ cần một cú bấm.",
  },
  {
    n: "02",
    emoji: "📸",
    title: "Check-in buổi tập",
    desc: "Mở web, chọn Push/Pull/Legs/Cardio, upload ảnh. AI xác nhận ngay.",
  },
  {
    n: "03",
    emoji: "⚡",
    title: "Đột phá & khoe thành tích",
    desc: "+EXP, chuỗi nối dài. Discord tự động thông báo chiến tích của bạn.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center font-heading text-3xl font-bold sm:text-4xl"
        >
          Bắt đầu trong <span className="text-jade-gradient">3 bước</span>
        </motion.h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative rounded-2xl border border-border bg-background p-6"
            >
              <span className="font-mono text-xs text-primary/70">Bước {s.n}</span>
              <div className="mt-3 text-4xl">{s.emoji}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-muted-foreground/40 md:block">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
