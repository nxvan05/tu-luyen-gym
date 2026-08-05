import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { HowItWorks } from "@/components/home/how-it-works";
import { getSession } from "@/lib/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const { error } = await searchParams;

  const errorText =
    error === "access_denied"
      ? "Bạn đã hủy đăng nhập Discord."
      : error === "state_mismatch"
        ? "Phiên đăng nhập không hợp lệ, thử lại."
        : error === "auth_failed"
          ? "Đăng nhập thất bại, thử lại."
          : error
            ? `Lỗi đăng nhập: ${error} — thử lại.`
            : null;

  return (
    <>
      <SiteHeader session={session} />
      {errorText && (
        <div className="mx-auto mt-6 max-w-6xl px-4">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorText}
          </div>
        </div>
      )}
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        <p>
          🏯 Tu Luyện Gym — Duolingo dành cho Gym · Bản scaffold Tuần 1
        </p>
      </footer>
    </>
  );
}
