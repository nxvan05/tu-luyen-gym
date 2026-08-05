import { Swords } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BossView {
  name: string;
  hp: number;
  maxHp: number;
  weeklyDamage: number;
  serverDamage?: number;
  reward: number;
  endsAt?: string | null;
  killed?: boolean;
  killer?: string | null;
}

const LORE: Record<string, string> = {
  "Ma Thú Thái Cổ Hùng": "Cự thú phá động mạch cổ sơn, giận dữ nuốt linh khí bốn phương.",
  "Cửu U Ma Long": "Rồng ma chín u địa phủ, mỗi hơi thở là một trận âm phong.",
  "Huyền Vũ": "Xà quy cổ thần giữ bí cảnh, giáp vảy rung lên như sấm dội.",
  "Thao Thiết": "Ác thú tham ăn chưa bao giờ no, nuốt cả trận pháp của tiên môn.",
  "Bạch Hổ Tinh Quân": "Hổ trắng tu luyện ngàn năm, kim khí sắc như lưỡi đao trời.",
  "Chu Tước Thánh Thú": "Phượng lửa đỏ rực trời nam, một cánh vỗ là một cơn hỏa tai.",
  "Thanh Long": "Long xanh chấn giữ phương đông, mưa theo rồng bay, sấm theo rồng gầm.",
  "Cửu Vĩ Hồ Yêu": "Hồ ly chín đuôi mê hoặc lòng người, cười một tiếng là đạo tâm rung động.",
};

const MOODS = [
  { min: 50, emoji: "😐", label: "Bình Tĩnh" },
  { min: 20, emoji: "😠", label: "Đang Nổi Giận" },
  { min: 0, emoji: "💀", label: "Sắp Bị Hạ" },
];

function timeLeft(endsAt?: string | null): string {
  if (!endsAt) return "4 ngày 6 giờ";
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return "4 ngày 6 giờ";
  const diff = end - Date.now();
  if (diff <= 0) return "Đã kết thúc — Boss mới đang đến";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return `Còn ${days} ngày ${hours} giờ`;
}

export function BossCard({ boss }: { boss: BossView }) {
  const hpPercent = boss.maxHp > 0 ? Math.round((boss.hp / boss.maxHp) * 100) : 0;
  const mood = MOODS.find((m) => hpPercent >= m.min) ?? MOODS[2];
  const serverPercent = boss.maxHp > 0 ? Math.round(((boss.serverDamage ?? 0) / boss.maxHp) * 100) : 0;
  const season = 1;
  const level = 50 + (season - 1) * 12;
  const lore = LORE[boss.name] ?? "Ma thú từ tà khí ngưng tụ, đang gieo rắc tai ương lên tiên giới.";
  const angry = hpPercent < 50;

  return (
    <Card className={`card-glow scroll-mt-24 ${angry ? "animate-breath" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`animate-breath flex size-11 items-center justify-center rounded-xl text-2xl ${
                angry
                  ? "bg-destructive/20 shadow-[0_0_24px_oklch(0.7_0.19_22/60%)]"
                  : "bg-destructive/15 shadow-[0_0_18px_oklch(0.7_0.19_22/40%)]"
              }`}
            >
              🐉
            </span>
            <div>
              <h3 className="font-semibold">
                {boss.name} · Lv {level}
              </h3>
              <p className="text-xs text-muted-foreground">{timeLeft(boss.endsAt)}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`gap-1 ${
              boss.killed
                ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                : "border-destructive/40 text-destructive"
            } ${!boss.killed && angry ? "animate-pulse" : ""}`}
          >
            <Swords className="size-3.5" />
            {boss.killed ? `💀 Đã Bị Hạ${boss.killer ? ` · ${boss.killer}` : ""}` : `${mood.emoji} ${mood.label}`}
          </Badge>
        </div>

        <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground">
          {boss.killed
            ? `Ma thú đã gục ngã, tu sĩ toàn môn hưởng khí vận — tàn hồn sẽ tụ lại thành kẻ thù mới vào tuần sau.`
            : lore}
        </p>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Sinh lực Ma Thú</span>
            <span className="font-mono">{hpPercent}%</span>
          </div>
          <div className="relative overflow-hidden rounded-full">
            <Progress value={hpPercent} className="h-3 [&>div]:bg-destructive" />
            <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Bạn gây</p>
            <p className="mt-1 font-mono text-base font-bold">
              {boss.weeklyDamage.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Cả tông môn</p>
            <p className="mt-1 font-mono text-base font-bold text-primary">
              {(boss.serverDamage ?? 0).toLocaleString("vi-VN")}
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-[width] duration-700"
                style={{ width: `${Math.min(100, serverPercent)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Thưởng khi hạ</p>
            <p className="mt-1 font-mono text-base font-bold text-primary">
              +{boss.reward.toLocaleString("vi-VN")} EXP
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
