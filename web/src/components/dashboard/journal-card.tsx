import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JournalEntry } from "@/lib/game";

function formatDate(iso: string): string {
  const parts = iso.slice(0, 10).split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return iso.slice(0, 10);
}

export function JournalCard({ entries }: { entries: JournalEntry[] }) {
  return (
    <Card className="card-glow scroll-mt-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📖 Nhật Ký Tu Tiên</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nhật ký còn trắng — bế quan hôm nay để AI viết trang đầu tiên cho ngươi.
          </p>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {entries.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-border/70 bg-muted/30 p-3.5"
              >
                <p className="font-mono text-[11px] text-accent">
                  Ngày {formatDate(e.entry_date)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {e.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
