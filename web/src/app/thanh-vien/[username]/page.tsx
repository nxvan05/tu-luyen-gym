import { SiteHeader } from "@/components/site-header";
import { ProfileView } from "@/components/profile-view";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Động Phủ Tu Sĩ" };

export const dynamic = "force-dynamic";

export default async function ThanhVienPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getSession();
  const { username } = await params;

  return (
    <>
      <SiteHeader session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <ProfileView username={username} />
      </main>
    </>
  );
}
