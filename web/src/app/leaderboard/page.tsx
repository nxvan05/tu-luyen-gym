import { SiteHeader } from "@/components/site-header";
import { Leaderboard } from "@/components/leaderboard";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/backend";
import type { LeaderboardData, LeaderboardRow } from "@/lib/game";

export const metadata = { title: "Bảng Xếp Hạng" };

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  const res = await api<LeaderboardData>("/api/leaderboard");
  const demo = !res.ok || !res.data;

  const empty: LeaderboardRow[] = [];
  const boards = res.data
    ? { exp: res.data.exp, streak: res.data.streak, boss: res.data.boss }
    : { exp: empty, streak: empty, boss: empty };

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            🏆 Bảng Xếp Hạng Tu Luyện
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thiên hạ tu luyện, đệ nhất là ai?
          </p>
          {demo && (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
              ⚠️ Backend chưa kết nối được ({res.error})
            </div>
          )}
        </div>
        <Leaderboard boards={boards} />
      </main>
    </>
  );
}
