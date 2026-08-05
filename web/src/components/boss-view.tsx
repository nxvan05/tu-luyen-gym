"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { BossCard } from "@/components/dashboard/boss-card";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  BossActivityData,
  BossActivityItem,
  BossData,
  BossHistoryData,
  LeaderboardData,
  LeaderboardRow,
} from "@/lib/game";

const CACHE_KEY = "tlg_boss";

function timeAgo(at?: string | null): string {
  if (!at) return "";
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  return `${Math.floor(min / 60)} giờ trước`;
}

export function BossView() {
  const [boss, setBoss] = useState<BossData | null>(null);
  const [top, setTop] = useState<LeaderboardRow[]>([]);
  const [history, setHistory] = useState<BossHistoryData["bosses"]>([]);
  const [activity, setActivity] = useState<BossActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    async function load() {
      const [dashRes, lbRes, histRes] = await Promise.all([
        fetchWithRetry("/api/dashboard"),
        fetchWithRetry("/api/leaderboard"),
        fetchWithRetry("/api/boss-history"),
      ]);
      if (stale) return;
      if (!lbRes) {
        setError("Backend chưa kết nối được, hiển thị dữ liệu gần nhất.");
        return;
      }
      try {
        const dash = dashRes ? ((await dashRes.json()) as { boss: BossData | null }) : null;
        const lb = (await lbRes.json()) as LeaderboardData;
        const hist = histRes
          ? ((await histRes.json()) as BossHistoryData)
          : { bosses: [] };
        if (stale) return;
        setBoss(dash?.boss ?? null);
        setTop(lb.boss);
        setHistory(hist.bosses);
        setError(null);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), dash, lb }));
        } catch {
          /* localStorage có thể bị chặn */
        }
      } catch {
        if (!stale) {
          setError("Backend chưa kết nối được, hiển thị dữ liệu gần nhất.");
        }
      }
    }
    void load();
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    let stale = false;
    async function poll() {
      const res = await fetchWithRetry("/api/boss/activity", 3, 4000);
      if (stale || !res) return;
      const data = (await res.json()) as BossActivityData;
      if (stale) return;
      setActivity(data.activity ?? []);
    }
    void poll();
    const timer = setInterval(() => void poll(), 30_000);
    return () => {
      stale = true;
      clearInterval(timer);
    };
  }, []);

  const bossView = boss
    ? {
        name: boss.name,
        hp: boss.hp,
        maxHp: boss.max_hp,
        weeklyDamage: boss.my_damage,
        serverDamage: boss.server_damage ?? 0,
        reward: 5000,
        endsAt: boss.ends_at,
        killed: boss.killed,
        killer: boss.killer,
        season: boss.season ?? 1,
      }
    : {
        name: "Chưa có Boss tuần",
        hp: 0,
        maxHp: 1,
        weeklyDamage: 0,
        serverDamage: 0,
        reward: 5000,
      };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          ⚠️ {error}
        </div>
      )}
      <BossCard boss={bossView} />

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold">
          ⚡ Chiến Trường{" "}
          <span className="align-middle text-xs font-normal text-muted-foreground">
            (cập nhật mỗi 30 giây)
          </span>
        </h2>
        <div className="space-y-2">
          {activity.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chiến trường đang im ắng — Ma Thú đang chờ đòn đánh đầu tiên.
            </p>
          )}
          {activity.map((a, i) => (
            <motion.div
              key={`${a.name}-${a.at}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5"
            >
              <Avatar className="size-8">
                {a.avatar_url && <AvatarImage src={a.avatar_url} alt={a.name} />}
                <AvatarFallback className="text-[10px]">{a.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm">
                <b>{a.name}</b>{" "}
                <span className="text-muted-foreground">chém một đòn cực mạnh</span>
              </p>
              <span className="shrink-0 font-mono text-sm font-bold text-destructive">
                -{(a.damage / 1000).toLocaleString("vi-VN")}K HP
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(a.at)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold">
          ⚔️ Top Sát Thương Tuần
        </h2>
        <div className="space-y-2">
          {top.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa ai gây sát thương — hãy là người đầu tiên bế quan!
            </p>
          )}
          {top.map((row) => (
            <div
              key={row.username}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3"
            >
              <span className="w-8 text-center font-mono text-lg font-bold">
                {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
              </span>
              <Avatar className="size-9">
                {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.name} />}
                <AvatarFallback className="text-xs">
                  {row.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                {row.name}
              </p>
              <span className="shrink-0 text-sm font-bold text-primary">
                {(row.damage ?? 0).toLocaleString("vi-VN")} ⚔️
              </span>
            </div>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-bold">🗡️ Sử Kiện Ma Thú</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.season}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3"
              >
                <span className="text-2xl">{h.killed ? "💀" : "🐉"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    Mùa {h.season}: {h.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.killed
                      ? `${(h.max_hp / 1_000_000).toLocaleString("vi-VN")}M HP · đã bị hạ`
                      : "Chưa ai hạ được"}
                  </p>
                </div>
                {h.killer ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      {h.killer.avatar_url && (
                        <AvatarImage src={h.killer.avatar_url} alt={h.killer.name} />
                      )}
                      <AvatarFallback className="text-xs">
                        {h.killer.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{h.killer.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(h.killer.damage / 1_000_000).toLocaleString("vi-VN")}M ⚔️
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">⏳</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
