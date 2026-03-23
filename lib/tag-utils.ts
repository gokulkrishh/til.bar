import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const MAX_TAGS_PER_LINK = 2;

export async function upsertTags(
  supabase: SupabaseClient<Database>,
  userId: string,
  tilId: string,
  tags: string[],
) {
  for (const tagName of tags.slice(0, MAX_TAGS_PER_LINK)) {
    const name = tagName.toLowerCase().trim();
    if (!name) continue;

    const { data: tag } = await supabase
      .from("tags")
      .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
      .select("id")
      .single();

    if (!tag) continue;

    await supabase
      .from("til_tags")
      .upsert(
        { til_id: tilId, tag_id: tag.id },
        { onConflict: "til_id,tag_id" },
      );
  }
}

export async function getTilIdsByTag(
  supabase: SupabaseClient<Database>,
  userId: string,
  tag: string,
): Promise<string[] | null> {
  const { data } = await supabase
    .from("til_tags")
    .select("til_id, tags!inner(name, user_id)")
    .eq("tags.user_id", userId)
    .eq("tags.name", tag);

  const tilIds = data?.map((r) => r.til_id) ?? [];
  return tilIds.length ? tilIds : null;
}
