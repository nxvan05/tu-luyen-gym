import { SiteHeader } from "@/components/site-header";
import { BossView } from "@/components/boss-view";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Boss Tuần" };

export const dynamic = "force-dynamic";

export default async function BossPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            🐉 Boss Tuần
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cả tông môn góp sát thương. Hạ Boss nhận thưởng chung!
          </p>
        </div>
        <BossView />
      </main>
    </>
  );
}
