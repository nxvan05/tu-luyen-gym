"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DaoPath } from "@/lib/game";

function percentOf(path: DaoPath): number {
  const total = path.rest + path.exp_to_next;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((path.rest / total) * 100));
}

const TREE_STAGES = [
  { at: 0, emoji: "🌱", label: "Mầm Đạo" },
  { at: 5, emoji: "🌿", label: "Cây non" },
  { at: 15, emoji: "🌳", label: "Đại thụ" },
  { at: 30, emoji: "🌲", label: "Cổ thụ" },
  { at: 50, emoji: "🌸", label: "Cây Đạo nở hoa" },
];

function treeStage(total: number): { emoji: string; label: string; idx: number } {
  let stage = TREE_STAGES[0];
  let idx = 0;
  for (let i = 0; i < TREE_STAGES.length; i++) {
    if (total >= TREE_STAGES[i].at) {
      stage = TREE_STAGES[i];
      idx = i;
    }
  }
  return { emoji: stage.emoji, label: stage.label, idx };
}

export function DaoTreeCard({ paths }: { paths: DaoPath[] }) {
  const total = paths.reduce((sum, p) => sum + p.level, 0);
  const stage = treeStage(total);
  const leafCount = stage.idx >= 3 ? 6 : stage.idx >= 2 ? 3 : 0;

  return (
    <Card className="card-glow scroll-mt-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          🌳 Cây Đạo{" "}
          <span className="ml-1 rounded-full bg-primary/15 px-2 py-px font-mono text-[11px] font-bold text-primary">
            {stage.emoji} {stage.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/10 to-transparent">
          <motion.div
            key={stage.emoji}
            className="text-6xl drop-shadow-[0_0_18px_oklch(0.82_0.14_85/45%)]"
            initial={{ scale: 0.4, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            style={{ display: "inline-block", transformOrigin: "50% 100%" }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              {stage.emoji}
            </motion.span>
          </motion.div>
          {Array.from({ length: leafCount }).map((_, i) => (
            <span
              key={i}
              className="animate-leaf pointer-events-none absolute top-1/2 text-lg"
              style={{ left: `${12 + i * 15}%`, "--drift": `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 3) * 8)}px`, animationDelay: `${i * 1.7}s` } as React.CSSProperties}
            >
              🍃
            </span>
          ))}
        </div>

        {paths.map((path, i) => {
          const pct = percentOf(path);
          const branch = path.level >= 10 ? "🌳" : path.level >= 5 ? "🌿" : "🌱";
          return (
            <div key={path.code} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-xl shadow-[0_0_12px_oklch(0.82_0.14_85/20%)]">
                {path.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    {path.name}
                    <span className="rounded-full bg-primary/15 px-1.5 py-px font-mono text-[10px] font-bold text-primary">
                      Lv {path.level}
                    </span>
                    <span className="text-[10px]">{branch}</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {path.rest.toLocaleString("vi-VN")} / {path.exp_to_next.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {total >= 50
            ? "Cây Đạo ngươi đã nở hoa — đạo tâm viên mãn, muôn kiếp không phai."
            : total >= 30
              ? "Cổ thụ chống trời, rễ ăn sâu đến tận bát hoang."
              : total >= 15
                ? "Đại thụ đã thành, mỗi nhánh là một con đường khổ luyện."
                : total >= 5
                  ? "Cây non vươn mình theo từng nhịp tu luyện."
                  : "Mỗi loại tu luyện nuôi dưỡng một nhánh riêng — Cây Đạo của ngươi, con đường của ngươi."}
        </p>
      </CardContent>
    </Card>
  );
}
