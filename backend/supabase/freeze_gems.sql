-- Ngọc Bảo Vệ Đạo Tâm (streak freeze)
CREATE TABLE IF NOT EXISTS public.freeze_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  used_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.freeze_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freeze_uses public read"
  ON public.freeze_uses FOR SELECT
  USING (true);
