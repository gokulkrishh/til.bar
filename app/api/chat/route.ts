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

  // If no TILs attached, fetch user's recent saved links for context
  let tilsForContext = tils ?? [];

  if (tilsForContext.length === 0) {
    const { data } = await supabase
      .from("tils")
      .select("url, title, description")
      .order("created_at", { ascending: false })
      .limit(100);

    tilsForContext = (data as Til[]) ?? [];
  }

  const links = tilsForContext
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
