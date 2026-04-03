# Release Runbook

## Scope

This runbook covers application release and operational fallback for:

- `20260403_000001_strict_schema_alignment.sql`
- `20260403_000002_concurrency_idempotency.sql`
- `20260403_000003_domain_rls_and_parity.sql`

Use this document together with `supabase/migrations/README.md` and `docs/verification-matrix.md`.

## Prerequisites

- Access to production Supabase SQL Editor.
- Access to deployment platform to redeploy a previous commit if needed.
- Environment variables configured for app and upload flow.
- Green local quality gate:

```powershell
npm run check
```

## Release Steps

1. Ensure local branch is up to date and checks pass.
2. Deploy to staging.
3. Apply pending migrations in staging in timestamp order.
4. Run verification matrix in staging.
5. Deploy the same commit to production.
6. Apply the same pending migrations in production.
7. Run production smoke validation.

## Staging and Production Smoke Validation

Minimum smoke checks after deploy:

1. Auth redirect guard:
   - Anonymous user opening `/dashboard` is redirected to `/login`.
2. Card guard:
   - Anonymous user opening `/card` is redirected to `/login`.
3. Legacy card compatibility:
   - Opening `/tarjeta` resolves to canonical `/card` flow.
4. Dashboard saves:
   - Profile save works.
   - Links save works.
   - Template save works.
5. Public profile render:
   - `/[username]` renders latest saved content.
6. Upload boundary:
   - Valid image uploads work.
   - Invalid image payloads are rejected.

## Rollback Strategy

Use rollback in two layers: application and data.

### Application Rollback

1. Redeploy the previous known-good commit.
2. Keep database schema unchanged unless migration-specific failures are confirmed.
3. Re-run smoke validation.

### Database Rollback Approach

Migrations are forward-only by default. In production, prefer a compensating migration over ad-hoc manual edits.

If immediate SQL mitigation is required before a proper compensating migration is committed, use the relevant section below.

## Emergency SQL Mitigation: 000003 Domain RLS and Parity

Use only if release is blocked by RLS/policy behavior introduced in `20260403_000003_domain_rls_and_parity.sql`.

```sql
begin;

revoke execute on function public.app_is_admin() from authenticated;
drop function if exists public.app_is_admin();

drop policy if exists app_click_events_insert_public on public.click_events;
drop policy if exists app_click_events_select_own on public.click_events;
drop policy if exists app_click_events_select_admin on public.click_events;

drop policy if exists app_nfc_cards_select_own_or_admin on public.nfc_cards;
drop policy if exists app_nfc_cards_insert_admin on public.nfc_cards;
drop policy if exists app_nfc_cards_update_admin on public.nfc_cards;
drop policy if exists app_nfc_cards_delete_admin on public.nfc_cards;

revoke insert on public.click_events from anon, authenticated;
revoke select on public.click_events from authenticated;
revoke select, insert, update, delete on public.nfc_cards from authenticated;

commit;
```

## Emergency SQL Mitigation: 000002 Concurrency and Idempotency

Use only if release is blocked by concurrency/idempotency functions or trigger behavior introduced in `20260403_000002_concurrency_idempotency.sql`.

```sql
begin;

drop trigger if exists trg_action_buttons_enforce_limit on public.action_buttons;
drop function if exists public.app_enforce_action_buttons_limit();

drop function if exists public.app_enforce_write_limit(uuid, text, integer, integer);
drop function if exists public.app_store_idempotent_response(uuid, text, text, jsonb, integer);
drop function if exists public.app_reserve_idempotency_key(uuid, text, text, integer);
drop function if exists public.app_lock_key(text);

drop table if exists public.operation_write_events;
drop table if exists public.operation_idempotency_keys;

commit;
```

## Post-Rollback Checklist

1. Confirm app is reachable.
2. Confirm `/login`, `/dashboard`, `/card`, `/tarjeta`, and `/[username]` behavior.
3. Confirm save operations and uploads.
4. Open incident note with:
   - rollback timestamp
   - commit hash
   - migration state
   - error signature
5. Create compensating migration before next release attempt.
