"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function generateApiKey(label: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to generate an API key" };

  const trimmed = label.trim();
  if (!trimmed) return { error: "Label is required" };

  const admin = createAdminClient();

  const key = `mcp_sk_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const { error } = await admin.from("api_keys").insert({
    user_id: user.id,
    key_hash: keyHash,
    label: trimmed,
  });

  if (error) return { error: "Couldn't generate API key. Try again." };

  // Return the plain key once — it cannot be recovered after this point
  return { key };
}

export async function deleteApiKey(keyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to manage API keys" };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) return { error: "Couldn't revoke API key" };

  return { success: true };
}

export async function listApiKeys() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to manage API keys" };

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Couldn't load API keys" };

  return { keys: data };
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
    .select("*, tags:til_tags(...tags(*))")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Couldn't export your links. Try again." };
  }

  console.log("tils", tils);

  return { data: tils };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to continue" };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Couldn't delete your account. Please try again." };
  }

  await supabase.auth.signOut();

  return { success: true };
}
