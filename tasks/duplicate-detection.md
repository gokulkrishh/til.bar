Feature: Duplicate Detection
Goal: Prevent duplicate URLs from being saved across all input methods. Inform the user instead of silently failing or saving again.

## Audit of current save paths (2026-06)

There are **five** ways a TIL gets inserted, not three:

| #   | Entry point                                 | Insert location                                                      | Funnels through                              |
| --- | ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Web app (paste, mobile input, share target) | `app/actions/tils.ts` → `createTil()`, insert at ~line 97            | `context/capture-provider.tsx` → `capture()` |
| 2   | Chrome extension                            | `app/api/save/route.ts` → `POST`, insert at ~line 53                 | `extension/background.js` → `saveLink()`     |
| 3   | iOS Shortcut                                | same `POST /api/save`                                                | shortcut shows raw JSON response             |
| 4   | MCP `save_link`                             | `app/api/mcp/route.ts`, insert at ~line 200                          | AI assistants                                |
| 5   | JSON import                                 | `app/actions/import.ts` → `confirmImport()`, bulk insert at ~line 36 | Settings → Data tab                          |

The Web Share Target handler routes into the capture provider, so it is covered by #1.

Relevant existing infrastructure:

- `idx_tils_user_url` btree index on `tils(user_id, url)` already exists (`supabase/migrations/00001_initial_schema.sql:63`) — duplicate lookups are already indexed. No new index needed.
- Stored URLs are **raw, not normalised**. A lookup against a single normalised string would miss stored `http://` or trailing-slash variants. The check must query a small variant set instead (see below).

## Shared helper: `lib/duplicate.ts`

```ts
// urlVariants(url: string): string[]
//   Pure function. Returns the candidate set to match against stored raw URLs:
//   {as-given, http<->https swapped} x {with, without trailing slash}
//   (max 4 distinct strings). Host lowercased in all variants.
//   Query params and #fragments left untouched — different params = different link.

// checkDuplicateUrl(supabase, userId, url):
//   .from("tils").select("id, url, created_at")
//   .eq("user_id", userId).in("url", urlVariants(url))
//   .order("created_at").limit(1)
//   Returns { duplicate: true, id, url, created_at } | { duplicate: false }
```

Accepts any Supabase client (server client or admin/service-role) since callers differ.

## Implementation per entry point

### 1. `app/actions/tils.ts` — `createTil()`

- Call `checkDuplicateUrl()` after the auth check and `extractUrl()`, before `.insert()`.
- On duplicate, follow the server-action convention (return `{ error }`, never throw):
  `return { error: "Already saved on <date>", duplicate: { id, url } }`
- Format the date with a module-level `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })` instance (per code conventions — no `toLocaleDateString`).

### 2. `context/capture-provider.tsx` — UI handling

- `capture()` is optimistic: it plays the drop sound, fires success haptic, adds a pending TIL, and shows `toast.success("Link saved")` **before** the server responds (~line 91). Keep that — duplicates are rare and the optimistic path is the product.
- On duplicate error: existing error branch already removes the pending TIL and calls `toast.error(result.error)`, so the message "Already saved on <date>" surfaces with **zero changes** if `createTil` returns it as `error`. Optionally fire the `error` haptic alongside.

### 3. `app/api/save/route.ts` — extension + iOS Shortcut

- Call `checkDuplicateUrl()` after `getAuthenticatedUserId()`, before `.insert()`. This route uses the service-role client, so pass `userId` explicitly.
- On duplicate: `Response.json({ error: "Already saved", id, saved_at }, { status: 409, headers })` — keep CORS headers on the 409.

### 4. `extension/background.js`

- `saveLink()` currently treats every non-ok, non-401 response as "Failed to save". Add a 409 branch returning `{ success: false, error: "duplicate" }`.
- In `handleSave()`, show a neutral toast ("Already saved") via the existing `showToast()`, styled as success-dark not error-red, and skip the sound.
- iOS Shortcut needs no change — the 409 body's `error` field is human-readable.

### 5. `app/api/mcp/route.ts` — `save_link` tool

- Call `checkDuplicateUrl()` before the insert (~line 200).
- On duplicate: `return mcpText("Already saved on <date>: <url> (id: <id>)")` — a normal text result, **not** `mcpError`, so assistants treat it as information rather than a failure and can chain into `get_link`/`update_link`.

### 6. `app/actions/import.ts` — `confirmImport()` (new in this plan)

Bulk path — per-row round-trips would be slow for large imports. Instead:

- Fetch all of the user's existing URLs once: `select url from tils where user_id = ...`.
- Build a Set of normalised forms (reuse a `normalizeUrl()` export from `lib/duplicate.ts` that picks one canonical variant).
- Filter `validLinks` against the Set **and** dedupe within the batch itself (an import file can contain its own duplicates).
- Return `{ count, skipped }`; the import preview/result UI (`components/settings/import-preview.tsx`, data tab) shows "Imported N links, skipped M duplicates" via the existing Sonner toast.

## Explicit non-goals

- **No unique DB constraint.** Stored URLs are unnormalised, so a constraint would not catch variant duplicates and would break re-imports of historical data. The app-level check plus the existing `(user_id, url)` index is sufficient for a single-user tool; a write-write race losing to itself is acceptable.
- **No backfill/normalisation migration** of existing rows.
- **No query-param stripping** (utm etc.) — different params stay different links, per original spec.

## Tests

There is no test runner in the project today. Add `bun test` (zero-config, already on bun) for the **pure helper only** — `lib/duplicate.test.ts` covering `urlVariants()` / `normalizeUrl()`:

- trailing slash, `http`→`https`, host casing variants all produced
- query params and fragments preserved (no over-matching)
- non-URL input handled safely

The Supabase-dependent paths are verified manually:

- paste same URL twice → "Already saved on <date>" toast, no second row
- extension on an already-saved page → neutral "Already saved" toast
- MCP `save_link` with existing URL → informational text, not error
- import file containing existing + internally-duplicated URLs → correct skipped count
- same URL, different user → still saves (no cross-user leak; check runs with explicit `user_id` filter on the service-role paths)
