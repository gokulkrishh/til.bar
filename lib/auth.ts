import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function authenticateApiKey(
  token: string,
): Promise<string | null> {
  if (!token.startsWith("mcp_sk_")) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const keyHash = crypto.createHash("sha256").update(token).digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return null;

  return data.user_id;
}

export async function authenticateToken(token: string): Promise<string | null> {
  if (token.startsWith("mcp_sk_")) {
    return authenticateApiKey(token);
  }

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
