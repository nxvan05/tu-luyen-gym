import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { CultivatorCard } from "@/components/dashboard/cultivator-card";
import { BossCard } from "@/components/dashboard/boss-card";
import { QuestsCard } from "@/components/dashboard/quests-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { CheckIn } from "@/components/dashboard/checkin";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/backend";
import {
  realmAt,
  realmStage,
  type DashboardData,
  type QuestData,
  type AchievementData,
} from "@/lib/game";

export const metadata = { title: "Động Phủ" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const displayName = session.discord.global_name ?? session.discord.username;

  const res = await api<DashboardData>("/api/dashboard", { token: session.token });
  const live = res.ok && res.data ? res.data : null;

  const cultivator = live?.cultivator;
  const boss = live?.boss ?? null;
  const quests: QuestData[] = live?.quests ?? [];
  const achievements: AchievementData[] = live?.achievements ?? [];
  const demoMode = !live;

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {demoMode && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
            ⚠️ Đang ở chế độ demo — backend chưa kết nối được ({res.error}). Dữ liệu
            dưới đây là giả lập.
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              🏯 Động Phủ của{" "}
              <span className="text-jade-gradient">{displayName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cultivator
                ? `Hôm nay là ngày tu luyện thứ ${cultivator.streak} trong hành trình của bạn.`
                : "Đang tải thông tin tu luyện..."}
            </p>
          </div>
          <CheckIn
            name={displayName}
            checkedIn={cultivator?.checked_in_today ?? false}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CultivatorCard
              name={displayName}
              realm={
                cultivator
                  ? `${realmAt(cultivator.level)} · ${realmStage(cultivator.level)}`
                  : "Chưa biết"
              }
              level={cultivator?.level ?? 1}
              exp={cultivator?.exp ?? 0}
              expToNext={cultivator?.exp_to_next ?? 1000}
              streak={cultivator?.streak ?? 0}
              bestStreak={cultivator?.best_streak ?? 0}
              energy={Math.min(100, 30 + (cultivator?.streak ?? 0) * 2)}
              avatarUrl={cultivator?.avatar_url ?? session.discord.avatar_url}
            />
            <BossCard
              boss={
                boss
                  ? {
                      name: boss.name,
                      hp: boss.hp,
                      maxHp: boss.max_hp,
                      weeklyDamage: boss.my_damage,
                      reward: 5000,
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
          </div>
          <div className="space-y-4">
            <QuestsCard quests={quests} />
            <AchievementsCard achievements={achievements} />
          </div>
        </div>
      </main>
    </>
  );
}
