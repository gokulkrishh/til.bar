import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type DuplicateCheck =
  | { duplicate: true; id: string; url: string; created_at: string }
  | { duplicate: false };

const savedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function alreadySavedMessage(createdAt: string): string {
  return `Already saved on ${savedDateFormatter.format(new Date(createdAt))}`;
}

function parseHttpUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

// Stored URLs are raw (never normalised), so a duplicate check must match
// against every form the same link could have been saved as.
export function urlVariants(url: string): string[] {
  const variants = new Set([url]);
  const parsed = parseHttpUrl(url);
  if (!parsed) return [...variants];

  const { host, pathname, search, hash } = parsed;
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const withoutSlash = pathname === "/" ? "" : pathname.replace(/\/$/, "");

  for (const scheme of ["https:", "http:"]) {
    for (const path of [withSlash, withoutSlash]) {
      variants.add(`${scheme}//${host}${path}${search}${hash}`);
    }
  }

  return [...variants];
}

export function normalizeUrl(url: string): string {
  const parsed = parseHttpUrl(url);
  if (!parsed) return url;

  const path =
    parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
  return `https://${parsed.host}${path}${parsed.search}${parsed.hash}`;
}

export async function checkDuplicateUrl(
  supabase: SupabaseClient<Database>,
  userId: string,
  url: string,
): Promise<DuplicateCheck> {
  // Fail open on query errors — never block a capture on the dup check
  const { data } = await supabase
    .from("tils")
    .select("id, url, created_at")
    .eq("user_id", userId)
    .in("url", urlVariants(url))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return { duplicate: false };

  return {
    duplicate: true,
    id: data.id,
    url: data.url,
    created_at: data.created_at,
  };
}
