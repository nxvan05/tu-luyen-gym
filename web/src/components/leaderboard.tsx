"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardRow } from "@/lib/game";

type TabKey = "exp" | "streak" | "boss" | "week";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "exp", label: "Top EXP", emoji: "⚡" },
  { key: "streak", label: "Top Đạo Tâm", emoji: "🔥" },
  { key: "boss", label: "Boss Damage", emoji: "🐉" },
  { key: "week", label: "Tuần Này", emoji: "🗓️" },
];

const MEDALS = ["🥇", "🥈", "🥉"];
const TITLES: Record<number, string> = {
  1: "Thiên Kiêu",
  2: "Chân Truyền",
  3: "Nội Môn",
};

function statOf(row: LeaderboardRow, tab: TabKey): string {
  if (tab === "exp") return `Lv ${row.level} · ${(row.exp ?? 0).toLocaleString("vi-VN")} EXP`;
  if (tab === "streak") return `${(row.best_streak ?? 0).toLocaleString("vi-VN")} ngày`;
  if (tab === "boss") return `${(row.damage ?? 0).toLocaleString("vi-VN")} sát thương`;
  return `${(row.exp ?? 0).toLocaleString("vi-VN")} EXP tuần`;
}

export function Leaderboard({ boards }: { boards: Record<TabKey, LeaderboardRow[]> }) {
  const [tab, setTab] = useState<TabKey>("exp");
  const rows = boards[tab] ?? [];

  return (
    <div>
      <div className="mx-auto flex max-w-md gap-1 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có ai trên bảng này — hãy là người đầu tiên tu luyện!
          </p>
        )}
        {rows.map((row) => (
          <motion.div
            key={`${tab}-${row.username}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(row.rank, 20) * 0.03 }}
            className={`card-glow flex items-center gap-3 rounded-2xl border p-3 ${
              row.rank <= 3
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card/60"
            }`}
          >
            <span className="w-8 text-center font-mono text-lg font-bold">
              {row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}
            </span>
            <Avatar className="size-9">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.name} />}
              <AvatarFallback className="text-xs">{row.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {row.name}
                {row.rank <= 3 && (
                  <span className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {TITLES[row.rank]}
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">@{row.username}</p>
            </div>
            <Badge variant={row.rank <= 3 ? "default" : "secondary"} className="shrink-0">
              {statOf(row, tab)}
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
