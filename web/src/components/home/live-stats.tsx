"use client";

import { useEffect, useState } from "react";

import { fetchWithRetry } from "@/lib/fetch-retry";
import type { BossHistoryItem, CultivatorPublic } from "@/lib/game";

export function LiveStats() {
  const [members, setMembers] = useState<number | null>(null);
  const [boss, setBoss] = useState<BossHistoryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [mRes, bRes] = await Promise.all([
        fetchWithRetry("/api/cultivators"),
        fetchWithRetry("/api/boss-history"),
      ]);
      if (cancelled) return;
      if (mRes?.ok) {
        const m = (await mRes.json()) as { members?: CultivatorPublic[] };
        if (Array.isArray(m.members)) setMembers(m.members.length);
      }
      if (bRes?.ok) {
        const b = (await bRes.json()) as { bosses?: BossHistoryItem[] };
        if (Array.isArray(b.bosses) && b.bosses.length > 0) setBoss(b.bosses[0]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (members === null && boss === null) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 pb-10 text-xs text-muted-foreground">
      {members !== null && (
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pop-glow rounded-full bg-emerald-400" />
          {members} tu sĩ đang tu luyện trong sơn môn
        </span>
      )}
      {boss && (
        <span className="flex items-center gap-1.5">
          ⚔️ Ma Thú mùa {boss.season}: <b className="text-foreground">{boss.name}</b>
          {boss.killed ? " — đã bị hạ 💀" : " — đang hoành hành"}
        </span>
      )}
    </div>
  );
}
