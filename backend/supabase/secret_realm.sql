-- Bí Cảnh 7 ngày
CREATE TABLE IF NOT EXISTS public.secret_realms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  realm_code text NOT NULL DEFAULT 'long_huyet',
  start_date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  current_day int NOT NULL DEFAULT 1,
  last_activity_date date,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secret_realms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secret_realms public read"
  ON public.secret_realms FOR SELECT
  USING (true);
