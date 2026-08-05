import Link from "next/link";

import { Button } from "@/components/ui/button";
import { avatarUrl } from "@/lib/types";
import type { Session } from "@/lib/auth";
import { LogOutButton } from "@/components/logout-button";

export function SiteHeader({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold">
          <span aria-hidden>🏯</span>
          <span>
            Tu Luyện <span className="text-jade-gradient">Gym</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Động Phủ
          </Link>
          <Link href="/dashboard#boss" className="transition-colors hover:text-foreground">
            Boss
          </Link>
          <Link href="/dashboard#rank" className="transition-colors hover:text-foreground">
            BXH
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href="/dashboard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(session.discord.avatar_url, 40)}
                  alt={session.discord.global_name ?? session.discord.username}
                  width={32}
                  height={32}
                  className="size-8 rounded-full ring-1 ring-primary/50"
                />
              </Link>
              <LogOutButton />
            </>
          ) : (
            <Button asChild size="sm">
              <a href="/api/auth/discord">Bắt đầu tu luyện</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
