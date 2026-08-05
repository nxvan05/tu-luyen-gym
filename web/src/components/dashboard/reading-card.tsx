"use client";

import { useState } from "react";

interface Props {
  onSuccess?: () => void;
}

type Step = "form" | "quiz" | "done";

export function ReadingCard({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; bonus: number } | null>(null);

  async function submitReading() {
    if (title.trim().length < 2 || note.trim().length < 30) {
      setError("Nhập tên sách và tóm tắt ít nhất 30 ký tự");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, note }),
      });
      const data = (await res.json()) as {
        session_id?: string;
        question?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setError(data.error ?? "Không ghi nhận được buổi đọc");
        return;
      }
      setSessionId(data.session_id ?? "");
      setQuestion(data.question ?? "");
      setStep(data.question ? "quiz" : "done");
      if (!data.question) {
        setResult({ correct: true, bonus: 0 });
        onSuccess?.();
      }
    } catch {
      setError("Không kết nối được backend");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(answer: string) {
    if (answer.trim().length < 2) {
      setError("Nhập câu trả lời");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/read/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer }),
      });
      const data = (await res.json()) as { correct?: boolean; bonus?: number; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Không đánh giá được câu trả lời");
        return;
      }
      setResult({ correct: data.correct ?? false, bonus: data.bonus ?? 0 });
      setStep("done");
      onSuccess?.();
    } catch {
      setError("Không kết nối được backend");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-glow rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">📚 Đọc Sách</h2>
        {step === "quiz" && (
          <button
            onClick={() => setStep("form")}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Hủy
          </button>
        )}
      </div>

      {step === "form" && (
        <div>
          <p className="mb-3 text-xs text-muted-foreground">
            Sách là kinh sách tốt nhất của tu giả. Kể sư phụ nghe đệ tử đọc gì — sư phụ sẽ hỏi lại
            một câu (1 lần/ngày).
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên sách (ví dụ: Lão Tử - Đạo Đức Kinh)"
            className="mb-2 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-jade-400/60"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Đệ tử học được gì? (2-3 câu tâm đắc)"
            rows={3}
            className="mb-2 w-full resize-none rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-jade-400/60"
          />
          <button
            onClick={() => void submitReading()}
            disabled={busy}
            className="w-full rounded-xl border border-jade-400/40 bg-jade-400/10 py-2 text-sm font-semibold text-jade-300 transition hover:bg-jade-400/20 disabled:opacity-50"
          >
            {busy ? "Sư phụ đang đọc..." : "Nộp bài · +40 EXP"}
          </button>
        </div>
      )}

      {step === "quiz" && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Sư phụ hỏi lại để biết đệ tử có thật sự ngấm sách:
          </p>
          <p className="mb-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3 text-sm">
            {question}
          </p>
          <AnswerForm onSubmit={(a) => void submitAnswer(a)} busy={busy} />
        </div>
      )}

      {step === "done" && result && (
        <div className="py-2 text-center">
          <div className="animate-pop-glow mx-auto mb-2 text-4xl">
            {result.correct ? "🌟" : "📖"}
          </div>
          <p className="mb-1 text-sm font-semibold text-jade-300">
            {result.correct
              ? `Tâm đắc tuyệt vời! +${40 + result.bonus} EXP`
              : `Đã ghi nhận buổi đọc · +40 EXP (lần sau đọc kỹ hơn nhé)`}
          </p>
          {!result.correct && (
            <p className="text-xs text-muted-foreground">Trả lời đúng câu hỏi được +20 EXP</p>
          )}
          <button
            onClick={() => {
              setStep("form");
              setTitle("");
              setNote("");
            }}
            className="mt-3 rounded-lg border border-jade-400/40 px-4 py-1.5 text-xs text-jade-300 transition hover:bg-jade-400/10"
          >
            Quay lại
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}

function AnswerForm({ onSubmit, busy }: { onSubmit: (answer: string) => void; busy: boolean }) {
  const [answer, setAnswer] = useState("");
  return (
    <div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Câu trả lời của đệ tử..."
        rows={2}
        className="mb-2 w-full resize-none rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-jade-400/60"
      />
      <button
        onClick={() => onSubmit(answer)}
        disabled={busy}
        className="w-full rounded-xl border border-jade-400/40 bg-jade-400/10 py-2 text-sm font-semibold text-jade-300 transition hover:bg-jade-400/20 disabled:opacity-50"
      >
        {busy ? "Sư phụ đang chấm..." : "Trả lời · +20 EXP nếu đúng"}
      </button>
    </div>
  );
}
