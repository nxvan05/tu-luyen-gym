import { SiteHeader } from "@/components/site-header";
import { HistoryView } from "@/components/history-view";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Lịch Sử Tu Luyện" };

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">📜 Lịch Sử Tu Luyện</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi buổi bế quan, mỗi lần thiền định đều lưu lại dấu vết trên đạo lộ.
          </p>
        </div>
        <HistoryView />
      </main>
    </>
  );
}
