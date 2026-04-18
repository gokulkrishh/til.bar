Feature: Duplicate Detection
Goal: Prevent duplicate URLs from being saved across all input methods. Inform the user instead of silently failing or saving again.

## Where to implement

Save logic is split across 3 entry points. Add a shared `checkDuplicateUrl(supabase, userId, url)` helper in `lib/duplicate.ts` and call it from each:

1. **Web app** — `app/actions/tils.ts` → `createTil()` (line 81)
2. **Chrome extension / API** — `app/api/save/route.ts` → `POST` handler (line 32)
3. **MCP** — `app/api/mcp/route.ts` → `save_link` tool (line 199)

## Shared helper: `lib/duplicate.ts`

```ts
// Query tils table for existing URL + user_id match
// Returns { duplicate: true, id, url, created_at } or { duplicate: false }
// Normalise URL before check (see edge cases below)
```

## Implementation per entry point

### 1. `app/actions/tils.ts` — `createTil()`

- Call `checkDuplicateUrl()` after auth check, before `.insert()`
- On duplicate: return `{ error: "Already saved on [date]", id, url }`

### 2. `context/capture-provider.tsx` — UI handling

- Currently shows `toast.success("Link saved")` optimistically (line 92), then calls `createTil`
- On duplicate error: call `toast.error("Already saved on [date]")` with a link to the existing entry
- Remove the optimistic pending til on duplicate

### 3. `app/api/save/route.ts` — Chrome extension

- Call `checkDuplicateUrl()` after auth check (line 44), before `.insert()`
- On duplicate: return `Response.json({ error: "Already saved", id, saved_at }, { status: 409 })`

### 4. `extension/background.js` — Chrome extension UI

- Handle 409 response and show "Already saved" in extension popup

### 5. `app/api/mcp/route.ts` — MCP `save_link` tool

- Call `checkDuplicateUrl()` inside `save_link` handler (line 199), before `.insert()`
- On duplicate: return `mcpText("Already saved on [date] — [url]")`

## URL normalisation (in shared helper)

- Strip trailing slash before check
- Normalise `http://` to `https://`
- Same URL with different query params → treat as different links (don't over-match)

## DB

No schema changes needed. Query existing `tils` table on `url` + `user_id`.

## Tests

- Duplicate URL returns correct error shape from `createTil()`
- Different user, same URL → should save (no cross-user leak)
- Trailing slash normalisation works correctly
- `http` → `https` normalisation works correctly
- API route returns 409 with correct body on duplicate
- MCP tool returns "Already saved" text on duplicate
