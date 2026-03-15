# til.bar — Product Specification

**til.bar** is a "Today I Learned" tool. The goal is a focused, minimal knowledge capture habit — not a note-taking app, not a second brain, not a SaaS product. It is built to be used daily.

**Domain:** [til.bar](https://til.bar)
**Audience:** Single user (personal tool)
**Auth:** Google login via Supabase

---

## The Core Loop

Paste a URL → it's saved with a timestamp → AI tags it → appears in this week's list.

---

## Capture

Pasting anywhere on the page triggers capture in desktop. On mobile, a fixed input at the bottom provides a tap target for pasting or typing URLs. Only URLs are supported for now. The page title, description, and AI-generated tags are fetched/generated in the background via Next.js `after()` callback — the response is sent immediately and metadata work happens post-response. If the fetch fails, the URL is saved as-is. Every paste creates a new entry. No edit mode after capture. Capture is optimistic — a pending item appears immediately while the server action runs. A drop sound and success haptic fire on capture.

---

## AI Categorisation

After an entry is saved, the AI assigns up to 2 tags asynchronously via OpenRouter (Gemini 2.5 Flash Lite) — capture never waits on this. Prefers reusing existing tags over creating new ones. Tags are lowercase, displayed as pills on each item. Tags are not editable.

---

## Search

Client-side search via search icon in the header (or `Cmd+K` / `Ctrl+K`). Filters by title, URL, and description. Combined with tag filtering for narrowing results. Also available as the `search_links` MCP tool for AI assistants.

---

## Views

### Main Page

**This Week** — TILs from the current calendar week, grouped by day, most recent first. Each entry shows the unfurled title, description, URL, and tags.

**More** — monthly TIL counts (e.g., "March: 23 TILs"), each expandable to show that month's full list.

Both views are filterable by tag.

### Settings Modal

**Account** — Google account name, email, and avatar.

**Appearance** — Theme toggle (system, light, dark). Sound effects toggle (drop on capture, click on copy, error on delete). Haptic feedback toggle (success on capture, light on copy/theme change, heavy on delete). Both default to on.

**MCP** — Setup instructions, server URL with copy button, API key management (create/regenerate), and list of available tools.

**Data control** — Export all TILs as JSON. Delete account (with confirmation) removes all TILs, tags, and the account record.

---

## TIL Item Context Menu

Each TIL item has a context menu with: **Ask AI**, **Copy link**, and **Delete**.

---

## AI Chat

Chat with saved URLs as context. Click "Ask AI" on any TIL to attach it, then ask questions. Multiple links can be attached at once. Suggestion prompts ("Summarize", "Key takeaways", "Explain this, I'm new to this") appear before the first message for quick starts. Uses OpenRouter (Gemini 2.5 Flash Lite) for streaming responses. AI responses rendered with Streamdown for markdown and Shiki for syntax-highlighted code blocks. Chat can be minimized or closed. Session-only — no conversation history stored.

---

## MCP Server

Remote HTTP MCP server at `https://til.bar/api/mcp` for connecting AI assistants like Claude or ChatGPT.

**Authentication:** API key (`mcp_sk_` prefix, SHA-256 hashed) via `?api_key=` query param or `Authorization: Bearer` header. Falls back to Supabase session for browser users. One key per user, managed in Settings → MCP.

**Tools:**

- `save_link` — Save a URL with auto-fetched metadata
- `list_links` — List all saved links
- `search_links` — Search links by keyword
- `get_link` — Get a saved link by ID
- `update_link` — Update title or description
- `delete_link` — Delete a saved link

---

## PWA

Installable as a Progressive Web App. Service worker caches assets (cache-first) and navigation (network-first). Web manifest with standalone display mode. Supports the Web Share Target API — when installed, users can share URLs from other apps directly into til.bar.

---

## Design Principles

**Capture is the product.** Optimise for the 10-second paste, not for browsing.

**This week only on the main page.** Older content lives in the monthly archive, navigated by tag.

**Tags converge, not sprawl.** Reuse over invention keeps the tag space useful.

**When in doubt, remove it.** The product succeeds if you use it daily.
