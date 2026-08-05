"use client";

import { useEffect, useMemo, useState } from "react";

import { Search } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { BUILD_STAGES, realmAt, realmStage, type CultivatorPublic } from "@/lib/game";
import { avatarUrl } from "@/lib/types";

export function SuMonView() {
  const [members, setMembers] = useState<CultivatorPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetchWithRetry("/api/cultivators");
      if (cancelled) return;
      if (!res) {
        setError("Không liên lạc được sơn môn — thử lại sau.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { members?: CultivatorPublic[]; error?: string };
      if (!res.ok || !Array.isArray(data.members)) {
        setError(data?.error ?? "Sơn môn chưa có tu sĩ nào.");
      } else {
        setMembers(data.members);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.display_name ?? "").toLowerCase().includes(q)
    );
  }, [members, query]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Đang triệu tập chư vị...</p>;
  }

  if (error) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{error}</p>
    );
  }

  return (
    <div>
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm đạo hữu..."
          className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Không tìm thấy đạo hữu nào.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Link
            key={m.username}
            href={`/thanh-vien/${encodeURIComponent(m.username)}`}
            className="card-glow rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {m.avatar_url && (
                  <AvatarImage src={avatarUrl(m.avatar_url, 64)} alt={m.display_name ?? m.username} />
                )}
                <AvatarFallback className="text-xs">
                  {(m.display_name ?? m.username).slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {m.display_name ?? m.username}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    Lv {m.level}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {realmAt(m.level)} · {realmStage(m.level)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                {BUILD_STAGES.find((s) => s.name === m.realm_stage)?.emoji ?? "🪨"} {m.realm_stage}
              </Badge>
              <Badge variant="outline" className="gap-1">
                🔥 {m.streak}
              </Badge>
              <Badge variant="outline" className="gap-1">
                🏆 {m.best_streak}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
