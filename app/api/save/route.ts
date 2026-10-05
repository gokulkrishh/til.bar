import { after } from "next/server";
import { authenticateToken, saveTilWithApiKey } from "@/lib/auth";
import { enrichTil } from "@/lib/enrich";
import { getCorsHeaders } from "@/lib/cors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Til } from "@/lib/types";

const supabase = createAdminClient();

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req, {
      allowedHeaders: "Content-Type, Authorization",
    }),
  });
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

/** API keys save in one round trip; JWT bearers verify locally, then insert. */
async function saveTil(
  token: string,
  url: string,
): Promise<{ til: Til } | { error: "unauthorized" | "failed" }> {
  if (token.startsWith("mcp_sk_")) return saveTilWithApiKey(token, url);

  const userId = await authenticateToken(token);
  if (!userId) return { error: "unauthorized" };

  const { data, error } = await supabase
    .from("tils")
    .insert({ user_id: userId, url })
    .select()
    .single();

  return error ? { error: "failed" } : { til: data };
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

  const token = getBearerToken(req);
  const result = token ? await saveTil(token, url) : null;

  if (!result || ("error" in result && result.error === "unauthorized")) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401, headers },
    );
  }

  if ("error" in result) {
    return Response.json(
      { error: "Failed to save link" },
      { status: 500, headers },
    );
  }

  const { til } = result;

  // Callers here are the extension and iOS Shortcut, which don't render the
  // row, so enrichment stays in the background rather than delaying them.
  after(() => enrichTil(til, "api/save"));

  return Response.json({ id: til.id, url: til.url }, { headers });
}
