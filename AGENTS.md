<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Use bun (`bun install`, `bun dev`). The environment start script serves the app on port 3000.
- Local Supabase (native runtime, no Docker) is started outside this repo at `~/.local/share/til-bar-supabase`, and `.env.local` is generated from it. Use that database. The hosted `til.bar` Supabase project is production data.
- `supabase/migrations/00001_initial_schema.sql` drops triggers on `public.profiles` and `public.tils` before those tables exist, so a fresh local database rejects it. The start script copies migrations and makes those drops conditional. Do not run `supabase start` in `/workspace` against an empty database until that cleanup is safe.
- Google is the only sign-in in the UI and is not configured on the local stack. To save a link, create a user with the Auth admin API and `POST /api/save` with that user's access token.
- `bunx tsc --noEmit` and `bun run build` succeed. `bun run lint` fails in this repo: `@typescript-eslint` throws `Cannot read properties of undefined (reading 'Cjs')` with TypeScript 7.
