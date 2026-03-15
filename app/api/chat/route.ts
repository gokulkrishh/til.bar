import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { createClient } from "@/lib/supabase/server";
import { buildChatSystemPrompt } from "@/lib/prompts";
import type { Til } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    messages,
    tils,
  }: {
    messages: UIMessage[];
    tils?: Til[];
  } = await request.json();

  const links = (tils ?? [])
    .map((til) =>
      [
        `- ${til.url}`,
        til.title && `  Title: ${til.title}`,
        til.description && `  Description: ${til.description}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  const result = streamText({
    model: openrouter("google/gemini-2.5-flash-lite"),
    system: buildChatSystemPrompt(links),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
