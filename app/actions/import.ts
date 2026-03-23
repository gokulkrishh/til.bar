"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportLink } from "@/lib/ai-import";
import { upsertTags } from "@/lib/tag-utils";

export async function confirmImport(links: ImportLink[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to import links" };
  }

  // Skip URLs too long for the btree index
  const validLinks = links.filter((link) => link.url.length <= 2048);

  const now = new Date().toISOString();
  const rows = validLinks.map((link) => ({
    user_id: user.id,
    url: link.url,
    title: link.title || null,
    description: link.description || null,
    created_at: link.created_at || now,
  }));

  if (!rows.length) {
    return { error: "No valid links to import" };
  }

  const { data: tils, error } = await supabase
    .from("tils")
    .insert(rows)
    .select();

  if (error) {
    return { error: "Couldn't import links. Check your file and try again." };
  }

  // Insert existing tags in the background
  const linksWithTags = validLinks.filter((l) => l.tags?.length);

  if (linksWithTags.length) {
    const userId = user.id;

    after(async () => {
      try {
        const admin = createAdminClient();

        for (const link of linksWithTags) {
          const til = tils.find((t) => t.url === link.url);
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
  return { count: tils.length };
}
