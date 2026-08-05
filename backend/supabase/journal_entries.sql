-- Nhật ký tu tiên: AI tự viết sau mỗi lần bế quan
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cultivator_id, entry_date)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal public read"
  ON public.journal_entries FOR SELECT
  USING (true);
