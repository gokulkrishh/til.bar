# CLAUDE.md

@AGENTS.md

**til.bar** — a "Today I Learned" application. Capture all your links in one place.

## Core Principles

- **Read project docs first**: Before answering ANY question about til.bar — even conceptual ones — read `PRODUCT.md` and `TECH.md`. Never assume architecture, auth model, or deployment from generic patterns. til.bar is a remote HTTP MCP server with per-user API key auth, not a local STDIO server.
- **Read library docs first**: Before implementing with any external library, read the official docs (via WebFetch). Never guess at APIs, type names, or method signatures — especially for AI SDK, Base UI, or any library with major version changes.
- **Supabase awareness**: Always consider RLS policies when touching Supabase queries. When caching data, ensure realtime updates still work correctly.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Code Conventions

- **Conditional classes**: Always use `cn()` from `@/lib/utils` with object syntax: `cn("static-classes", { "conditional-class": condition })`. Never use template literal ternaries.
- **Server actions**: Return `{ error: string }` for known errors, never throw. Use human-friendly messages, never expose raw DB errors.
- **Formatting**: Use `Intl.DateTimeFormat` / `Intl.NumberFormat` with `undefined` locale, not `toLocaleDateString`. Create formatter instances outside functions for reuse.
- **Toasts**: Use Sonner (`toast.success` / `toast.error`), not custom toast UI.
- **CSS units**: Prefer `rem` over `px` where possible. Use Tailwind spacing scale (`w-30`) instead of arbitrary values (`w-[120px]`).
- **Tailwind classes**: Prefer named utility classes over arbitrary values when an equivalent exists (e.g. `blur-xs` not `blur-[4px]`, `rounded-lg` not `rounded-[8px]`).
- **Base UI components**: shadcn uses `@base-ui/react`, NOT Radix. No `asChild` prop — use `render` prop or pass children directly. Triggers (Menu, Tooltip, Dialog) render their own element. Check `components/ui/*.tsx` for the actual API before using.
- **React event types**: Never use `React.FormEvent` (deprecated). Use `React.SyntheticEvent` for form submit handlers, `React.ChangeEvent` for input changes.

## Environment Variables

- **`env.example`** is the source of truth for which env vars are needed. Always keep it in sync.
- When adding or removing a variable in `.env.local`, update `env.example` in the same change (without real values).

## Tooling

- **Package manager**: Always use `bun` (never npm, yarn, or pnpm)
- **Icons**: Use `lucide-react` for all icons
