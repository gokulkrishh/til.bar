import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

const metadataSchema = z.object({
  quality: z
    .enum(["good", "bad"])
    .describe(
      "Whether the existing title and description are good enough to describe the content",
    ),
  title: z.string().describe("A concise, descriptive title for the link"),
  description: z
    .string()
    .describe("A brief 1-sentence description of what the link is about"),
});

export async function generateMetadata(
  url: string,
  title: string | null,
  description: string | null,
): Promise<{ title: string; description: string } | null> {
  try {
    const parts = [`URL: ${url}`];
    if (title) parts.push(`Title: ${title}`);
    if (description) parts.push(`Description: ${description}`);

    const { output } = await generateText({
      model: openrouter("google/gemini-2.5-flash-lite"),
      output: Output.object({ schema: metadataSchema }),
      system: `You evaluate web link metadata and improve it if needed.

First, judge whether the existing title and description are "good" or "bad":
- "good" = title clearly describes the CONTENT of the link (what it's about, what it does, what it teaches).
- "bad" = title is generic, just a username/platform name, missing, or doesn't describe the content. Examples: "Chris Tate (@ctatedev) on X", "John on Instagram", "r/programming", "Post by someone".

If quality is "good", still return the original title and description as-is.
If quality is "bad", generate improved versions:
- Title should describe the CONTENT, not the author or platform.
- Title must be SHORT — max 50 characters. Be concise, not verbose.
- Description should be 1 sentence summarizing the key point, max 160 characters.
- Infer content from the URL path, slug, or any available metadata.
- If there's truly not enough info, use "[Author] post on [Platform]" as last resort.
- Do NOT include hashtags or @ mentions in the title.`,
      prompt: parts.join("\n"),
    });

    if (!output || output.quality === "good") return null;

    return {
      title: output.title,
      description: output.description,
    };
  } catch (error) {
    console.error("[ai-metadata] Failed:", error);
    return null;
  }
}
