"use client";

import type { ArtifactData } from "@/lib/game";

const RARITY_STYLE: Record<string, { label: string; cls: string }> = {
  ha: { label: "Hạ Phẩm", cls: "border-slate-500/40 text-slate-300" },
  trung: { label: "Trung Phẩm", cls: "border-emerald-500/50 text-emerald-300" },
  thuong: { label: "Thượng Phẩm", cls: "border-sky-500/50 text-sky-300" },
  tuyet: { label: "Tuyệt Phẩm", cls: "border-pink-500/60 text-pink-300" },
};

export function ArtifactsCard({ artifacts }: { artifacts: ArtifactData[] }) {
  if (artifacts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
        <h2 className="mb-2 font-heading text-lg font-semibold">💎 Kho Pháp Bảo</h2>
        <p className="text-xs text-muted-foreground">
          Chưa có pháp bảo — mỗi lần bế quan có 15% linh khí ngưng tụ thành bảo vật.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">💎 Kho Pháp Bảo</h2>
        <span className="text-xs text-muted-foreground">{artifacts.length} món</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {artifacts.map((a) => {
          const style = RARITY_STYLE[a.rarity] ?? RARITY_STYLE.ha;
          return (
            <div
              key={a.id}
              title={a.effect}
              className={`animate-pop-glow flex flex-col items-center gap-1 rounded-xl border bg-slate-800/60 px-2 py-3 text-center ${style.cls}`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="line-clamp-2 text-[10px] font-semibold leading-tight">{a.name}</span>
              <span className="text-[9px] opacity-70">{style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
