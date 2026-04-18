Feature: Weekly Email Digest (opt-in)
Goal: Let users opt in to a weekly email summarising the TILs they saved in the past 7 days. Off by default. Reinforces the daily capture habit.

## Context

til.bar currently has no email provider and no scheduled jobs. Both need to be added minimally. User preferences already have a home: the `profiles.settings` JSONB column (see `supabase/migrations/00001_initial_schema.sql`). No new tables.

## Decisions (confirmed)

- **Provider**: Resend + React Email templates
- **Schedule**: Monday 09:00 UTC, weekly (cron `0 9 * * 1`)
- **UI**: new "Notifications" subsection inside the existing Account tab — not a new tab

## Where to implement

### 1. Preference storage — `profiles.settings` JSONB

Extend shape to `{ export_format?, email_digest_enabled?: boolean }`. No migration required.

### 2. Server action — `app/actions/preferences.ts` (new)

```ts
export async function setEmailDigestEnabled(enabled: boolean);
```

- Pattern: match `app/actions/account.ts` (use `createClient()` from `lib/supabase/server.ts`, get user, return `{ error: string }` on failure)
- Read existing `settings`, merge `email_digest_enabled`, update

### 3. Settings UI — `components/settings/account-tab.tsx`

- Add a "Notifications" row with a switch labelled "Weekly email digest"
- Initial value read from user's profile (extend `profile` data flow from `components/settings-dialog.tsx` if needed)
- Use `useTransition()` + Sonner (`toast.success` / `toast.error`)
- Conditional classes via `cn()` object syntax

### 4. Cron endpoint — `app/api/cron/weekly-digest/route.ts` (new)

- `GET` handler. Verify `Authorization: Bearer ${process.env.CRON_SECRET}` → 401 otherwise
- Use `createAdminClient()` from `lib/supabase/admin.ts` (bypasses RLS)
- Query opted-in users: `profiles` where `settings->>email_digest_enabled = 'true'`, join `auth.users` for email
- For each user: fetch `tils` from last 7 days with spread `...tags(*)` (per Supabase spread feedback), ordered by `created_at desc`
- Skip users with zero TILs (no empty emails)
- Send via Resend. Use `Promise.allSettled` in chunks of 10 to respect rate limits
- Return `{ sent, skipped, failed }` JSON for observability

### 5. Email template — `emails/weekly-digest.tsx` (new)

- React Email template (`@react-email/components`)
- Content: week range, total count, per-day grouping (titles as links, description, tag pills)
- Group by day using `Intl.DateTimeFormat("en-US")` formatter instance declared at module scope
- Footer: "Manage notifications" → `https://til.bar/settings`

### 6. Email helper — `lib/email/resend.ts` (new)

- Lazy `new Resend(process.env.RESEND_API_KEY)` singleton
- Export `sendWeeklyDigest({ to, tils })` — renders template, calls `resend.emails.send()`
- `from`: `process.env.EMAIL_FROM`

### 7. Scheduler — `vercel.json` (new)

```json
{ "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }] }
```

### 8. Env vars — `env.example`

Add (empty values, per convention):

- `RESEND_API_KEY=`
- `CRON_SECRET=`
- `EMAIL_FROM=til.bar <no-reply@til.bar>`

### 9. Docs

- `TECH.md`: one line under stack — "Email: Resend + React Email for weekly digest"
- `PRODUCT.md`: one bullet under Settings → Account — "Weekly email digest opt-in (off by default)"

## Dependencies

```bash
bun add resend @react-email/components @react-email/render
```

## Edge cases

- Zero TILs in the past 7 days → skip user, no email
- User deletes account mid-week → row gone, naturally skipped
- Resend failure for one user → log, continue to next (don't fail the cron run)
- Timezone → group by day in UTC for v1 (matches `created_at` storage); note in email footer
- Duplicate-send protection → not needed (weekly cron is idempotent per week). Deferred: `last_digest_sent_at` in `settings` JSONB if needed later.

## Tests / verification

1. **Toggle UI**: `bun dev` → Settings → Account → toggle on → toast + DB shows `{"email_digest_enabled": true}` in `profiles.settings`; toggle off persists.
2. **Cron auth**: `curl /api/cron/weekly-digest` without header → 401. With `Authorization: Bearer $CRON_SECRET` → 200.
3. **Email delivery**: with opt-in + recent TILs, hit the endpoint → email arrives with subject "Your TIL week", per-day grouping, tags render, footer link works.
4. **Zero-TIL skip**: second opted-in user with no TILs → counted in `skipped`, no send.
5. **Prod cron**: after deploy, Vercel → Crons shows `weekly-digest` at `0 9 * * 1`. Manual trigger from Vercel UI delivers email end-to-end.

## Reused utilities

- `lib/supabase/server.ts` → `createClient()` — for server action
- `lib/supabase/admin.ts` → `createAdminClient()` — for cron (cross-user reads)
- `app/actions/account.ts` — pattern reference for action shape
- `@/lib/utils` → `cn()` — conditional classes
- Existing `profiles.settings` JSONB column — no migration
