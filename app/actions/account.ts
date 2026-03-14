"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function generateApiKey() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to generate an API key" };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Delete any existing key — only one key per user
  await admin.from("api_keys").delete().eq("user_id", user.id);

  const key = `mcp_sk_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const { error } = await admin.from("api_keys").insert({
    user_id: user.id,
    key_hash: keyHash,
  });

  if (error) return { error: "Failed to generate API key" };

  // Return the plain key once — it cannot be recovered after this point
  return { key };
}

export async function deleteApiKey() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete API key" };

  return { success: true };
}

export async function hasApiKey() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { count, error } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return { error: "Failed to check API key" };

  return { exists: (count ?? 0) > 0 };
}

export async function exportTils() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to export" };
  }

  const { data: tils, error } = await supabase
    .from("tils")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Something went wrong" };
  }

  return { data: tils };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Something went wrong" };
  }

  await supabase.auth.signOut();

  return { success: true };
}
