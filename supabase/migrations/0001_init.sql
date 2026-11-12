-- Moo: initial schema.
-- Profiles plus the three log tables mirrored from the app (src/types.ts,
-- src/storage/types.ts). Every table is owner-only through row-level security.
--
-- Sync model: the app stamps `updated_at` when a row changes on a device and
-- soft-deletes by setting `deleted_at`. The server stamps `server_updated_at`
-- on every accepted write; devices pull "everything stamped after my cursor".
-- A write that is older than (or the same age as) what is stored is ignored,
-- so the newest edit wins no matter which device syncs first.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  goals             jsonb,
  answers           jsonb not null default '{}'::jsonb,
  creatine          jsonb,
  units             text check (units in ('metric', 'imperial')),
  -- Server-owned. Set by the RevenueCat webhook / edge functions (service role) only.
  is_premium        boolean not null default false,
  photo_scans_used  integer not null default 0 check (photo_scans_used >= 0),
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

comment on column public.profiles.is_premium is 'Server-owned: written only with the service role (RevenueCat webhook).';
comment on column public.profiles.photo_scans_used is 'Server-owned: incremented only by the analyze-food edge function.';

-- ------------------------------------------------------------ food_entries

create table public.food_entries (
  id                 uuid not null,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day                date not null,
  name               text not null check (char_length(name) between 1 and 200),
  protein_g          double precision not null default 0 check (protein_g >= 0),
  calories           double precision not null default 0 check (calories >= 0),
  carbs_g            double precision not null default 0 check (carbs_g >= 0),
  fat_g              double precision not null default 0 check (fat_g >= 0),
  source             text not null default 'manual' check (source in ('manual', 'quick', 'photo', 'barcode')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- ----------------------------------------------------------- creatine_logs

create table public.creatine_logs (
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day                date not null,
  dose_g             double precision not null check (dose_g >= 0),
  taken_at           timestamptz not null,
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

-- ------------------------------------------------------------- weight_logs

create table public.weight_logs (
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day                date not null,
  weight_kg          double precision not null check (weight_kg > 0),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

-- ----------------------------------------------------------------- indexes

create index food_entries_user_updated_idx   on public.food_entries  (user_id, updated_at);
create index creatine_logs_user_updated_idx  on public.creatine_logs (user_id, updated_at);
create index weight_logs_user_updated_idx    on public.weight_logs   (user_id, updated_at);
-- What the app's pull query actually filters and orders by.
create index food_entries_user_server_idx    on public.food_entries  (user_id, server_updated_at);
create index creatine_logs_user_server_idx   on public.creatine_logs (user_id, server_updated_at);
create index weight_logs_user_server_idx     on public.weight_logs   (user_id, server_updated_at);
create index food_entries_user_day_idx       on public.food_entries  (user_id, day);

-- ------------------------------------------------- last-write-wins trigger

create or replace function public.moo_sync_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at <= old.updated_at then
    -- Stale or repeated write: keep the stored row exactly as it is.
    return old;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

create trigger food_entries_sync_stamp  before insert or update on public.food_entries
  for each row execute function public.moo_sync_stamp();
create trigger creatine_logs_sync_stamp before insert or update on public.creatine_logs
  for each row execute function public.moo_sync_stamp();
create trigger weight_logs_sync_stamp   before insert or update on public.weight_logs
  for each row execute function public.moo_sync_stamp();

-- ------------------------------------- profiles: protect server-owned columns
-- Two independent locks, so a mistake in one does not open the door:
--   1. column-level grants (below): app roles cannot name these columns in a write;
--   2. this trigger: even if a grant is widened later, app roles cannot change them.

create or replace function public.moo_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Not SECURITY DEFINER on purpose: current_user is the caller's role.
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_premium := false;
      new.photo_scans_used := 0;
    else
      new.is_premium := old.is_premium;
      new.photo_scans_used := old.photo_scans_used;
      new.id := old.id;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.moo_profiles_guard();

-- ------------------------------------------- profile row for every new user

create or replace function public.moo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.moo_handle_new_user();

-- Trigger functions are never called directly.
revoke all on function public.moo_sync_stamp()      from public, anon, authenticated;
revoke all on function public.moo_profiles_guard()  from public, anon, authenticated;
revoke all on function public.moo_handle_new_user() from public, anon, authenticated;

-- --------------------------------------------------------------- privileges

revoke all on public.profiles, public.food_entries, public.creatine_logs, public.weight_logs from anon, authenticated;

grant select on public.profiles to authenticated;
grant insert (id, goals, answers, creatine, units, updated_at) on public.profiles to authenticated;
grant update (goals, answers, creatine, units, updated_at)     on public.profiles to authenticated;
-- No delete on profiles: accounts are removed through the delete-account function.

grant select, insert, update on public.food_entries, public.creatine_logs, public.weight_logs to authenticated;
-- No delete: rows are soft-deleted (deleted_at) so deletions reach other devices.

-- ------------------------------------------------------- row-level security

alter table public.profiles      enable row level security;
alter table public.food_entries  enable row level security;
alter table public.creatine_logs enable row level security;
alter table public.weight_logs   enable row level security;

create policy "profiles: owner can read"   on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles: owner can insert" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles: owner can update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "food_entries: owner can read"   on public.food_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "food_entries: owner can insert" on public.food_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "food_entries: owner can update" on public.food_entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "creatine_logs: owner can read"   on public.creatine_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "creatine_logs: owner can insert" on public.creatine_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "creatine_logs: owner can update" on public.creatine_logs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "weight_logs: owner can read"   on public.weight_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "weight_logs: owner can insert" on public.weight_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "weight_logs: owner can update" on public.weight_logs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
