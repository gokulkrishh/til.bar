# til.bar

A "Today I Learned" tool for capturing links in one place. Paste a URL, it's saved with a timestamp, AI tags it, and it appears in your weekly list.

**Live:** [til.bar](https://til.bar)

## Features

- **Quick capture** — paste a URL anywhere on the page, metadata is fetched automatically
- **AI tagging** — up to 2 tags assigned per link via Gemini 2.5 Flash Lite
- **AI chat** — ask questions about your saved links with streaming responses
- **Search** — filter by title, URL, description, or tags (`Cmd+K` / `Ctrl+K`)
- **MCP server** — remote HTTP MCP server at `til.bar/api/mcp` for AI assistants (Claude, ChatGPT, etc.)
- **Chrome extension** — save the current tab URL directly from the browser
- **iOS Shortcut** — save links via the share sheet
- **PWA** — installable with offline support and share target API
- **Import/Export** — export all links as JSON, import with AI-assisted format conversion

## Tech Stack

Next.js 16 · TypeScript · React 19 · Tailwind CSS 4 · Supabase · AI SDK · Motion · Base UI

## Getting Started

```bash
# Install dependencies
bun install

# Copy environment variables
cp env.example .env.local

# Start dev server
bun dev
```

Open [localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See [`env.example`](env.example) for all required variables:

- **Supabase** — database and auth
- **OpenRouter** — AI tagging and chat

## MCP Server

Connect AI assistants to your saved links via the remote MCP server.

**Endpoint:** `https://til.bar/api/mcp`

**Auth:** API key (managed in Settings → MCP) via `?api_key=` query param or `Authorization: Bearer` header.

**Tools:** `save_link`, `list_links`, `search_links`, `get_link`, `update_link`, `delete_link`

## License

Private
