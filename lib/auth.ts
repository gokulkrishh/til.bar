import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Til } from "@/lib/types";

const jwtSecret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

const jwksUrl = new URL(
  "/auth/v1/.well-known/jwks.json",
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
);
const jwks = createRemoteJWKSet(jwksUrl);

const supabase = createAdminClient();

/**
 * How long a verified key stays trusted without a database check. MCP clients
 * send initialize, tools/list and tools/call as separate requests, each
 * re-authenticating; caching spares all but the first. A deleted key keeps
 * working on an already-warm instance for at most this long.
 */
const API_KEY_CACHE_TTL_MS = 60_000;
const API_KEY_CACHE_MAX = 1_000;

const apiKeyCache = new Map<string, { userId: string; expiresAt: number }>();

function hashApiKey(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getCachedUserId(keyHash: string): string | null {
  const hit = apiKeyCache.get(keyHash);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    apiKeyCache.delete(keyHash);
    return null;
  }
  return hit.userId;
}

function cacheUserId(keyHash: string, userId: string) {
  if (apiKeyCache.size >= API_KEY_CACHE_MAX) apiKeyCache.clear();
  apiKeyCache.set(keyHash, {
    userId,
    expiresAt: Date.now() + API_KEY_CACHE_TTL_MS,
  });
}

export function clearApiKeyCache() {
  apiKeyCache.clear();
}

export async function authenticateApiKey(
  token: string,
): Promise<string | null> {
  if (!token.startsWith("mcp_sk_")) return null;

  const keyHash = hashApiKey(token);
  const cached = getCachedUserId(keyHash);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return null;

  cacheUserId(keyHash, data.user_id);
  return data.user_id;
}

/**
 * Saves a link for the owner of an `mcp_sk_` key in one round trip: a plain
 * insert when the key is cached, otherwise `save_til_with_key`, which checks
 * the key and inserts in the same call.
 */
export async function saveTilWithApiKey(
  token: string,
  url: string,
): Promise<{ til: Til } | { error: "unauthorized" | "failed" }> {
  if (!token.startsWith("mcp_sk_")) return { error: "unauthorized" };

  const keyHash = hashApiKey(token);
  const cached = getCachedUserId(keyHash);

  if (cached) {
    const { data, error } = await supabase
      .from("tils")
      .insert({ user_id: cached, url })
      .select()
      .single();

    return error ? { error: "failed" } : { til: data };
  }

  const { data, error } = await supabase.rpc("save_til_with_key", {
    p_key_hash: keyHash,
    p_url: url,
  });

  if (error) {
    // 28000 is raised by the function when no key matches.
    return { error: error.code === "28000" ? "unauthorized" : "failed" };
  }

  cacheUserId(keyHash, data.user_id);
  return { til: data };
}

export async function authenticateToken(token: string): Promise<string | null> {
  if (token.startsWith("mcp_sk_")) {
    return authenticateApiKey(token);
  }

  // Try ECC (ES256) verification via JWKS first, fallback to HS256 legacy secret
  try {
    const { payload } = await jwtVerify(token, jwks);
    return (payload.sub as string) ?? null;
  } catch {
    try {
      const { payload } = await jwtVerify(token, jwtSecret);
      return (payload.sub as string) ?? null;
    } catch {
      return null;
    }
  }
}
