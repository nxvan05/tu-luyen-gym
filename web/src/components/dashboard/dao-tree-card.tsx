"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DaoPath } from "@/lib/game";

function percentOf(path: DaoPath): number {
  const total = path.rest + path.exp_to_next;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((path.rest / total) * 100));
}

export function DaoTreeCard({ paths }: { paths: DaoPath[] }) {
  return (
    <Card className="card-glow scroll-mt-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">🌳 Cây Đạo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paths.map((path, i) => {
          const pct = percentOf(path);
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
          Mỗi loại tu luyện nuôi dưỡng một nhánh riêng — Cây Đạo của ngươi, con
          đường của ngươi.
        </p>
      </CardContent>
    </Card>
  );
}
