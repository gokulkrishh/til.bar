# CLAUDE.md

@AGENTS.md

**til.bar** — a "Today I Learned" application. Capture all your links in one place.

## Project Stack

- This is a TypeScript/Next.js project ecosystem. Always prefer TypeScript over JavaScript. Use modern Next.js patterns (App Router, Server Components) unless told otherwise.

## Core Principles

- **Read project docs first**: Before answering ANY question about til.bar — even conceptual ones — read `PRODUCT.md` and `TECH.md`. Never assume architecture, auth model, or deployment from generic patterns. til.bar is a remote HTTP MCP server with per-user API key auth, not a local STDIO server.
- **Read library docs first**: Before implementing with any external library, read the official docs (via WebFetch). Never guess at APIs, type names, or method signatures — especially for AI SDK, Base UI, or any library with major version changes.
- **Supabase awareness**: Always consider RLS policies when touching Supabase queries. When caching data, ensure realtime updates still work correctly.

## Workflow Rules

- When a CSS/UI fix doesn't work after 2 attempts, stop and ask the user for more context or a reference example rather than cycling through approaches.
- Do not fetch external URLs or go off-task when the user asks for a code change. Make the edit directly unless explicitly asked to research first.
- Read the full file before editing. Plan all changes, then make ONE complete edit. If you've edited a file 3+ times, stop and re-read the user's requirements.
- Double-check your output before presenting it. Verify that your changes actually address what the user asked for.
- Re-read the user's last message before responding. Follow through on every instruction completely.
- When the user corrects you, stop and re-read their message. Quote back what they asked for and confirm before proceeding.
- Every few turns, re-read the original request to make sure you haven't drifted from the goal.
- After 2 consecutive tool failures, stop and change your approach entirely. Explain what failed and try a different strategy.
- When stuck, summarize what you've tried and ask the user for guidance instead of retrying the same approach.

## Debugging

- When debugging API/auth issues, verify the actual root cause with a test request before suggesting fixes. Don't keep suggesting the same hypothesis after it's been ruled out.

## Code Conventions

- **Conditional classes**: Always use `cn()` from `@/lib/utils` with object syntax: `cn("static-classes", { "conditional-class": condition })`. Never use template literal ternaries.
- **Server actions**: Return `{ error: string }` for known errors, never throw. Use human-friendly messages, never expose raw DB errors.
- **Formatting**: Use `Intl.DateTimeFormat` / `Intl.NumberFormat` with `"en-US"` locale (never `undefined`), not `toLocaleDateString`. Create formatter instances outside functions for reuse. Do not change an existing hardcoded locale to `undefined` when adding new formatters alongside it.
- **Toasts**: Use Sonner (`toast.success` / `toast.error`), not custom toast UI.
- **CSS units**: Prefer `rem` over `px` where possible. Use Tailwind spacing scale (`w-30`) instead of arbitrary values (`w-[120px]`).
- **Tailwind classes**: Prefer named utility classes over arbitrary values when an equivalent exists (e.g. `blur-xs` not `blur-[4px]`, `rounded-lg` not `rounded-[8px]`).
- **Base UI components**: shadcn uses `@base-ui/react`, NOT Radix. No `asChild` prop — use `render` prop or pass children directly. Triggers (Menu, Tooltip, Dialog) render their own element. Check `components/ui/*.tsx` for the actual API before using.
- **React event types**: Never use `React.FormEvent` (deprecated). Use `React.SyntheticEvent` for form submit handlers, `React.ChangeEvent` for input changes.

## Environment Variables

- **`env.example`** is the source of truth for which env vars are needed. Always keep it in sync.
- When adding or removing a variable in `.env.local`, update `env.example` in the same change (without real values).

## Chrome Extension

- Located in `extension/` folder — plain JS (no build step), MV3 service worker
- Auth via API key (`mcp_sk_*`) stored in `chrome.storage.local` — no OAuth/JWT refresh needed
- Options page (`options.html` + `options.js`) for API key setup
- `background.js` handles save via `POST /api/save` with `Authorization: Bearer <api_key>`

## Tooling

- **Package manager**: Always use `bun` (never npm, yarn, or pnpm)
- **Icons**: Use `lucide-react` for all icons
