"use client";

import { useEffect, useState } from "react";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { fetchWithRetry } from "@/lib/fetch-retry";
import { BUILD_STAGES, realmAt, realmStage, type ProfileData } from "@/lib/game";
import { avatarUrl } from "@/lib/types";

export function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchWithRetry(`/api/profile/${encodeURIComponent(username)}`);
      if (cancelled) return;
      if (!res) {
        setError("Không liên lạc được sơn môn — thử lại sau.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as ProfileData & { error?: string };
      if (!res.ok || !data || typeof data.username !== "string") {
        setError(data?.error ?? "Tu sĩ này chưa từng xuất hiện ở đây.");
      } else {
        setProfile(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Đang vào Động Phủ...</p>;
  }

  if (error || !profile) {
    return (
      <div className="py-10 text-center">
        <p className="text-4xl">🕳️</p>
        <p className="mt-3 text-sm text-muted-foreground">{error ?? "Không tìm thấy."}</p>
        <Link href="/leaderboard" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          ← Về Bảng Tu Luyện
        </Link>
      </div>
    );
  }

  const stageEmoji =
    BUILD_STAGES.find((s) => s.name === profile.realm_stage)?.emoji ?? "🪨";
  const nextStage = BUILD_STAGES.find((s) => s.name === profile.realm_stage);

  return (
    <div className="space-y-4">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Bảng Tu Luyện
      </Link>

      <div className="card-glow rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl(profile.avatar_url, 96)}
            alt={profile.display_name ?? profile.username}
            className="size-16 rounded-full border-2 border-primary/40"
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
            <p className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-px text-xs font-bold text-primary">
              {realmAt(profile.level)} · {realmStage(profile.level)}
            </p>
          </div>
        </div>
      </div>

      <div className="card-glow flex items-center justify-center gap-4 rounded-2xl border bg-gradient-to-b from-primary/10 to-transparent p-6">
        <span className="text-6xl drop-shadow-[0_0_20px_oklch(0.82_0.14_85/50%)]">{stageEmoji}</span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Động Phủ hiện tại</p>
          <p className="text-2xl font-bold">{profile.realm_stage}</p>
          {nextStage && (
            <p className="text-xs text-muted-foreground">
              {profile.streak < 300 ? `Từ streak ${nextStage.at} trở lên` : "Tông Môn vô thượng"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-glow rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">🔥 {profile.streak}</p>
          <p className="text-xs text-muted-foreground">Chuỗi hiện tại</p>
        </div>
        <div className="card-glow rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">🏆 {profile.best_streak}</p>
          <p className="text-xs text-muted-foreground">Kỷ lục</p>
        </div>
        <div className="card-glow rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">🐉 {profile.boss_damage_total.toLocaleString("vi-VN")}</p>
          <p className="text-xs text-muted-foreground">Sát thương Ma Thú</p>
        </div>
        <div className="card-glow rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">💎 {profile.artifact_count}</p>
          <p className="text-xs text-muted-foreground">Pháp Bảo</p>
        </div>
      </div>

      {profile.artifacts.length > 0 && (
        <div className="card-glow rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">💎 Pháp Bảo</h2>
          <div className="flex flex-wrap gap-2">
            {profile.artifacts.map((a) => (
              <span
                key={a.id}
                className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm"
              >
                {a.emoji} {a.name}{" "}
                <span className="font-mono text-xs text-muted-foreground">{a.effect}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
