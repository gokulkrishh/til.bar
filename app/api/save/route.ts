import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateToken } from "@/lib/auth";
import { fetchMetadata } from "@/lib/metadata";
import { generateMetadata } from "@/lib/ai-metadata";
import { generateTags } from "@/lib/ai-tags";
import { getCorsHeaders } from "@/lib/cors";

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
  const headers = getCorsHeaders(req, {
    allowedHeaders: "Content-Type, Authorization",
  });
  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401, headers },
    );
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers },
    );
  }

  const url = body.url;

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400, headers });
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
      { status: 500, headers },
    );
  }

  // Background: fetch metadata, enhance with AI, generate tags
  // Each step is independent so one failure doesn't block the rest
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

    try {
      const aiMeta = await generateMetadata(url, title, description);

      if (aiMeta) {
        title = aiMeta.title;
        description = aiMeta.description;
        await supabase
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error("[api/save] AI metadata failed:", err);
    }

    try {
      await generateTags({ ...data, title, description });
    } catch (err) {
      console.error("[api/save] Tag generation failed:", err);
    }
  });

  return Response.json({ id: data.id, url: data.url }, { headers });
}
