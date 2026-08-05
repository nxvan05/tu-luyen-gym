"use client";

import { useEffect, useState } from "react";

import { Leaderboard } from "@/components/leaderboard";
import { fetchWithRetry } from "@/lib/fetch-retry";
import type { LeaderboardData } from "@/lib/game";

const CACHE_KEY = "tlg_leaderboard";

export function LeaderboardLive() {
  const [initData] = useState<LeaderboardData | null>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: LeaderboardData };
        if (parsed.data?.exp) return parsed.data;
      }
    } catch {
      /* bỏ qua cache hỏng */
    }
    return null;
  });
  const [boards, setBoards] = useState<LeaderboardData | null>(initData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    async function load() {
      const res = await fetchWithRetry("/api/leaderboard");
      if (stale) return;
      if (!res) {
        if (!initData) setError("Backend chưa kết nối được.");
        return;
      }
      try {
        const data = (await res.json()) as LeaderboardData;
        if (stale) return;
        setBoards(data);
        setError(null);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
        } catch {
          /* localStorage có thể bị chặn */
        }
      } catch {
        if (!stale && !initData) setError("Backend chưa kết nối được.");
      }
    }
    void load();
    return () => {
      stale = true;
    };
  }, [initData]);

  const empty = { exp: [], streak: [], boss: [], week: [] };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          ⚠️ {error} Đang hiển thị dữ liệu cũ.
        </div>
      )}
      <Leaderboard boards={boards ?? empty} />
    </div>
  );
}
