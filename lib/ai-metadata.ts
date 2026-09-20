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

const MIN_TITLE_CHARS = 10;
const MAX_TITLE_CHARS = 120;
const MIN_DESC_CHARS = 20;
const MAX_DESC_CHARS = 400;

/**
 * Titles naming an author or platform rather than the content — exactly what
 * the system prompt below exists to rewrite. A title matching one of these is
 * worth the model call even though it is otherwise well-formed.
 */
const PLATFORM_TITLE_RE =
  /\bon (X|Twitter|LinkedIn|Threads|Mastodon|Bluesky|Medium|Substack)\b|^r\/|^u\/|\| Hacker News|\bposted by\b|^[\w.-]+\.(com|org|net|io|dev)$/i;

/**
 * Whether the page's own metadata already describes its content well enough
 * to skip the cleanup call.
 *
 * The model costs 1.5-2.7s on every save and frequently just echoes good
 * input back. Screening obviously-fine metadata out first is the single
 * largest saving in the pipeline.
 */
function isContentShaped(
  title: string | null,
  description: string | null,
): boolean {
  if (!title || !description) return false;

  const t = title.trim();
  const d = description.trim();

  if (t.length < MIN_TITLE_CHARS || t.length > MAX_TITLE_CHARS) return false;
  if (d.length < MIN_DESC_CHARS || d.length > MAX_DESC_CHARS) return false;

  return !PLATFORM_TITLE_RE.test(t);
}

export async function generateMetadata(
  url: string,
  title: string | null,
  description: string | null,
): Promise<{ title: string; description: string } | null> {
  // Null means "keep what we have", which is exactly the right outcome here.
  if (isContentShaped(title, description)) return null;

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
