"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { fetchWithRetry } from "@/lib/fetch-retry";
import type { HistoryData } from "@/lib/game";

export function HistoryView() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    let stale = false;
    void (async () => {
      const res = await fetchWithRetry("/api/history");
      if (stale || !res) {
        if (!stale) setError("Backend đang ngủ, thử lại sau.");
        return;
      }
      try {
        const data = (await res.json()) as HistoryData;
        if (!stale) {
          setData(data);
          setError(null);
        }
      } catch {
        if (!stale) setError("Không tải được lịch sử.");
      }
    })();
    return () => {
      stale = true;
    };
  }, []);

  async function askSummary() {
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch("/api/weekly-summary", { method: "POST" });
      const body = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok || body.error) {
        setError(body.error ?? "Không tổng kết được");
        return;
      }
      setSummary(body.summary ?? "");
    } catch {
      setError("Không kết nối được backend");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          ⚠️ {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card-glow rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">📜 Chiến Tích</h2>
              <span className="text-xs text-muted-foreground">
                7 ngày: +{data?.total_exp_week ?? 0} EXP
              </span>
            </div>
            {data && data.activities.length > 0 ? (
              <ul className="space-y-2">
                {data.activities.map((a, i) => (
                  <li
                    key={`${a.date}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2"
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.label}</p>
                      <p className="text-[10px] text-muted-foreground">{a.date}</p>
                    </div>
                    <span className="text-xs font-semibold text-jade-300">{a.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có chiến tích nào — bắt đầu bế quan hôm nay nhé!
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card-glow rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
            <h2 className="mb-3 font-heading text-lg font-semibold">🗓️ Tuần Tu Luyện</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {data?.week.map((d) => (
                <div
                  key={d.date}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center ${
                    d.count > 0
                      ? "border-jade-400/50 bg-jade-400/10"
                      : "border-slate-700/50 bg-slate-800/40 opacity-60"
                  }`}
                  title={d.date}
                >
                  <span className="text-[9px] text-muted-foreground">{d.label}</span>
                  <span className="text-sm">{d.emojis[0] ?? "·"}</span>
                  <span className="text-[9px] text-muted-foreground">{d.count} buổi</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card-glow rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
            <h2 className="mb-2 font-heading text-lg font-semibold">🧙 Sư Phụ Tổng Kết</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Bấm để sư phụ dùng linh giác nhìn lại một tuần của đệ tử.
            </p>
            <button
              onClick={() => void askSummary()}
              disabled={summarizing || (data?.activities.length ?? 0) === 0}
              className="w-full rounded-xl border border-jade-400/40 bg-jade-400/10 py-2 text-sm font-semibold text-jade-300 transition hover:bg-jade-400/20 disabled:opacity-50"
            >
              {summarizing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Sư phụ đang chiêm nghiệm...
                </span>
              ) : (
                "🔮 Tổng Kết Tuần Này"
              )}
            </button>
            {summary && (
              <div className="animate-pop-glow mt-3 rounded-xl border border-jade-400/30 bg-jade-400/5 p-3 text-sm italic leading-relaxed">
                {summary}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
