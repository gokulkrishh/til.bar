import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMetadata } from "@/lib/metadata";
import { generateMetadata } from "@/lib/ai-metadata";
import { generateTags, loadExistingTagNames } from "@/lib/ai-tags";
import type { Til } from "@/lib/types";

const supabase = createAdminClient();

/**
 * Background pass for links saved by API key (/api/save, MCP save_link):
 * fetch the page, clean its metadata with AI, and tag it.
 *
 * The user's tag list loads alongside the page fetch, and the raw metadata
 * write, the AI cleanup and tagging all overlap. The AI write waits for the
 * raw one so the cleaned text always lands last.
 */
export async function enrichTil(til: Til, logPrefix: string) {
  const existingTagNames = loadExistingTagNames(supabase, til.user_id);
  const { title, description } = await fetchMetadata(til.url);

  // Builders run on each then(); wrap once so awaiting twice doesn't write twice.
  const rawWrite =
    title || description
      ? Promise.resolve(
          supabase.from("tils").update({ title, description }).eq("id", til.id),
        )
      : Promise.resolve(null);

  const [aiMeta, tags] = await Promise.allSettled([
    generateMetadata(til.url, title, description),
    generateTags({ ...til, title, description }, existingTagNames),
  ]);

  await rawWrite;

  if (aiMeta.status === "rejected") {
    console.error(`[${logPrefix}] AI metadata failed:`, aiMeta.reason);
  } else if (aiMeta.value) {
    await supabase
      .from("tils")
      .update({
        title: aiMeta.value.title,
        description: aiMeta.value.description,
      })
      .eq("id", til.id);
  }

  if (tags.status === "rejected") {
    console.error(`[${logPrefix}] Tag generation failed:`, tags.reason);
  }
}
