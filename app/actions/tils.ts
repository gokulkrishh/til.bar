"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMetadata } from "@/lib/metadata";
import { generateTags } from "@/lib/ai-tags";

function extractUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s]+/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export async function createTil(input: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to save links" };
  }

  const url = extractUrl(input);

  if (!url) {
    return { error: "Not a valid URL" };
  }

  const { data, error } = await supabase
    .from("tils")
    .insert({
      user_id: user.id,
      url,
    })
    .select()
    .single();

  if (error) {
    return { error: "Something went wrong" };
  }

  // Fetch metadata and generate tags in the background after response is sent
  after(async () => {
    const { title, description } = await fetchMetadata(url);
    if (title || description) {
      const supabase = await createClient();
      await supabase
        .from("tils")
        .update({ title, description })
        .eq("id", data.id);
    }

    await generateTags(data.id, url, title, description, user.id);
  });

  return { data };
}

export async function deleteTil(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to continue" };
  }

  const { error } = await supabase.from("tils").delete().eq("id", id);

  if (error) {
    return { error: "Something went wrong" };
  }

  return { success: true };
}

export async function refreshMetadata(id: string, url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to continue" };
  }

  const { title, description } = await fetchMetadata(url);

  const { error } = await supabase
    .from("tils")
    .update({ title, description })
    .eq("id", id);

  if (error) {
    return { error: "Something went wrong" };
  }

  return { success: true };
}
