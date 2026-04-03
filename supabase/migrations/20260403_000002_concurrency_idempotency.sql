begin;

create table if not exists public.operation_idempotency_keys (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  response_payload jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null,
  constraint operation_idempotency_keys_unique
    unique (user_id, operation, idempotency_key)
);

create index if not exists idx_operation_idempotency_keys_expires_at
  on public.operation_idempotency_keys (expires_at);

create index if not exists idx_operation_idempotency_keys_user_operation
  on public.operation_idempotency_keys (user_id, operation);

create table if not exists public.operation_write_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_operation_write_events_user_operation_created
  on public.operation_write_events (user_id, operation, created_at desc);

alter table public.operation_idempotency_keys enable row level security;
alter table public.operation_write_events enable row level security;

revoke all on table public.operation_idempotency_keys from anon, authenticated;
revoke all on table public.operation_write_events from anon, authenticated;

create or replace function public.app_lock_key(input text)
returns bigint
language sql
immutable
as $$
  select ('x' || substr(md5(input), 1, 16))::bit(64)::bigint;
$$;

create or replace function public.app_reserve_idempotency_key(
  p_user_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_ttl_seconds integer default 300
)
returns table (
  acquired boolean,
  response_payload jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  lock_key bigint;
  existing_response jsonb;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Permission denied: user_id must match auth.uid()' using errcode = '42501';
  end if;
  lock_key := public.app_lock_key(format('%s:%s:%s', p_user_id, p_operation, p_idempotency_key));
  perform pg_advisory_xact_lock(lock_key);

  delete from public.operation_idempotency_keys
  where user_id = p_user_id
    and operation = p_operation
    and idempotency_key = p_idempotency_key
    and expires_at <= timezone('utc'::text, now());

  select o.response_payload
  into existing_response
  from public.operation_idempotency_keys o
  where o.user_id = p_user_id
    and o.operation = p_operation
    and o.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return query
      select false, existing_response;
    return;
  end if;

  insert into public.operation_idempotency_keys (
    user_id,
    operation,
    idempotency_key,
    expires_at
  )
  values (
    p_user_id,
    p_operation,
    p_idempotency_key,
    timezone('utc'::text, now()) + make_interval(secs => greatest(p_ttl_seconds, 1))
  );

  return query
    select true, null::jsonb;
end;
$$;

create or replace function public.app_store_idempotent_response(
  p_user_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_response_payload jsonb,
  p_ttl_seconds integer default 300
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  lock_key bigint;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Permission denied: user_id must match auth.uid()' using errcode = '42501';
  end if;
  lock_key := public.app_lock_key(format('%s:%s:%s', p_user_id, p_operation, p_idempotency_key));
  perform pg_advisory_xact_lock(lock_key);

  update public.operation_idempotency_keys
  set response_payload = p_response_payload,
      updated_at = timezone('utc'::text, now()),
      expires_at = timezone('utc'::text, now()) + make_interval(secs => greatest(p_ttl_seconds, 1))
  where user_id = p_user_id
    and operation = p_operation
    and idempotency_key = p_idempotency_key;

  if found then
    return;
  end if;

  insert into public.operation_idempotency_keys (
    user_id,
    operation,
    idempotency_key,
    response_payload,
    expires_at
  )
  values (
    p_user_id,
    p_operation,
    p_idempotency_key,
    p_response_payload,
    timezone('utc'::text, now()) + make_interval(secs => greatest(p_ttl_seconds, 1))
  )
  on conflict (user_id, operation, idempotency_key)
  do update
    set response_payload = excluded.response_payload,
        updated_at = timezone('utc'::text, now()),
        expires_at = excluded.expires_at;
end;
$$;

create or replace function public.app_enforce_write_limit(
  p_user_id uuid,
  p_operation text,
  p_limit integer default 20,
  p_window_seconds integer default 60
)
returns table (
  allowed boolean,
  current_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  lock_key bigint;
  existing_count integer;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Permission denied: user_id must match auth.uid()' using errcode = '42501';
  end if;
  lock_key := public.app_lock_key(format('%s:%s', p_user_id, p_operation));
  perform pg_advisory_xact_lock(lock_key);

  delete from public.operation_write_events
  where user_id = p_user_id
    and operation = p_operation
    and created_at < timezone('utc'::text, now()) - make_interval(secs => greatest(p_window_seconds, 1));

  select count(*)::integer
  into existing_count
  from public.operation_write_events
  where user_id = p_user_id
    and operation = p_operation;

  if existing_count >= greatest(p_limit, 1) then
    return query
      select false, existing_count;
    return;
  end if;

  insert into public.operation_write_events (user_id, operation)
  values (p_user_id, p_operation);

  return query
    select true, existing_count + 1;
end;
$$;

create or replace function public.app_enforce_action_buttons_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lock_key bigint;
  active_links integer;
begin
  if coalesce(new.is_active, true) = true and new.deleted_at is null then
    lock_key := public.app_lock_key(format('action_buttons:%s', new.profile_id));
    perform pg_advisory_xact_lock(lock_key);

    select count(*)::integer
    into active_links
    from public.action_buttons
    where profile_id = new.profile_id
      and is_active = true
      and deleted_at is null
      and (tg_op = 'INSERT' or id <> new.id);

    if active_links >= 6 then
      raise exception 'Maximum 6 active links allowed'
        using errcode = '23514',
              detail = format('profile_id=%s', new.profile_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_action_buttons_enforce_limit on public.action_buttons;
create trigger trg_action_buttons_enforce_limit
before insert or update of is_active, deleted_at, profile_id
on public.action_buttons
for each row
execute function public.app_enforce_action_buttons_limit();

revoke all on function public.app_reserve_idempotency_key(uuid, text, text, integer) from public;
revoke all on function public.app_store_idempotent_response(uuid, text, text, jsonb, integer) from public;
revoke all on function public.app_enforce_write_limit(uuid, text, integer, integer) from public;

grant execute on function public.app_reserve_idempotency_key(uuid, text, text, integer) to authenticated;
grant execute on function public.app_store_idempotent_response(uuid, text, text, jsonb, integer) to authenticated;
grant execute on function public.app_enforce_write_limit(uuid, text, integer, integer) to authenticated;

commit;
