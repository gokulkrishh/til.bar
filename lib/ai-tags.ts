import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const tagSchema = z.object({
  tags: z
    .array(z.string())
    .describe("1-2 lowercase tags categorising this link"),
});

export async function generateTags(
  tilId: string,
  url: string,
  title: string | null,
  description: string | null,
  userId: string,
) {
  const supabase = await createClient();

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
- Maximum 2 tags per link.
- Tags must be lowercase, no spaces (use hyphens for multi-word tags).${existingList}`,
      prompt: parts.join("\n"),
    });

    if (!output?.tags?.length) return;

    // Upsert tags and link them
    for (const tagName of output.tags.slice(0, 2)) {
      const name = tagName.toLowerCase().trim();
      if (!name) continue;

      // Upsert the tag
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
        .select("id")
        .single();

      if (!tag) continue;

      // Link tag to til
      await supabase
        .from("til_tags")
        .upsert(
          { til_id: tilId, tag_id: tag.id },
          { onConflict: "til_id,tag_id" },
        )
        .select();
    }
  } catch (error) {
    console.error("AI tagging failed:", error);
  }
}
