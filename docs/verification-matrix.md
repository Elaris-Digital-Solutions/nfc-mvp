# Verification Matrix

Run this matrix in staging before production rollout and as post-release smoke in production.

## Automated Baseline

```powershell
npm run check
```

Expected result:

- Lint, typecheck, tests, migrations validation, and build all succeed.

## Manual Matrix

| Area | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| Routing/Auth | Protected dashboard route | Sign out, open `/dashboard` | Redirect to `/login` |
| Routing/Auth | Canonical card route guard | Sign out, open `/card` | Redirect to `/login` |
| Routing/Auth | Legacy card route compatibility | Open `/tarjeta` while authenticated | User lands on card experience via canonical flow |
| Dashboard/Profile | Profile save success | Edit profile fields, save | Success message and persisted data after refresh |
| Dashboard/Profile | Profile stale write conflict | Open two tabs, save different values, then save older tab | Conflict message, no silent overwrite |
| Dashboard/Links | Link creation limit | Add links until 6 active links, try 7th | Operation rejected with limit error |
| Dashboard/Links | Link update stale write conflict | Edit same link in two tabs and save out of order | Conflict message on stale tab |
| Dashboard/Links | Idempotent duplicate submit | Trigger same save action rapidly with same payload | No duplicate side effects |
| Dashboard/Template | Template update | Select new template and save | Template applied and persisted |
| Dashboard/Template | Stale template conflict | Save template from stale tab | Conflict response |
| Uploads | Valid image upload | Upload png/jpg/webp under 10MB | Upload succeeds, URL persisted after save |
| Uploads | Invalid image payload | Try non-image or >10MB file | Rejected with clear error |
| Public Profile | Public route freshness | Update profile and reload `/[username]` | Latest values visible |
| Rate limiting | Excess write burst | Trigger rapid repeated writes | Rate-limited response without server crash |
| Observability | Structured action errors | Force known action error (e.g. conflict) | Structured error logged with code/message/context |
| RLS | Click events insert policy | Insert click event through app flow | Event accepted for active profile/button only |
| RLS | NFC admin policy | Non-admin tries NFC mutation | Access denied |

## Incident Trigger Conditions

Stop release and rollback if any of these occur:

1. Protected routes become publicly accessible.
2. Save operations silently overwrite newer data.
3. Upload endpoint accepts invalid payload types.
4. RLS policy blocks critical user flows unexpectedly.
5. Build or migration validation fails after deployment.
