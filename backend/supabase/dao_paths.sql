-- Cây Đạo: mỗi loại tu luyện là một nhánh (Luyện Thể / Thân Pháp / Tĩnh Tâm)
CREATE TABLE IF NOT EXISTS public.dao_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code IN ('luyen_the', 'than_phap', 'tinh_tam')),
  exp int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cultivator_id, code)
);

ALTER TABLE public.dao_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dao_paths public read"
  ON public.dao_paths FOR SELECT
  USING (true);
