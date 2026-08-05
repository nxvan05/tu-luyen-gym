import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Động Phủ" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const displayName = session.discord.global_name ?? session.discord.username;

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <DashboardView
          displayName={displayName}
          avatarUrl={session.discord.avatar_url}
        />
      </main>
    </>
  );
}
