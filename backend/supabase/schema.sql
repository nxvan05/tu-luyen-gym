-- ============================================================
-- Tu Luyện Gym — schema Tuần 1
-- Chạy toàn bộ file này trong Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → dán → Run
-- ============================================================

-- ---------- Cultivators (người tu luyện) ----------
create table if not exists public.cultivators (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique not null,
  username text not null,
  display_name text,
  avatar_url text,
  level int not null default 1,
  exp int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  last_checkin_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Checkins ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  cultivator_id uuid not null references public.cultivators(id) on delete cascade,
  workout_type text not null check (workout_type in ('push','pull','legs','cardio','rest')),
  photo_url text,
  verified boolean not null default true,
  exp_gained int not null default 0,
  checked_in_date date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (cultivator_id, checked_in_date)
);

-- ---------- Boss tuần ----------
create table if not exists public.bosses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season int not null default 1,
  max_hp bigint not null,
  hp bigint not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz
);

create table if not exists public.boss_damage (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.bosses(id) on delete cascade,
  cultivator_id uuid not null references public.cultivators(id) on delete cascade,
  damage bigint not null default 0,
  checkin_id uuid references public.checkins(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Quests ----------
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  workout_type text check (workout_type in ('push','pull','legs','cardio','rest')),
  exp int not null default 0,
  active boolean not null default true
);

-- ---------- Achievements ----------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  emoji text not null default '🏅'
);

create table if not exists public.user_achievements (
  cultivator_id uuid not null references public.cultivators(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (cultivator_id, achievement_id)
);

-- ============================================================
-- RLS: ai cũng đọc được (BXH), nhưng chỉ backend (secret key)
-- mới ghi được — không chính sách INSERT/UPDATE cho anon.
-- ============================================================
alter table public.cultivators enable row level security;
alter table public.checkins enable row level security;
alter table public.bosses enable row level security;
alter table public.boss_damage enable row level security;
alter table public.quests enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "public read cultivators" on public.cultivators for select using (true);
create policy "public read checkins" on public.checkins for select using (true);
create policy "public read bosses" on public.bosses for select using (true);
create policy "public read boss_damage" on public.boss_damage for select using (true);
create policy "public read quests" on public.quests for select using (true);
create policy "public read achievements" on public.achievements for select using (true);
create policy "public read user_achievements" on public.user_achievements for select using (true);

-- ============================================================
-- Seed dữ liệu mặc định
-- ============================================================

-- Boss mùa 1: 10.000.000 HP, hết hạn cuối tuần sau (điều chỉnh sau)
insert into public.bosses (name, season, max_hp, hp, ends_at)
select 'Ma Thú Thái Cổ Hùng', 1, 10000000, 10000000, now() + interval '7 days'
where not exists (select 1 from public.bosses where season = 1);

-- Quests mặc định
insert into public.quests (code, title, workout_type, exp) values
  ('push',   'Đẩy tạ — Push day',      'push',   120),
  ('pull',   'Kéo xà — Pull day',      'pull',   120),
  ('legs',   'Chân — Legs day',        'legs',   130),
  ('cardio', 'Chạy 30 phút — Cardio',  'cardio', 90),
  ('rest',   'Nghỉ ngơi — Rest day',   'rest',   40)
on conflict (code) do nothing;

-- Achievements mặc định
insert into public.achievements (code, title, emoji) values
  ('first_checkin',  'Bắt đầu tu luyện',       '🌱'),
  ('streak_7',       'Chuỗi 7 ngày',           '🔥'),
  ('streak_30',      'Chuỗi 30 ngày',          '⛩️'),
  ('streak_100',     'Chuỗi 100 ngày',         '👑'),
  ('realm_golden',   'Đột phá Kim Đan',        '💛'),
  ('boss_killer',    'Hạ sát Boss tuần',       '🐉')
on conflict (code) do nothing;
