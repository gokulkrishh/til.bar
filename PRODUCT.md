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

Pasting anywhere on the page triggers capture. Only URLs are supported for now. The page title and description are auto-fetched and saved alongside the URL. If the fetch fails, the URL is saved as-is. Every paste creates a new entry. No edit mode after capture.

---

## AI Categorisation

🚧 **Planned.** After an entry is saved, the AI assigns up to 2 tags asynchronously — capture never waits on this. Prefers reusing existing tags over creating new ones. Duplicate URLs get a "duplicate" tag. Tags are not editable.

---

## Search

🚧 **Planned.** Full-text search across saved links (title, description, URL). Will also be exposed as a `search_links` MCP tool.

---

## Views

### Main Page

**This Week** — TILs from the current calendar week, grouped by day, most recent first. Each entry shows the unfurled title, description, URL, and tags.

**More** — monthly TIL counts (e.g., "March: 23 TILs"), each expandable to show that month's full list.

Both views are filterable by tag.

### Settings Modal

**Account** — Google account name, email, and avatar.

**Appearance** — Theme toggle (system, light, dark). Sound effects toggle (plays audio on actions like delete, copy, capture).

**MCP** — Setup instructions, server URL with copy button, API key management (create/regenerate), and list of available tools.

**Data control** — Export all TILs as JSON. Delete account (with confirmation) removes all TILs, tags, and the account record.

---

## TIL Item Context Menu

Each TIL item has a context menu with: **Delete**, **Add to Chat**, **Refresh metadata**, and **Copy URL**.

---

## AI Chat

Chat with saved URLs as attachments (added via "Add to Chat" in the context menu). Useful for summarising, asking questions, or extracting key points. Uses AI SDK with OpenRouter for model access.

---

## MCP Server

Remote HTTP MCP server at `https://til.bar/api/mcp` for connecting AI assistants like Claude or ChatGPT.

**Authentication:** API key (`mcp_sk_` prefix, SHA-256 hashed) via `?api_key=` query param or `Authorization: Bearer` header. Falls back to Supabase session for browser users. One key per user, managed in Settings → MCP.

**Tools:**

- `save_link` — Save a URL with auto-fetched metadata
- `list_links` — List all saved links
- `get_link` — Get a saved link by ID
- `update_link` — Update title or description
- `delete_link` — Delete a saved link
- `search_links` — 🚧 Planned. Search across saved links

---

## PWA

Installable as a Progressive Web App. Service worker caches assets (cache-first) and navigation (network-first). Web manifest with standalone display mode.

---

## Design Principles

**Capture is the product.** Optimise for the 10-second paste, not for browsing.

**This week only on the main page.** Older content lives in the monthly archive, navigated by tag.

**Tags converge, not sprawl.** Reuse over invention keeps the tag space useful.

**When in doubt, remove it.** The product succeeds if you use it daily.
