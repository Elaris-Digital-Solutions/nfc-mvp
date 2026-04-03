# Supabase Migrations

## Strict New-Schema Baseline

Apply this migration in Supabase SQL Editor (or via Supabase CLI) before running the app in strict mode:

- `20260403_000001_strict_schema_alignment.sql`
- `20260403_000002_concurrency_idempotency.sql`
- `20260403_000003_domain_rls_and_parity.sql`

## What it aligns

- `profiles`: `deleted_at`, `updated_at`, `username` normalization/uniqueness, defaults, indexes.
- `action_buttons`: `deleted_at`, `updated_at`, `sort_order`, defaults, indexes.
- Triggered `updated_at` maintenance.
- Auth bootstrap trigger from `auth.users` into `public.profiles`.
- RLS policies for own CRUD + public read of active rows.
- Persistent idempotency keys and write-attempt windows for DB-backed operation guards.
- Atomic max-6 active links enforcement via trigger + advisory lock.
- RLS coverage for domain tables `click_events` and `nfc_cards`.

## Recommended order

1. Run migration in staging.
2. Run `npm run migrations:validate` to verify migration naming, transaction wrappers, and README parity.
3. Run `npm run check`.
4. Execute `docs/verification-matrix.md` in staging.
5. Run migration in production.
6. Execute production smoke subset from `docs/verification-matrix.md`.

## Operational docs

- `docs/release-runbook.md`
- `docs/verification-matrix.md`
