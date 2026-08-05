import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { CultivatorCard } from "@/components/dashboard/cultivator-card";
import { BossCard } from "@/components/dashboard/boss-card";
import { QuestsCard } from "@/components/dashboard/quests-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { CheckIn } from "@/components/dashboard/checkin";
import { getSession } from "@/lib/auth";
import {
  ACHIEVEMENTS,
  QUESTS,
  WEEKLY_BOSS,
  defaultState,
  realmAt,
  REALM_STAGES,
} from "@/lib/game";

export const metadata = { title: "Động Phủ" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const displayName = session.discord.global_name ?? session.discord.username;
  const state = defaultState(displayName);
  const realm = realmAt(state.level);
  const stage = REALM_STAGES[Math.min(3, Math.floor((state.level % 10) / 3))];

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              🏯 Động Phủ của <span className="text-jade-gradient">{displayName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hôm nay là ngày tu luyện thứ {state.streak} trong hành trình của bạn.
            </p>
          </div>
          <CheckIn
            name={displayName}
            streak={state.streak}
            checkedIn={state.checkedInToday}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <CultivatorCard
              name={displayName}
              realm={`${realm} · ${stage}`}
              level={state.level}
              exp={state.exp}
              expToNext={state.expToNext}
              streak={state.streak}
              bestStreak={state.bestStreak}
              energy={state.energy}
              avatarUrl={session.discord.avatar}
            />
            <BossCard boss={WEEKLY_BOSS} />
          </div>
          <div className="space-y-4">
            <QuestsCard quests={QUESTS} />
            <AchievementsCard achievements={ACHIEVEMENTS} />
          </div>
        </div>
      </main>
    </>
  );
}
