import { Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AchievementData } from "@/lib/game";

export function AchievementsCard({
  achievements,
}: {
  achievements: AchievementData[];
}) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="card-glow scroll-mt-24">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>🏅 Thành tựu</span>
          <span className="font-mono text-sm text-muted-foreground">
            {unlockedCount}/{achievements.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.title}
            className={`flex size-12 items-center justify-center rounded-xl border text-xl transition-all ${
              a.unlocked
                ? "animate-pop-glow border-primary/40 bg-primary/10 shadow-[0_0_14px_oklch(0.82_0.14_85/25%)] hover:scale-110 hover:-rotate-6"
                : "border-border bg-muted/40 opacity-50 grayscale hover:opacity-70"
            }`}
          >
            {a.unlocked ? a.emoji : <Lock className="size-4 text-muted-foreground" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
