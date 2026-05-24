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
      model: openrouter("anthropic/claude-haiku-4-5"),
      output: Output.object({ schema: metadataSchema }),
      system: `You clean and improve web link metadata.
Rules:
- Title: max 50 chars, no emojis, no Unicode, no hashtags, no @ mentions
- Title must describe the CONTENT (what it's about, what it does, what it teaches)
- NOT the author or platform — never "John Doe on X" or "r/programming"
- Description: 1 sentence, max 120 chars, key point only
- If truly no info: "[Author] post on [Platform]"
- Infer from URL slug/path when metadata is missing
- Never invent facts. If you cannot derive the title from the URL or provided metadata, set quality="good" and echo back the input title/description unchanged.`,
      prompt: parts.join("\n"),
    });

    if (!output) return null;

    // If AI judged the existing metadata good enough, keep it.
    if (output.quality === "good" && title && description) return null;

    return {
      title: output.title,
      description: output.description,
    };
  } catch (error) {
    console.error("[ai-metadata] Failed:", error);
    return null;
  }
}
