begin;

create extension if not exists pgcrypto;

create or replace function public.app_normalize_username(seed text, uid uuid)
returns text
language plpgsql
immutable
as $$
declare
  raw_value text;
  normalized text;
  suffix text;
begin
  raw_value := coalesce(seed, 'user');
  raw_value := lower(raw_value);

  normalized := regexp_replace(raw_value, '[^a-z0-9_-]', '-', 'g');
  normalized := regexp_replace(normalized, '-{2,}', '-', 'g');
  normalized := trim(both '-' from normalized);

  if normalized = '' then
    normalized := 'user';
  end if;

  suffix := substr(replace(uid::text, '-', ''), 1, 8);
  normalized := substr(normalized, 1, 11) || '-' || suffix;

  if length(normalized) < 3 then
    normalized := 'user-' || suffix;
  end if;

  return substr(normalized, 1, 20);
end;
$$;

-- RLS: Block direct user role changes except by admin
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'app_profiles_update_role_admin_only'
  ) then
    create policy app_profiles_update_role_admin_only
      on public.profiles
      for update
      to authenticated
      using (
        (
          -- Only allow update to role if admin
          (
            (auth.uid() = id and (old.role = new.role))
            or public.app_is_admin()
          )
        )
      )
      with check (
        (
          (auth.uid() = id and (old.role = new.role))
          or public.app_is_admin()
        )
      );
  end if;
end;
$$;

alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists is_active boolean;
alter table public.profiles add column if not exists template_id integer;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists service_expires_at timestamptz;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;

alter table public.profiles alter column created_at set default timezone('utc'::text, now());
alter table public.profiles alter column updated_at set default timezone('utc'::text, now());
alter table public.profiles alter column is_active set default true;
alter table public.profiles alter column template_id set default 1;
alter table public.profiles alter column role set default 'user';

update public.profiles
set created_at = coalesce(created_at, timezone('utc'::text, now()));

update public.profiles
set updated_at = coalesce(updated_at, created_at, timezone('utc'::text, now()));

update public.profiles
set is_active = coalesce(is_active, true)
where is_active is null;

update public.profiles
set template_id = coalesce(template_id, 1)
where template_id is null;

update public.profiles
set role = coalesce(role, 'user')
where role is null;

update public.profiles p
set username = public.app_normalize_username(
  coalesce(
    nullif(p.username, ''),
    nullif(p.full_name, ''),
    split_part(coalesce(p.email, p.id::text), '@', 1)
  ),
  p.id
)
where p.username is null
   or p.username = ''
   or p.username !~ '^[a-z0-9_-]{3,20}$';

update public.profiles
set username = lower(username)
where username <> lower(username);

with duplicated_usernames as (
  select
    id,
    row_number() over (partition by lower(username) order by created_at, id) as rn
  from public.profiles
)
update public.profiles p
set username = public.app_normalize_username(p.username, p.id)
from duplicated_usernames d
where p.id = d.id
  and d.rn > 1;

alter table public.profiles alter column username set not null;
alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column updated_at set not null;
alter table public.profiles alter column is_active set not null;
alter table public.profiles alter column template_id set not null;

create unique index if not exists idx_profiles_username_lower_unique
  on public.profiles (lower(username));

create index if not exists idx_profiles_public_lookup
  on public.profiles (username)
  where is_active = true and deleted_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_chk
      check (username ~ '^[a-z0-9_-]{3,20}$') not valid;
  end if;
end;
$$;

alter table public.action_buttons add column if not exists created_at timestamptz;
alter table public.action_buttons add column if not exists updated_at timestamptz;
alter table public.action_buttons add column if not exists deleted_at timestamptz;
alter table public.action_buttons add column if not exists is_active boolean;
alter table public.action_buttons add column if not exists sort_order integer;
alter table public.action_buttons add column if not exists icon text;

alter table public.action_buttons alter column created_at set default timezone('utc'::text, now());
alter table public.action_buttons alter column updated_at set default timezone('utc'::text, now());
alter table public.action_buttons alter column is_active set default true;
alter table public.action_buttons alter column sort_order set default 0;
alter table public.action_buttons alter column icon set default 'link';

