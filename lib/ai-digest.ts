import "server-only";

import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { DigestTil } from "@/emails/weekly-digest";

const synthesisSchema = z.object({
  themes: z
    .array(
      z.object({
        title: z
          .string()
          .describe(
            "Section header — short topic label, 2-4 words. Examples: 'Tech Stuff', 'Eye for Design', 'Architecture'.",
          ),
        items: z
          .array(
            z.object({
              sourceIndex: z
                .number()
                .int()
                .min(0)
                .describe("[N] index of the TIL from the saves list."),
              note: z
                .string()
                .describe(
                  "1-2 sentences on what this specific link offers — what's interesting, what stood out, what to expect. Specific to this link, not generic.",
                ),
            }),
          )
          .min(1)
          .max(4)
          .describe("1-4 link entries belonging to this section."),
      }),
    )
    .min(1)
    .max(4)
    .describe(
      "1-4 topic sections. Group related links together. Skip links that don't fit any section.",
    ),
  memoryLaneNote: z
    .string()
    .nullable()
    .describe(
      "ONE sentence naming a concrete connection between the archive link and this week's saves (same topic, problem, author, or evolution of an idea). Return null if there's no real connection — random pulls are worse than nothing.",
    ),
});

export type DigestSynthesisRaw = z.infer<typeof synthesisSchema>;

function formatTil(til: DigestTil, index?: number): string {
  const prefix = index !== undefined ? `[${index}] ${til.url}` : `- ${til.url}`;
  const parts = [prefix];
  if (til.title) parts.push(`  Title: ${til.title}`);
  if (til.description) parts.push(`  Description: ${til.description}`);
  if (til.tags?.length) {
    parts.push(`  Tags: ${til.tags.map((t) => t.name).join(", ")}`);
  }
  return parts.join("\n");
}

export async function generateDigestSynthesis({
  tils,
  archiveTil,
}: {
  tils: DigestTil[];
  archiveTil: DigestTil | null;
}): Promise<DigestSynthesisRaw | null> {
  if (tils.length === 0) return null;

  const thisWeek = tils.map((til, i) => formatTil(til, i)).join("\n");
  const archiveSection = archiveTil
    ? `\n\nArchive link (saved ${archiveTil.created_at.slice(0, 10)}):\n${formatTil(archiveTil)}`
    : "";

  try {
    const { output } = await generateText({
      model: openrouter("google/gemini-3.1-flash-lite-preview"),
      output: Output.object({ schema: synthesisSchema }),
      system: `You are curating a weekly reading email for a user of til.bar — a personal "Today I Learned" tool. Model the format on Labnotes' Weekend Reading: topic-grouped sections, with each link getting its own short note. The email is sent ONLY if the output is genuinely useful — otherwise the user reads nothing. Be ruthless about quality.

Sections (1-4):
- Each section is a topic the user explored. Group related saves together.
- Title: 2-4 words, descriptive of the topic ("Tech Stuff", "Architecture", "AI Workflows", "Indian Modernism" — be specific).
- Items: 1-4 links per section. Skip links that don't fit any section — not every link needs to be represented. Better to omit than to dilute.

Per-link note:
- 1-2 sentences specific to THAT link. What's interesting? What stood out? What does the user get by clicking?
- Reference the actual content/topic. "A workshop on multi-step Claude Code workflows" beats "A useful tutorial".
- Skip the obvious ("This article is about X"). Lead with insight, hook, or context.
- Second person, conversational. No fluff. No emojis. No markdown.

Memory lane note:
- ONLY if the archive link genuinely connects to this week's saves — same topic, problem, author, or evolution of an idea.
- One sentence naming the connection: "Echoes [specific thing]" / "Same problem as your [topic] saves".
- If no real connection exists, return null.`,
      prompt: `This week's saves (numbered):\n${thisWeek}${archiveSection}`,
    });

    if (!output?.themes?.length) return null;
    return output;
  } catch (error) {
    console.error("[ai-digest] Failed:", error);
    return null;
  }
}
