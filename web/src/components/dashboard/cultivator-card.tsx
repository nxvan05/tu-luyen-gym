import { Flame, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { avatarUrl } from "@/lib/types";

interface Props {
  name: string;
  realm: string;
  level: number;
  exp: number;
  expToNext: number;
  streak: number;
  bestStreak: number;
  energy: number;
  avatarUrl: string | null;
}

export function CultivatorCard({
  name,
  realm,
  level,
  exp,
  expToNext,
  streak,
  bestStreak,
  energy,
  avatarUrl: avatar,
}: Props) {
  const expPercent = Math.round((exp / expToNext) * 100);

  return (
    <Card className="card-glow overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-full bg-primary/30 blur-md animate-pop-glow" />
            <div className="relative flex size-16 items-center justify-center rounded-full border border-primary/40 bg-card text-2xl font-bold">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl(avatar, 64)}
                  alt={name}
                  className="size-full rounded-full"
                />
              ) : (
                "🧘"
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-[0_0_10px_oklch(0.82_0.14_85/60%)]">
              Lv {level}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{name}</h2>
              <Badge variant="secondary" className="text-accent">
                {realm}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="size-3.5 animate-pop-glow text-primary" />
                  EXP
                </span>
                <span className="font-mono">
                  {exp.toLocaleString("vi-VN")} / {expToNext.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="relative overflow-hidden rounded-full">
                <Progress value={expPercent} className="h-3" />
                <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="size-3.5 animate-pop-glow text-primary" /> Đạo Tâm
            </p>
            <p className="mt-1 font-mono text-lg font-bold">{streak} ngày</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kỷ lục</p>
            <p className="mt-1 font-mono text-lg font-bold">{bestStreak} ngày</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Linh Khí</p>
            <p className="mt-1 font-mono text-lg font-bold">
              {energy}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
