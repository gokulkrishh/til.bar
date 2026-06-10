"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportLink } from "@/lib/ai-import";
import { upsertTags } from "@/lib/tag-utils";
import { normalizeUrl } from "@/lib/duplicate";

export async function confirmImport(links: ImportLink[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to import links" };
  }

  // Skip URLs too long for the btree index
  const fittingLinks = links.filter((link) => link.url.length <= 2048);

  const { data: existingUrls } = await supabase
    .from("tils")
    .select("url")
    .eq("user_id", user.id);

  // Skip already-saved URLs and duplicates within the file itself
  const seen = new Set(
    (existingUrls ?? []).map((row) => normalizeUrl(row.url)),
  );
  const validLinks: ImportLink[] = [];
  let skipped = 0;

  for (const link of fittingLinks) {
    const key = normalizeUrl(link.url);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    validLinks.push(link);
  }

  const now = new Date().toISOString();
  const rows = validLinks.map((link) => ({
    user_id: user.id,
    url: link.url,
    title: link.title || null,
    description: link.description || null,
    created_at: link.created_at || now,
  }));

  if (!rows.length) {
    if (skipped) {
      return { count: 0, skipped };
    }
    return { error: "No valid links to import" };
  }

  const { data: tils, error } = await supabase
    .from("tils")
    .insert(rows)
    .select();

  if (error) {
    return { error: "Couldn't import links. Check your file and try again." };
  }

  // Insert existing tags in the background (use index-based matching
  // since Supabase preserves array order in returned data)
  const linksWithTagIndexes = validLinks.reduce<number[]>((acc, link, i) => {
    if (link.tags?.length) acc.push(i);
    return acc;
  }, []);

  if (linksWithTagIndexes.length) {
    const userId = user.id;

    after(async () => {
      try {
        const admin = createAdminClient();

        for (const i of linksWithTagIndexes) {
          const link = validLinks[i];
          const til = tils[i];
          if (!til || !link.tags) continue;

          await upsertTags(admin, userId, til.id, link.tags);
        }
      } catch (err) {
        console.error("[import] Tag import failed:", err);
      } finally {
        revalidatePath("/");
      }
    });
  }

  revalidatePath("/");
  return { count: tils.length, skipped };
}
