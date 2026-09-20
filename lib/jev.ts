import { z } from "zod";

/**
 * Minimal client for OpenRouter's System One (decisions) endpoint.
 *
 * Jev is not a chat-completions model — it has its own endpoint, an empty
 * `supported_parameters` list, and a `text->decisions` modality. The AI SDK
 * cannot drive it, so this is a hand-rolled fetch wrapper.
 *
 * @see https://openrouter.ai/docs/guides/community/typesafe-sdk
 */
const JEV_ENDPOINT = "https://openrouter.ai/api/v1/systemone";
const JEV_MODEL = "typesafe/jev-1.13";
const JEV_TIMEOUT_MS = 5_000;

/** Jev accepts at most 255 options for a single `choice` question. */
export const JEV_MAX_CHOICES = 255;

export type JevQuestion =
  | { type: "noul"; instructions: string }
  | { type: "choice"; instructions: string; criteria: Record<string, string> };

export type JevNoulAnswer = { type: "noul"; noul: number };
export type JevChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};
export type JevAnswer = JevNoulAnswer | JevChoiceAnswer;

type AnswerFor<Q extends JevQuestion> = Q extends { type: "noul" }
  ? JevNoulAnswer
  : JevChoiceAnswer;

export type JevAnswers<Q extends Record<string, JevQuestion>> = {
  [K in keyof Q]: AnswerFor<Q[K]>;
};

const answerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("noul"), noul: z.number() }),
  z.object({
    type: z.literal("choice"),
    choice: z.string(),
    probabilities: z.record(z.string(), z.number()),
    confidence: z.number(),
  }),
]);

const responseSchema = z.object({
  answers: z.record(z.string(), answerSchema),
  usage: z
    .object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      cost: z.number(),
    })
    .optional(),
});

/**
 * Ask Jev one or more typed questions about `state`.
 *
 * Returns `null` on any failure (missing key, network, timeout, malformed or
 * mismatched response) so callers can fall back to a generative model.
 */
export async function askJev<Q extends Record<string, JevQuestion>>({
  state,
  questions,
}: {
  state: string;
  questions: Q;
}): Promise<JevAnswers<Q> | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const startedAt = Date.now();

  try {
    const response = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: JEV_MODEL, state, questions }),
      signal: AbortSignal.timeout(JEV_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("[jev] HTTP", response.status, await response.text());
      return null;
    }

    const body: unknown = await response.json();
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[jev] Malformed response:", parsed.error.message);
      return null;
    }

    // Verify every question came back with a matching answer type before
    // narrowing to the per-question mapped type.
    const { answers, usage } = parsed.data;
    for (const [key, question] of Object.entries(questions)) {
      if (answers[key]?.type !== question.type) {
        console.error("[jev] Answer missing or mismatched for:", key);
        return null;
      }
    }

    console.log(
      "[jev]",
      JSON.stringify({
        ms: Date.now() - startedAt,
        inputTokens: usage?.input_tokens,
        outputTokens: usage?.output_tokens,
        cost: usage?.cost,
        answers,
      }),
    );

    return answers as JevAnswers<Q>;
  } catch (error) {
    console.error("[jev] Failed:", error);
    return null;
  }
}
