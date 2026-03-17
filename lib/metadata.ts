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

export async function fetchMetadata(
  url: string,
): Promise<{ title: string | null; description: string | null }> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "til.bar Bot" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { title: null, description: null };

    const html = await response.text();

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
