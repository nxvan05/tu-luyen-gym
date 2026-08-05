"use client";

import { motion } from "framer-motion";
import { Camera, Flame, Medal, Puzzle, Swords, Trophy } from "lucide-react";

const FEATURES = [
  {
    emoji: "⚡",
    icon: Camera,
    title: "Check-in 10 giây",
    desc: "Chọn buổi tập, chụp ảnh, AI xác nhận. Xong — không form dài lê thê.",
  },
  {
    emoji: "🔥",
    icon: Flame,
    title: "Chuỗi tu luyện",
    desc: "Không bẻ gãy chuỗi ngày. Chuỗi càng dài, EXP càng cao.",
  },
  {
    emoji: "🐉",
    icon: Swords,
    title: "Boss tuần",
    desc: "Cả cộng đồng góp sát thương. Hạ Boss nhận thưởng chung.",
  },
  {
    emoji: "📜",
    icon: Puzzle,
    title: "Nhiệm vụ hằng ngày",
    desc: "Push, Pull, Legs, Cardio, Rest — một mục tiêu rõ ràng mỗi ngày.",
  },
  {
    emoji: "🏆",
    icon: Trophy,
    title: "Bảng xếp hạng",
    desc: "Top EXP, Top chuỗi, Top sát thương Boss. Cạnh tranh lành mạnh.",
  },
  {
    emoji: "🐾",
    icon: Medal,
    title: "Thú cưng + Thành tựu",
    desc: "Nuôi linh thú bằng EXP, mở khóa huy chương trên hành trình.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="text-center font-heading text-3xl font-bold sm:text-4xl"
      >
        Không phải app quản lý tập gym.
        <br />
        <span className="text-jade-gradient">Là một trò chơi có check-in.</span>
      </motion.h2>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
            className="rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-xl">
                {f.emoji}
              </span>
              <h3 className="font-semibold">{f.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
