-- Pháp Bảo (rơi ngẫu nhiên khi bế quan)
CREATE TABLE IF NOT EXISTS public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  name text NOT NULL,
  rarity text NOT NULL DEFAULT 'ha',
  emoji text NOT NULL DEFAULT '🗡️',
  effect text NOT NULL DEFAULT '',
  obtained_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifacts public read"
  ON public.artifacts FOR SELECT
  USING (true);