update public.action_buttons
set created_at = coalesce(created_at, timezone('utc'::text, now()));

update public.action_buttons
set updated_at = coalesce(updated_at, created_at, timezone('utc'::text, now()));

update public.action_buttons
set is_active = coalesce(is_active, true)
where is_active is null;

update public.action_buttons
set icon = coalesce(nullif(icon, ''), 'link')
where icon is null or icon = '';

with ordered as (
  select
    id,
    row_number() over (
      partition by profile_id
      order by coalesce(created_at, timezone('utc'::text, now())), id
    ) - 1 as position
  from public.action_buttons
)
update public.action_buttons ab
set sort_order = ordered.position
from ordered
where ab.id = ordered.id
  and (ab.sort_order is null or ab.sort_order < 0);

alter table public.action_buttons alter column created_at set not null;
alter table public.action_buttons alter column updated_at set not null;
alter table public.action_buttons alter column is_active set not null;
alter table public.action_buttons alter column sort_order set not null;
alter table public.action_buttons alter column icon set not null;

create index if not exists idx_action_buttons_active_lookup
  on public.action_buttons (profile_id, is_active, deleted_at, sort_order);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_action_buttons_set_updated_at on public.action_buttons;
create trigger trg_action_buttons_set_updated_at
before update on public.action_buttons
for each row
execute function public.set_updated_at_timestamp();

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name_value text;
  candidate_username text;
begin
  full_name_value := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', '')
  );

  candidate_username := public.app_normalize_username(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      full_name_value,
      split_part(coalesce(new.email, new.id::text), '@', 1)
    ),
    new.id
  );

  insert into public.profiles (
    id,
    username,
    full_name,
    email,
    template_id,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    candidate_username,
    full_name_value,
    new.email,
    1,
    true,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

insert into public.profiles (
  id,
  username,
  full_name,
  email,
  template_id,
  is_active,
  created_at,
  updated_at
)
select
  u.id,
  public.app_normalize_username(
    coalesce(
      nullif(u.raw_user_meta_data ->> 'username', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(u.email, u.id::text), '@', 1)
    ),
    u.id
  ) as username,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as full_name,
  u.email,
  1,
  true,
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

alter table public.profiles enable row level security;
alter table public.action_buttons enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'app_profiles_select_own'
  ) then
    create policy app_profiles_select_own
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'app_profiles_insert_own'
  ) then
    create policy app_profiles_insert_own
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'app_profiles_update_own'
  ) then
    create policy app_profiles_update_own
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id and deleted_at is null)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'app_profiles_public_select_active'
  ) then
    create policy app_profiles_public_select_active
      on public.profiles
      for select
      to anon, authenticated
      using (is_active = true and deleted_at is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_buttons'
      and policyname = 'app_action_buttons_select_own'
  ) then
    create policy app_action_buttons_select_own
      on public.action_buttons
      for select
      to authenticated
      using (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_buttons'
      and policyname = 'app_action_buttons_insert_own'
  ) then
    create policy app_action_buttons_insert_own
      on public.action_buttons
      for insert
      to authenticated
      with check (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_buttons'
      and policyname = 'app_action_buttons_update_own'
  ) then
    create policy app_action_buttons_update_own
      on public.action_buttons
      for update
      to authenticated
      using (auth.uid() = profile_id)
      with check (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_buttons'
      and policyname = 'app_action_buttons_delete_own'
  ) then
    create policy app_action_buttons_delete_own
      on public.action_buttons
      for delete
      to authenticated
      using (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_buttons'
      and policyname = 'app_action_buttons_public_select_active'
  ) then
    create policy app_action_buttons_public_select_active
      on public.action_buttons
      for select
      to anon, authenticated
      using (
        is_active = true
        and deleted_at is null
        and exists (
          select 1
          from public.profiles p
          where p.id = profile_id
            and p.is_active = true
            and p.deleted_at is null
        )
      );
  end if;
end;
$$;

grant select on public.profiles to anon, authenticated;
grant select on public.action_buttons to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant insert, update, delete on public.action_buttons to authenticated;

commit;
