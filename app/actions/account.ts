"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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
