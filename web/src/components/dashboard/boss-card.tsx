import { Swords } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BossView {
  name: string;
  hp: number;
  maxHp: number;
  weeklyDamage: number;
  reward: number;
}

export function BossCard({ boss }: { boss: BossView }) {
  const hpPercent = boss.maxHp > 0 ? Math.round((boss.hp / boss.maxHp) * 100) : 0;

  return (
    <Card id="boss" className="scroll-mt-24">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-2xl">
              🐉
            </span>
            <div>
              <h3 className="font-semibold">Boss tuần: {boss.name}</h3>
              <p className="text-xs text-muted-foreground">
                Thời gian còn lại: 4 ngày 6 giờ
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
            <Swords className="size-3.5" />
            Đang chiến
          </Badge>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Sinh lực</span>
            <span className="font-mono">{hpPercent}%</span>
          </div>
          <Progress value={hpPercent} className="h-3 [&>div]:bg-destructive" />
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-destructive/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Sát thương của bạn</p>
            <p className="mt-1 font-mono text-lg font-bold">
              {boss.weeklyDamage.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Thưởng khi hạ</p>
            <p className="mt-1 font-mono text-lg font-bold text-primary">
              +{boss.reward.toLocaleString("vi-VN")} EXP
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
