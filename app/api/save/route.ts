import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { authenticateApiKey } from "@/lib/auth";
import { fetchMetadata } from "@/lib/metadata";
import { generateMetadata } from "@/lib/ai-metadata";
import { generateTags } from "@/lib/ai-tags";

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  // 1. Try API key auth via Authorization header
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token?.startsWith("mcp_sk_")) {
    return authenticateApiKey(token);
  }

  // 2. Fall back to cookie-based session auth (extension forwards cookies)
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("tils")
    .insert({ user_id: userId, url })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Failed to save link" }, { status: 500 });
  }

  // Background: fetch metadata, enhance with AI, generate tags
  (async () => {
    try {
      let { title, description } = await fetchMetadata(url);

      if (title || description) {
        await supabase
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }

      const aiMeta = await generateMetadata(url, title, description);

      if (aiMeta) {
        title = aiMeta.title;
        description = aiMeta.description;
        await supabase
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }

      await generateTags({ ...data, title, description });
    } catch (err) {
      console.error("[api/save] Background work failed:", err);
    }
  })();

  return Response.json({ id: data.id, url: data.url });
}
