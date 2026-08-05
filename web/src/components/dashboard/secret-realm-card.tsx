"use client";

import { useState } from "react";

import type { RealmData } from "@/lib/game";

interface Props {
  realm: RealmData | null;
  onStart?: () => void;
}

export function SecretRealmCard({ realm, onStart }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/realm/start", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Không vào được Bí Cảnh");
        return;
      }
      onStart?.();
    } catch {
      setError("Không kết nối được backend");
    } finally {
      setBusy(false);
    }
  }

  if (!realm) {
    return (
      <div className="card-glow rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/90 to-slate-900/60 p-5 backdrop-blur-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">🏯 Bí Cảnh 7 Ngày</h2>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">
            Thử thách
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Vượt 7 ải trong 7 ngày liên tục. Mỗi ngày chỉ cần <b>1 lần hoạt động</b> (tập, thiền hay
          đọc sách). Đủ 7 ngày nhận <b>+500 EXP</b> và Ma Thú mất thêm 50.000 HP.
        </p>
        <button
          onClick={() => void start()}
          disabled={busy}
          className="w-full rounded-xl border border-amber-400/50 bg-amber-400/10 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
        >
          {busy ? "Đang mở cổng..." : "⚔️ Bước Vào Long Huyệt Bí Cảnh"}
        </button>
        {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  const isActive = realm.status === "active";
  const isCompleted = realm.status === "completed";
  const pct = Math.round((realm.current_day / realm.days_total) * 100);

  return (
    <div className="card-glow rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/90 to-slate-900/60 p-5 backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">🏯 {realm.name}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            isCompleted
              ? "border border-jade-400/40 bg-jade-400/10 text-jade-300"
              : "border border-amber-400/40 bg-amber-400/10 text-amber-300"
          }`}
        >
          {isCompleted ? "✓ Đã phá trận" : `Ngày ${realm.current_day}/${realm.days_total}`}
        </span>
      </div>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {isActive && realm.stage && (
        <div>
          <p className="mb-1 text-sm font-semibold text-amber-300">
            Ải {realm.current_day}: {realm.stage}
          </p>
          <p className="text-xs italic text-muted-foreground">{realm.flavor}</p>
        </div>
      )}

      {isActive && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Hoạt động mỗi ngày để tiến sâu hơn — bỏ bê 7 ngày sẽ thất bại
        </p>
      )}

      {isCompleted && (
        <div className="mt-2 text-center">
          <div className="animate-pop-glow mx-auto mb-1 text-3xl">🐉</div>
          <p className="text-sm font-semibold text-jade-300">
            Bảo vật Long Huyệt đã thuộc về đệ tử!
          </p>
        </div>
      )}

      {realm.status === "failed" && (
        <p className="mt-2 text-center text-xs text-red-400">
          Đạo tâm lơi lỏng — thử thách thất bại. Hãy bước vào lần nữa!
        </p>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
