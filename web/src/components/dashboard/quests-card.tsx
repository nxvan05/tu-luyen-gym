import { Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WORKOUT_TYPES, type QuestData } from "@/lib/game";

export function QuestsCard({ quests }: { quests: QuestData[] }) {
  return (
    <Card className="card-glow scroll-mt-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📜 Nhiệm vụ hôm nay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {quests.map((q) => {
          const type = WORKOUT_TYPES.find((t) => t.key === q.workout_type);
          return (
            <div
              key={q.id}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3 transition-colors hover:border-primary/30 hover:bg-muted/70"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-base transition-transform ${
                  q.done ? "animate-pop-glow bg-accent/20" : "bg-background"
                }`}
              >
                {type?.emoji ?? "💪"}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${q.done ? "line-through opacity-50" : ""}`}>
                  {q.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  +{q.exp} EXP
                  {q.workout_type === "rest" && (
                    <Badge variant="outline" className="ml-2 border-accent/40 text-accent">
                      Phục hồi
                    </Badge>
                  )}
                </p>
              </div>
              {q.done && <Check className="size-4 shrink-0 text-accent" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
