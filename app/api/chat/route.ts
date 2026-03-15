import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { createClient } from "@/lib/supabase/server";

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
    tils?: { url: string; title: string | null; description?: string | null }[];
  } = await request.json();

  const context = (tils ?? [])
    .map((til) =>
      [
        `URL: ${til.url}`,
        til.title && `Title: ${til.title}`,
        til.description && `Description: ${til.description}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  const result = streamText({
    model: openrouter("google/gemini-2.5-flash-lite"),
    system: `You are a helpful assistant. The user is asking about the following link(s):\n\n${context}\n\nAnswer concisely based on what you know about these links. If you don't have enough context, say so.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
