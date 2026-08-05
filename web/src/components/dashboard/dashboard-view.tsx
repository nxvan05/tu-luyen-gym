"use client";

import { useEffect, useState } from "react";

import { fetchWithRetry } from "@/lib/fetch-retry";
import { CultivatorCard } from "@/components/dashboard/cultivator-card";
import { DaoTreeCard } from "@/components/dashboard/dao-tree-card";
import { BossCard } from "@/components/dashboard/boss-card";
import { QuestsCard } from "@/components/dashboard/quests-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { JournalCard } from "@/components/dashboard/journal-card";
import { KyNgo } from "@/components/dashboard/ky-ngo";
import { MeditationCard } from "@/components/dashboard/meditation-card";
import { ReadingCard } from "@/components/dashboard/reading-card";
import { SecretRealmCard } from "@/components/dashboard/secret-realm-card";
import { ArtifactsCard } from "@/components/dashboard/artifacts-card";
import { RealmScene } from "@/components/dashboard/realm-scene";
import { CheckIn } from "@/components/dashboard/checkin";
import { realmAt, realmStage, type DashboardData } from "@/lib/game";

const CACHE_KEY = "tlg_dashboard";

interface Props {
  displayName: string;
  avatarUrl: string | null;
}

export function DashboardView({ displayName, avatarUrl }: Props) {
  const [initData] = useState<DashboardData | null>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: DashboardData };
        if (parsed.data?.cultivator) return parsed.data;
      }
    } catch {
      /* bỏ qua cache hỏng */
    }
    return null;
  });
  const [live, setLive] = useState<DashboardData | null>(initData);
  const [error, setError] = useState<string | null>(null);

  async function refreshData() {
    const res = await fetchWithRetry("/api/dashboard");
    if (!res) {
      setError("Backend đang ngủ, hiển thị dữ liệu gần nhất.");
      return;
    }
    try {
      const data = (await res.json()) as DashboardData;
      setLive(data);
      setError(null);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
      } catch {
        /* localStorage có thể bị chặn */
      }
    } catch {
      setError("Backend chưa kết nối được, hiển thị dữ liệu gần nhất.");
    }
  }

  useEffect(() => {
    let stale = false;
    async function load() {
      const res = await fetchWithRetry("/api/dashboard");
      if (stale || !res) {
        if (!stale && !res) {
          setError("Backend đang ngủ, hiển thị dữ liệu gần nhất.");
        }
        return;
      }
      try {
        const data = (await res.json()) as DashboardData;
        if (stale) return;
        setLive(data);
        setError(null);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
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

  const cultivator = live?.cultivator ?? null;
  const boss = live?.boss ?? null;
  const quests = live?.quests ?? [];
  const achievements = live?.achievements ?? [];
  const journal = live?.journal ?? [];
  const paths = live?.paths ?? [];
  const secretRealm = live?.realm ?? null;
  const artifacts = live?.artifacts ?? [];

  const realm = cultivator
    ? `${realmAt(cultivator.level)} · ${realmStage(cultivator.level)}`
    : undefined;

  return (
    <div>
      <RealmScene
        streak={cultivator?.streak ?? 0}
        checkedInToday={cultivator?.checked_in_today ?? false}
        lastCheckinDate={cultivator?.last_checkin_date ?? null}
      />

      <div className="mb-6 mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            🏯 Động Phủ của{" "}
            <span className="text-jade-gradient">{displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cultivator
              ? `Hôm nay là ngày tu luyện thứ ${cultivator.streak} trong hành trình của bạn.`
              : error
                ? "Đang chờ kết nối lại với tu luyện giới..."
                : "Đang tải thông tin tu luyện..."}
          </p>
        </div>
        <CheckIn
          name={displayName}
          checkedIn={cultivator?.checked_in_today ?? false}
          onSuccess={() => {
            void refreshData();
          }}
        />
      </div>

      {error && live && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          ⚠️ {error} Dữ liệu dưới đây có thể chưa mới nhất.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CultivatorCard
            name={displayName}
            realm={realm ?? "Đang tải..."}
            level={cultivator?.level ?? 1}
            exp={cultivator?.exp ?? 0}
            expToNext={cultivator?.exp_to_next ?? 1000}
            streak={cultivator?.streak ?? 0}
            bestStreak={cultivator?.best_streak ?? 0}
            energy={cultivator?.energy ?? Math.min(100, 30 + (cultivator?.streak ?? 0) * 2)}
            freezeGems={cultivator?.freeze_gems ?? 0}
            avatarUrl={cultivator?.avatar_url ?? avatarUrl}
          />
          <DaoTreeCard paths={paths} />
          <section id="boss" className="scroll-mt-24">
            <BossCard
              boss={
                boss
                  ? {
                      name: boss.name,
                      hp: boss.hp,
                      maxHp: boss.max_hp,
                      weeklyDamage: boss.my_damage,
                      serverDamage: boss.server_damage ?? 0,
                      reward: 5000,
                      endsAt: boss.ends_at,
                    }
                  : {
                      name: "Chưa có Boss tuần",
                      hp: 0,
                      maxHp: 1,
                      weeklyDamage: 0,
                      reward: 5000,
                    }
              }
            />
          </section>
        </div>
        <div className="space-y-4">
          <SecretRealmCard realm={secretRealm} onStart={() => void refreshData()} />
          <MeditationCard onSuccess={() => void refreshData()} />
          <ReadingCard onSuccess={() => void refreshData()} />
          <ArtifactsCard artifacts={artifacts} />
          <KyNgo />
          <QuestsCard quests={quests} />
          <AchievementsCard achievements={achievements} />
        </div>
      </div>

      <div className="mt-4">
        <JournalCard entries={journal} />
      </div>
    </div>
  );
}
