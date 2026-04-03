begin;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
      and p.deleted_at is null
  );
$$;

alter table public.click_events enable row level security;
alter table public.nfc_cards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'click_events'
      and policyname = 'app_click_events_insert_public'
  ) then
    create policy app_click_events_insert_public
      on public.click_events
      for insert
      to anon, authenticated
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = profile_id
            and p.is_active = true
            and p.deleted_at is null
        )
        and (
          button_id is null
          or exists (
            select 1
            from public.action_buttons ab
            where ab.id = button_id
              and ab.profile_id = profile_id
              and ab.is_active = true
              and ab.deleted_at is null
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'click_events'
      and policyname = 'app_click_events_select_own'
  ) then
    create policy app_click_events_select_own
      on public.click_events
      for select
      to authenticated
      using (auth.uid() = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'click_events'
      and policyname = 'app_click_events_select_admin'
  ) then
    create policy app_click_events_select_admin
      on public.click_events
      for select
      to authenticated
      using (public.app_is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nfc_cards'
      and policyname = 'app_nfc_cards_select_own_or_admin'
  ) then
    create policy app_nfc_cards_select_own_or_admin
      on public.nfc_cards
      for select
      to authenticated
      using (public.app_is_admin() or profile_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nfc_cards'
      and policyname = 'app_nfc_cards_insert_admin'
  ) then
    create policy app_nfc_cards_insert_admin
      on public.nfc_cards
      for insert
      to authenticated
      with check (public.app_is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nfc_cards'
      and policyname = 'app_nfc_cards_update_admin'
  ) then
    create policy app_nfc_cards_update_admin
      on public.nfc_cards
      for update
      to authenticated
      using (public.app_is_admin())
      with check (public.app_is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nfc_cards'
      and policyname = 'app_nfc_cards_delete_admin'
  ) then
    create policy app_nfc_cards_delete_admin
      on public.nfc_cards
      for delete
      to authenticated
      using (public.app_is_admin());
  end if;
end;
$$;

grant insert on public.click_events to anon, authenticated;
grant select on public.click_events to authenticated;
grant select, insert, update, delete on public.nfc_cards to authenticated;

revoke all on function public.app_is_admin() from public;
grant execute on function public.app_is_admin() to authenticated;

commit;
