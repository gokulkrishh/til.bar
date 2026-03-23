import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Til } from "@/lib/types";
import { upsertTags } from "@/lib/tag-utils";

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
      model: openrouter("google/gemini-3.1-flash-lite-preview"),
      output: Output.object({ schema: tagSchema }),
      system: `You are a link categorisation engine. Output ONLY a JSON array of 1-2 lowercase tag strings. No explanation, no markdown.

      Rules (in priority order):
1. If an existing tag accurately describes this link, use it. Only create a new tag when no existing tag fits well.
2. Use exactly 1 tag. Use 2 only when the link clearly spans two distinct categories.
3. Tags must be specific and descriptive: "react", "css", "rust", "ai", "design", "youtube".
4. Derive tags from the title and description first; fall back to the URL domain.
5. Multi-word tags use hyphens: "open-source", "web-perf".
6. All tags lowercase, no spaces.

<existing_tags>
${existingList}
</existing_tags>

Output format: ["tag"] or ["tag1", "tag2"]`,
      prompt: parts.join("\n"),
    });

    if (!output?.tags?.length) return;

    await upsertTags(supabase, userId, tilId, output.tags);
  } catch (error) {
    console.error("[ai-tags] Failed:", error);
  }
}
