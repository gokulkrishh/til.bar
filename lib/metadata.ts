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

    const titleMatch =
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/) ??
      html.match(/<title[^>]*>([^<]*)<\/title>/);

    const descMatch =
      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/) ??
      html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/);

    return {
      title: titleMatch?.[1]?.trim() ?? null,
      description: descMatch?.[1]?.trim() ?? null,
    };
  } catch {
    return { title: null, description: null };
  }
}
