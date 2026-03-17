export type ImportLink = {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  created_at?: string;
};

export const IMPORT_PROMPT = `Convert my bookmarks data into this exact JSON format. Output ONLY valid JSON, no explanation.

Required format — a JSON array of objects:
[
  {
    "url": "https://example.com",
    "title": "Page title",
    "description": "Brief description",
    "tags": ["tag1", "tag2"],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]

Rules:
1. "url" (required) — the full URL of the bookmark
2. "title" (required) — use the existing title if it clearly describes the content AND is under 50 chars with no emojis, Unicode, hashtags, or @ mentions. Otherwise improve it to meet those rules. Never fabricate if there's no basis to infer content.
3. "description" (optional) — preserve if available, omit the field entirely if not.
4. "tags" (required) — 1 or 2 tags max. Lowercase, hyphens for multi-word (e.g. "open-source"). Tag the TOPIC or CATEGORY of the content, not the platform or author. Prefer specific over generic — "react-hooks" over "javascript", "llm-inference" over "ai".
5. "created_at" (required) — ISO 8601 date string, preserve original date if available. If missing, use today's date.

Paste your bookmarks data below this line, then send to any AI:
---
`;

export function parseImportJson(
  content: string,
): { data: ImportLink[]; error?: never } | { error: string; data?: never } {
  try {
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed) ? parsed : null;
    if (!items?.length || !items[0]?.url) {
      return {
        error: 'Make sure your JSON has a "url" field.',
      };
    }

    const links: ImportLink[] = items
      .filter((item: Record<string, unknown>) => typeof item.url === "string")
      .filter((l) => l.url.length <= 2048)
      .map((item: Record<string, unknown>) => ({
        url: item.url as string,
        ...(item.title ? { title: item.title as string } : {}),
        ...(item.description
          ? { description: item.description as string }
          : {}),
        ...(item.created_at ? { created_at: item.created_at as string } : {}),
        ...(Array.isArray(item.tags) && item.tags.length
          ? {
              tags: item.tags.map((t: Record<string, unknown>) =>
                typeof t === "string" ? t : (t.name as string),
              ),
            }
          : {}),
      }));

    if (!links.length) {
      return { error: "No valid links found in the file" };
    }

    return { data: links };
  } catch {
    return {
      error:
        "Invalid JSON file. Use the prompt above with any AI to convert your data first.",
    };
  }
}
