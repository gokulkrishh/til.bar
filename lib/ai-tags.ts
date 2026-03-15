import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Til } from "@/lib/types";

const tagSchema = z.object({
  tags: z
    .array(z.string())
    .describe("1-2 lowercase tags categorising this link"),
});

export async function generateTags(til: Til) {
  const { id: tilId, url, title, description, user_id: userId } = til;
  const supabase = createAdminClient();

  // Fetch existing tags for reuse preference
  const { data: existingTags } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", userId);

  const existingTagNames = existingTags?.map((t) => t.name) ?? [];

  const parts = [`URL: ${url}`];
  if (title) parts.push(`Title: ${title}`);
  if (description) parts.push(`Description: ${description}`);

  const existingList =
    existingTagNames.length > 0
      ? `\nExisting tags: ${existingTagNames.join(", ")}`
      : "";

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-2.5-flash-lite"),
      output: Output.object({ schema: tagSchema }),
      system: `You categorise web links with 1-2 short, lowercase tags.
Rules:
- Prefer reusing existing tags over creating new ones.
- Tags should be specific and descriptive (e.g. "react", "css", "rust", "ai", "design").
- Maximum 1 tags per link, only in exceptional cases use 1 extra tag.
- Tags must be lowercase, no spaces (use hyphens for multi-word tags).${existingList}`,
      prompt: parts.join("\n"),
    });

    if (!output?.tags?.length) return;

    for (const tagName of output.tags.slice(0, 2)) {
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
        )
        .select();
    }
  } catch (error) {
    console.error("[ai-tags] Failed:", error);
  }
}
