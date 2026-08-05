import { SiteHeader } from "@/components/site-header";
import { SuMonView } from "@/components/su-mon-view";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Sư Môn" };

export const dynamic = "force-dynamic";

export default async function SuMonPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">⛩️ Sư Môn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toàn bộ đạo hữu trong tu luyện giới — ghé thăm Động Phủ của nhau để tìm cảm hứng.
          </p>
        </div>
        <SuMonView />
      </main>
    </>
  );
}
