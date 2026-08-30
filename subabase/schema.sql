-- =========================================================
-- USOPEN TYPER - schemat bazy danych (Supabase / Postgres)
-- Wklej całość w Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

-- potrzebne do gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------- PROFILE (nick/avatar z Discorda) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- automatyczne tworzenie profilu po zalogowaniu przez Discord
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, discord_id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name', 'Gracz'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    username = excluded.username,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- MECZE ----------
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique, -- id z tennis API (null = mecz dodany ręcznie przez admina)
  tournament text not null default 'US Open 2026',
  round text, -- np. "1R", "QF", "SF", "F"
  player1 text not null,
  player2 text not null,
  player1_country text,
  player2_country text,
  scheduled_at timestamptz,
  deadline timestamptz not null, -- po tym czasie nie można już typować
  status text not null default 'upcoming' check (status in ('upcoming','live','finished','cancelled')),
  sets_p1 int,          -- ile setów wygrał player1 (wynik końcowy)
  sets_p2 int,          -- ile setów wygrał player2
  winner text check (winner in ('player1','player2')),
  set_scores jsonb,     -- opcjonalnie szczegółowy wynik setów np. [[6,4],[3,6],[6,2]]
  source text not null default 'api' check (source in ('api','admin')), -- kto ostatnio ustawił wynik
  needs_review boolean not null default false, -- API nie potwierdziło 100% wyniku -> admin powinien zerknąć
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- TYPY UŻYTKOWNIKÓW NA MECZE ----------
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  predicted_winner text not null check (predicted_winner in ('player1','player2')),
  predicted_sets_p1 int not null,
  predicted_sets_p2 int not null,
  points int, -- wyliczane po rozliczeniu meczu (0 / 1 / 3)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

-- ---------- PYTANIA BONUSOWE (ręcznie dodawane przez admina) ----------
create table if not exists bonus_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb, -- np. ["Sinner","Alcaraz","Djokovic"] albo null = odpowiedź tekstowa
  points int not null default 5,
  deadline timestamptz not null,
  status text not null default 'open' check (status in ('open','resolved')),
  correct_answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bonus_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  bonus_question_id uuid not null references bonus_questions(id) on delete cascade,
  answer text not null,
  points int,
  created_at timestamptz not null default now(),
  unique (user_id, bonus_question_id)
);

-- ---------- INDEKSY ----------
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_predictions_user on predictions(user_id);
create index if not exists idx_predictions_match on predictions(match_id);

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table profiles enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table bonus_questions enable row level security;
alter table bonus_answers enable row level security;

-- profiles: każdy zalogowany widzi wszystkie profile (ranking, nicki), edytować może tylko swój
create policy "profiles are viewable by everyone" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- matches: widoczne dla wszystkich (także niezalogowanych na stronie meczów)
create policy "matches are viewable by everyone" on matches for select using (true);
-- zapis tylko przez service_role (backend/cron/admin API) - domyślnie brak insert/update/delete policy = zablokowane dla anon/authenticated

-- predictions: user widzi tylko swoje typy dopóki mecz się nie zaczął, a swoje zawsze; cudze typy nie są nigdy publiczne w tym MVP
create policy "users can view own predictions" on predictions for select using (auth.uid() = user_id);
create policy "users can insert own predictions before deadline" on predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from matches m where m.id = match_id and m.deadline > now() and m.status = 'upcoming'
    )
  );
create policy "users can update own predictions before deadline" on predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from matches m where m.id = match_id and m.deadline > now() and m.status = 'upcoming'
    )
  );

-- bonus_questions: widoczne dla wszystkich
create policy "bonus questions viewable by everyone" on bonus_questions for select using (true);

-- bonus_answers: user widzi/dodaje tylko swoje, przed deadlinem
create policy "users can view own bonus answers" on bonus_answers for select using (auth.uid() = user_id);
create policy "users can insert own bonus answers before deadline" on bonus_answers
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from bonus_questions q where q.id = bonus_question_id and q.deadline > now() and q.status = 'open'
    )
  );
create policy "users can update own bonus answers before deadline" on bonus_answers
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from bonus_questions q where q.id = bonus_question_id and q.deadline > now() and q.status = 'open'
    )
  );

-- ---------- WIDOK RANKINGU (suma punktów: mecze + bonusy) ----------
create or replace view ranking as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(pr.points), 0)::int as match_points,
  coalesce((select sum(ba.points) from bonus_answers ba where ba.user_id = p.id), 0)::int as bonus_points,
  coalesce(sum(pr.points), 0)::int + coalesce((select sum(ba.points) from bonus_answers ba where ba.user_id = p.id), 0)::int as total_points,
  count(pr.id) filter (where pr.points is not null) as matches_scored
from profiles p
left join predictions pr on pr.user_id = p.id
group by p.id, p.username, p.avatar_url
order by total_points desc;
