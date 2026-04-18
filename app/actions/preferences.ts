"use server";

import { createClient } from "@/lib/supabase/server";

type ProfileSettings = {
  export_format?: "json" | "markdown";
  email_digest_enabled?: boolean;
};

export async function setEmailDigestEnabled(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to manage notifications" };

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", user.id)
    .single();

  if (readError) return { error: "Couldn't update notification settings" };

  const current = (profile?.settings ?? {}) as ProfileSettings;
  const next: ProfileSettings = { ...current, email_digest_enabled: enabled };

  const { error } = await supabase
    .from("profiles")
    .update({ settings: next })
    .eq("id", user.id);

  if (error) return { error: "Couldn't update notification settings" };

  return { success: true };
}
