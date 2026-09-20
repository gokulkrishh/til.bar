const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&nbsp;": " ",
};

const ENTITY_RE = /&(?:#x[\da-fA-F]+|#\d+|\w+);/g;

function decodeEntities(text: string): string {
  return text.replace(ENTITY_RE, (entity) => {
    if (HTML_ENTITIES[entity]) return HTML_ENTITIES[entity];
    // Numeric entities: &#123; or &#x1A;
    if (entity.startsWith("&#x")) {
      return String.fromCodePoint(parseInt(entity.slice(3, -1), 16));
    }
    if (entity.startsWith("&#")) {
      return String.fromCodePoint(parseInt(entity.slice(2, -1), 10));
    }
    return entity;
  });
}

// Match content="..." or content='...' in either attribute order
function matchMeta(html: string, attr: string, value: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${value}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
}

const FETCH_TIMEOUT_MS = 5000;

/**
 * Stop reading once the head is in hand. Pages routinely run to hundreds of
 * KB while `</head>` closes within the first few — react.dev ships 318KB and
 * closes its head at byte 5,590 — so reading the whole body is almost all
 * waste.
 */
const MAX_HEAD_CHARS = 64 * 1024;

async function readHead(response: Response): Promise<string> {
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";

  try {
    while (html.length < MAX_HEAD_CHARS) {
      const { done, value } = await reader.read();
      if (done) break;

      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
  } finally {
    // Aborts the rest of the transfer rather than draining it.
    await reader.cancel().catch(() => {});
  }

  return html;
}

/**
 * Give the page this long to answer before the save proceeds without it.
 *
 * A save must not be hostage to how slow someone else's server is. Pages that
 * answer inside the deadline get folded into the insert; the rest are filled
 * in by the background pass.
 */
export const INLINE_METADATA_DEADLINE_MS = 400;

/**
 * `fetchMetadata` capped at {@link INLINE_METADATA_DEADLINE_MS}.
 *
 * Resolves null when the page is too slow — the fetch itself keeps running so
 * the background pass can still use it.
 */
export function fetchMetadataWithin(
  url: string,
  deadlineMs = INLINE_METADATA_DEADLINE_MS,
): Promise<{ title: string | null; description: string | null } | null> {
  return Promise.race([
    fetchMetadata(url),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), deadlineMs)),
  ]);
}

export async function fetchMetadata(
  url: string,
): Promise<{ title: string | null; description: string | null }> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "til.bar Bot" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return { title: null, description: null };

    // Without this a saved PDF or video is buffered into a string in full.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      await response.body?.cancel().catch(() => {});
      return { title: null, description: null };
    }

    const html = await readHead(response);

    const title =
      matchMeta(html, "property", "og:title") ??
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ??
      null;

    const description =
      matchMeta(html, "property", "og:description") ??
      matchMeta(html, "name", "description");

    return {
      title: title ? decodeEntities(title) : null,
      description,
    };
  } catch {
    return { title: null, description: null };
  }
}
