import { generateText, Output } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { askJev, JEV_MAX_CHOICES } from "@/lib/jev";
import type { Til } from "@/lib/types";
import { upsertTags } from "@/lib/tag-utils";

const tagSchema = z.object({
  tags: z
    .array(z.string())
    .describe("1-2 lowercase tags categorising this link"),
});

/** Option Jev picks when no existing tag fits; never a valid user tag name. */
const NO_FIT = "__no_fit__";

/** Below this, Jev's pick is treated as a miss and we fall back to Gemini. */
const MIN_CHOICE_CONFIDENCE = 0.55;

/** Above this, the link is considered to span two distinct categories. */
const MIN_SPANS_TWO = 0.6;

/** A runner-up tag needs at least this share of the distribution to be used. */
const MIN_RUNNER_UP = 0.15;

function buildState({ url, title, description }: Til): string {
  const parts = [`URL: ${url}`];
  if (title) parts.push(`Title: ${title}`);
  if (description) parts.push(`Description: ${description}`);
  return parts.join("\n");
}

/**
 * Fast path: have Jev pick from tags the user already has.
 *
 * Jev returns a typed choice and never invents text, so this can only reuse an
 * existing tag. Returns `null` when nothing fits, which is the caller's signal
 * to fall back to a generative model that can mint a new tag.
 */
async function pickExistingTags(
  state: string,
  existingTagNames: string[],
): Promise<string[] | null> {
  if (existingTagNames.length === 0) return null;

  const criteria: Record<string, string> = {
    [NO_FIT]: "None of the other tags accurately describe this link",
  };
  for (const name of existingTagNames.slice(0, JEV_MAX_CHOICES - 1)) {
    criteria[name] = `This link is primarily about ${name}`;
  }

  const answers = await askJev({
    state,
    questions: {
      tag: {
        type: "choice",
        instructions:
          "Which of these existing tags best categorises this link? Choose based on the title and description first, falling back to the URL domain.",
        criteria,
      },
      spansTwo: {
        type: "noul",
        instructions:
          "Does this link clearly span two distinct categories, warranting a second tag?",
      },
    },
  });

  if (!answers) return null;

  const { tag, spansTwo } = answers;

  const ranked = Object.entries(tag.probabilities)
    .filter(([name]) => name !== NO_FIT)
    .sort(([, a], [, b]) => b - a);
  const first = ranked.at(0);
  const second = ranked.at(1);

  const decide = (): { tags: string[] | null; reason: string } => {
    if (tag.choice === NO_FIT) {
      return { tags: null, reason: "no existing tag fits" };
    }

    // A link that genuinely spans two categories splits the distribution,
    // which drags `confidence` down. Check for that before treating low
    // confidence as a miss, otherwise two-tag links always fall to Gemini.
    if (
      spansTwo.noul >= MIN_SPANS_TWO &&
      first &&
      second &&
      second[1] >= MIN_RUNNER_UP
    ) {
      return { tags: [first[0], second[0]], reason: "spans two categories" };
    }

    if (tag.confidence >= MIN_CHOICE_CONFIDENCE) {
      return { tags: [tag.choice], reason: "confident single tag" };
    }

    return {
      tags: null,
      reason: `confidence below ${MIN_CHOICE_CONFIDENCE}`,
    };
  };

  const { tags, reason } = decide();

  console.log(
    "[ai-tags]",
    JSON.stringify({
      source: tags ? "jev" : "gemini",
      reason,
      tags,
      confidence: tag.confidence,
      spansTwo: spansTwo.noul,
      top: ranked.slice(0, 3),
    }),
  );

  return tags;
}

/** Fallback path: Gemini can create a tag that does not exist yet. */
async function generateNewTags(
  state: string,
  existingTagNames: string[],
): Promise<string[] | null> {
  const existingList =
    existingTagNames.length > 0
      ? `\nExisting tags: ${existingTagNames.join(", ")}`
      : "";

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
    prompt: state,
  });

  return output?.tags?.length ? output.tags : null;
}

export async function generateTags(til: Til) {
  const { id: tilId, user_id: userId } = til;
  const supabase = createAdminClient();

  // Fetch existing tags for reuse preference
  const { data: existingTags } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", userId);

  const existingTagNames = existingTags?.map((t) => t.name) ?? [];
  const state = buildState(til);

  try {
    const tags =
      (await pickExistingTags(state, existingTagNames)) ??
      (await generateNewTags(state, existingTagNames));

    if (!tags?.length) return;

    await upsertTags(supabase, userId, tilId, tags);
  } catch (error) {
    console.error("[ai-tags] Failed:", error);
  }
}
