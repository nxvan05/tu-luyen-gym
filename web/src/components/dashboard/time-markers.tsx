"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { WeekDay } from "@/lib/game";

function nextUtcMidnight(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

function fmtHms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  streak: number;
  checkedInToday: boolean;
  weekDays: WeekDay[];
}

export function TimeMarkers({ streak, checkedInToday, weekDays }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = nextUtcMidnight() - now;
  const urgent = streak > 0 && !checkedInToday && remaining < 2 * 3_600_000;

  return (
    <Card className="card-glow">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">⏳ Thời khắc</p>
          {checkedInToday ? (
            <p className="mt-0.5 text-sm font-medium text-emerald-500">
              ✓ Đã bế quan — chuỗi {streak} ngày an toàn
            </p>
          ) : streak > 0 ? (
            <p className={`mt-0.5 font-mono text-sm font-bold ${urgent ? "animate-pulse text-destructive" : "text-foreground"}`}>
              {urgent ? "⚠️ " : ""}Còn {fmtHms(remaining)} để bảo toàn chuỗi {streak} ngày
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Chưa có chuỗi — bế quan hôm nay để thắp Lửa Đạo Tâm!
            </p>
          )}
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Nhiệm vụ mới sau {fmtHms(remaining)}
          </p>
        </div>

        <div className="flex gap-1.5">
          {weekDays.map((d) => {
            const isToday = d.label === "Hôm nay";
            return (
              <div
                key={d.date}
                className={`flex h-11 w-9 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] ${
                  isToday
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : d.count > 0
                      ? "border-border bg-card text-foreground"
                      : "border-border/50 bg-muted/40 text-muted-foreground/50"
                }`}
              >
                <span className="font-semibold">{isToday ? "Nay" : d.label}</span>
                <span className="text-xs leading-none">{d.count > 0 ? d.emojis[0] : "·"}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
