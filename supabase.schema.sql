-- Do app Supabase schema
-- Safe namespace: every app-owned object starts with do_task_bracket_v1_.
-- This script only creates/updates objects with that prefix and does not touch
-- existing app tables, functions, policies, triggers, or data.

create table if not exists public.do_task_bracket_v1_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  public_profile boolean not null default true,
  reputation_score integer not null default 0,
  done_count integer not null default 0,
  proof_count integer not null default 0,
  support_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.do_task_bracket_v1_tasks (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  score double precision not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  seen integer not null default 0,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.do_task_bracket_v1_proofs (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  task_id text references public.do_task_bracket_v1_tasks (id) on delete cascade,
  task_text text not null,
  evidence text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.do_task_bracket_v1_support_signals (
  id text primary key,
  profile_id uuid not null references public.do_task_bracket_v1_profiles (id) on delete cascade,
  supporter_id uuid references auth.users (id) on delete set null,
  supporter_name text not null,
  signal_type text not null check (signal_type in ('verify', 'kudos', 'nudge')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists do_task_bracket_v1_tasks_owner_rank_idx
  on public.do_task_bracket_v1_tasks (owner_id, done, score desc, created_at);

create index if not exists do_task_bracket_v1_tasks_owner_updated_idx
  on public.do_task_bracket_v1_tasks (owner_id, updated_at desc);

create index if not exists do_task_bracket_v1_proofs_owner_created_idx
  on public.do_task_bracket_v1_proofs (owner_id, created_at desc);

create index if not exists do_task_bracket_v1_support_profile_created_idx
  on public.do_task_bracket_v1_support_signals (profile_id, created_at desc);

create or replace function public.do_task_bracket_v1_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.do_task_bracket_v1_refresh_profile_stats(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  done_total integer;
  proof_total integer;
  support_total integer;
  support_score integer;
begin
  select count(*) into done_total
  from public.do_task_bracket_v1_tasks
  where owner_id = target_profile_id and done = true;

  select count(*) into proof_total
  from public.do_task_bracket_v1_proofs
  where owner_id = target_profile_id;

  select count(*), coalesce(sum(
    case signal_type
      when 'verify' then 16
      when 'nudge' then -5
      else 6
    end
  ), 0)
  into support_total, support_score
  from public.do_task_bracket_v1_support_signals
  where profile_id = target_profile_id;

  update public.do_task_bracket_v1_profiles
  set
    done_count = done_total,
    proof_count = proof_total,
    support_count = support_total,
    reputation_score = greatest(0, done_total * 10 + proof_total * 12 + support_score)
  where id = target_profile_id;
end;
$$;

create or replace function public.do_task_bracket_v1_refresh_profile_stats_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'do_task_bracket_v1_support_signals' then
    perform public.do_task_bracket_v1_refresh_profile_stats(coalesce(new.profile_id, old.profile_id));
  else
    perform public.do_task_bracket_v1_refresh_profile_stats(coalesce(new.owner_id, old.owner_id));
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists do_task_bracket_v1_profiles_updated_at on public.do_task_bracket_v1_profiles;
create trigger do_task_bracket_v1_profiles_updated_at
before update on public.do_task_bracket_v1_profiles
for each row execute function public.do_task_bracket_v1_set_updated_at();

drop trigger if exists do_task_bracket_v1_tasks_updated_at on public.do_task_bracket_v1_tasks;
create trigger do_task_bracket_v1_tasks_updated_at
before update on public.do_task_bracket_v1_tasks
for each row execute function public.do_task_bracket_v1_set_updated_at();

drop trigger if exists do_task_bracket_v1_tasks_stats on public.do_task_bracket_v1_tasks;
create trigger do_task_bracket_v1_tasks_stats
after insert or update or delete on public.do_task_bracket_v1_tasks
for each row execute function public.do_task_bracket_v1_refresh_profile_stats_trigger();

drop trigger if exists do_task_bracket_v1_proofs_stats on public.do_task_bracket_v1_proofs;
create trigger do_task_bracket_v1_proofs_stats
after insert or update or delete on public.do_task_bracket_v1_proofs
for each row execute function public.do_task_bracket_v1_refresh_profile_stats_trigger();

drop trigger if exists do_task_bracket_v1_support_stats on public.do_task_bracket_v1_support_signals;
create trigger do_task_bracket_v1_support_stats
after insert or update or delete on public.do_task_bracket_v1_support_signals
for each row execute function public.do_task_bracket_v1_refresh_profile_stats_trigger();

alter table public.do_task_bracket_v1_profiles enable row level security;
alter table public.do_task_bracket_v1_tasks enable row level security;
alter table public.do_task_bracket_v1_proofs enable row level security;
alter table public.do_task_bracket_v1_support_signals enable row level security;

drop policy if exists "do_task_bracket_v1_profiles_read_own_or_public" on public.do_task_bracket_v1_profiles;
create policy "do_task_bracket_v1_profiles_read_own_or_public"
on public.do_task_bracket_v1_profiles for select
using (id = auth.uid() or public_profile = true);

drop policy if exists "do_task_bracket_v1_profiles_insert_own" on public.do_task_bracket_v1_profiles;
create policy "do_task_bracket_v1_profiles_insert_own"
on public.do_task_bracket_v1_profiles for insert
with check (id = auth.uid());

drop policy if exists "do_task_bracket_v1_profiles_update_own" on public.do_task_bracket_v1_profiles;
create policy "do_task_bracket_v1_profiles_update_own"
on public.do_task_bracket_v1_profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "do_task_bracket_v1_tasks_read_own" on public.do_task_bracket_v1_tasks;
create policy "do_task_bracket_v1_tasks_read_own"
on public.do_task_bracket_v1_tasks for select
using (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_tasks_insert_own" on public.do_task_bracket_v1_tasks;
create policy "do_task_bracket_v1_tasks_insert_own"
on public.do_task_bracket_v1_tasks for insert
with check (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_tasks_update_own" on public.do_task_bracket_v1_tasks;
create policy "do_task_bracket_v1_tasks_update_own"
on public.do_task_bracket_v1_tasks for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_tasks_delete_own" on public.do_task_bracket_v1_tasks;
create policy "do_task_bracket_v1_tasks_delete_own"
on public.do_task_bracket_v1_tasks for delete
using (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_proofs_read_own_or_public" on public.do_task_bracket_v1_proofs;
create policy "do_task_bracket_v1_proofs_read_own_or_public"
on public.do_task_bracket_v1_proofs for select
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.do_task_bracket_v1_profiles
    where do_task_bracket_v1_profiles.id = do_task_bracket_v1_proofs.owner_id
      and do_task_bracket_v1_profiles.public_profile = true
  )
);

drop policy if exists "do_task_bracket_v1_proofs_insert_own" on public.do_task_bracket_v1_proofs;
create policy "do_task_bracket_v1_proofs_insert_own"
on public.do_task_bracket_v1_proofs for insert
with check (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_proofs_update_own" on public.do_task_bracket_v1_proofs;
create policy "do_task_bracket_v1_proofs_update_own"
on public.do_task_bracket_v1_proofs for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_proofs_delete_own" on public.do_task_bracket_v1_proofs;
create policy "do_task_bracket_v1_proofs_delete_own"
on public.do_task_bracket_v1_proofs for delete
using (owner_id = auth.uid());

drop policy if exists "do_task_bracket_v1_signals_read_profile_or_public" on public.do_task_bracket_v1_support_signals;
create policy "do_task_bracket_v1_signals_read_profile_or_public"
on public.do_task_bracket_v1_support_signals for select
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.do_task_bracket_v1_profiles
    where do_task_bracket_v1_profiles.id = do_task_bracket_v1_support_signals.profile_id
      and do_task_bracket_v1_profiles.public_profile = true
  )
);

drop policy if exists "do_task_bracket_v1_signals_insert_signed_in" on public.do_task_bracket_v1_support_signals;
create policy "do_task_bracket_v1_signals_insert_signed_in"
on public.do_task_bracket_v1_support_signals for insert
with check (supporter_id = auth.uid());

drop policy if exists "do_task_bracket_v1_signals_delete_own_support" on public.do_task_bracket_v1_support_signals;
create policy "do_task_bracket_v1_signals_delete_own_support"
on public.do_task_bracket_v1_support_signals for delete
using (supporter_id = auth.uid() or profile_id = auth.uid());
