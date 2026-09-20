import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateToken } from "@/lib/auth";
import { fetchMetadata } from "@/lib/metadata";
import { generateMetadata } from "@/lib/ai-metadata";
import { generateTags } from "@/lib/ai-tags";
import { getCorsHeaders } from "@/lib/cors";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req, {
      allowedHeaders: "Content-Type, Authorization",
    }),
  });
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  return authenticateToken(token);
}

export async function POST(req: Request) {
  const body = await req.json();
  const headers = getCorsHeaders(req, {
    allowedHeaders: "Content-Type, Authorization",
  });

  const url = body.url;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400, headers });
  }

  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401, headers },
    );
  }

  const { data, error } = await supabase
    .from("tils")
    .insert({ user_id: userId, url })
    .select()
    .single();

  if (error) {
    return Response.json(
      { error: "Failed to save link" },
      { status: 500, headers },
    );
  }

  // Background: fetch metadata, enhance with AI, generate tags.
  // Callers here are the extension and MCP, which don't render the row, so
  // the fetch stays in the background rather than delaying the response.
  after(async () => {
    let title: string | null = null;
    let description: string | null = null;

    try {
      const meta = await fetchMetadata(url);
      title = meta.title;
      description = meta.description;

      if (title || description) {
        await supabase
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error("[api/save] Metadata fetch failed:", err);
    }

    // Independent of each other, so don't make one wait on the other. Each
    // settles on its own to keep one failure from dropping the other.
    const [aiMeta, tags] = await Promise.allSettled([
      generateMetadata(url, title, description),
      generateTags({ ...data, title, description }),
    ]);

    if (aiMeta.status === "rejected") {
      console.error("[api/save] AI metadata failed:", aiMeta.reason);
    } else if (aiMeta.value) {
      await supabase
        .from("tils")
        .update({
          title: aiMeta.value.title,
          description: aiMeta.value.description,
        })
        .eq("id", data.id);
    }

    if (tags.status === "rejected") {
      console.error("[api/save] Tag generation failed:", tags.reason);
    }
  });

  return Response.json({ id: data.id, url: data.url }, { headers });
}
