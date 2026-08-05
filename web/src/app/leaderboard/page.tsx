import { SiteHeader } from "@/components/site-header";
import { LeaderboardLive } from "@/components/leaderboard-live";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Bảng Xếp Hạng" };

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();

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
        </div>
        <LeaderboardLive />
      </main>
    </>
  );
}
