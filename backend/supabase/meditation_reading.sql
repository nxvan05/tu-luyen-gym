-- Thiền định + Đọc sách
CREATE TABLE IF NOT EXISTS public.meditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  minutes int NOT NULL,
  energy_gained int NOT NULL DEFAULT 0,
  exp_gained int NOT NULL DEFAULT 0,
  meditated_on date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cultivator_id, meditated_on)
);

ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meditations public read"
  ON public.meditations FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivator_id uuid NOT NULL REFERENCES public.cultivators(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  title text NOT NULL,
  note text NOT NULL,
  question text NOT NULL,
  correct_answer text NOT NULL,
  exp_gained int NOT NULL DEFAULT 0,
  answered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cultivator_id, session_date)
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_sessions public read"
  ON public.reading_sessions FOR SELECT
  USING (true);
