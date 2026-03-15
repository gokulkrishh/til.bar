import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey } from "@/lib/auth";
import { fetchMetadata } from "@/lib/metadata";
import { generateMetadata } from "@/lib/ai-metadata";
import { generateTags } from "@/lib/ai-tags";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  // API key auth (mcp_sk_... prefix)
  if (token.startsWith("mcp_sk_")) {
    return authenticateApiKey(token);
  }

  // Supabase access token auth (from extension or other clients)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user.id;
}

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401, headers: corsHeaders },
    );
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders },
    );
  }

  const url = body.url;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json(
      { error: "Invalid URL" },
      { status: 400, headers: corsHeaders },
    );
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
    return Response.json(
      { error: "Failed to save link" },
      { status: 500, headers: corsHeaders },
    );
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

  return Response.json(
    { id: data.id, url: data.url },
    { headers: corsHeaders },
  );
}
