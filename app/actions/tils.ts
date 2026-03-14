"use server";

import { createClient } from "@/lib/supabase/server";

function extractUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s]+/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

async function fetchMetadata(
  url: string,
): Promise<{ title: string | null; description: string | null }> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "til.bar/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { title: null, description: null };

    const html = await response.text();

    const titleMatch =
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/) ??
      html.match(/<title[^>]*>([^<]*)<\/title>/);

    const descMatch =
      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/) ??
      html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ??
      html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/);

    return {
      title: titleMatch?.[1]?.trim() ?? null,
      description: descMatch?.[1]?.trim() ?? null,
    };
  } catch {
    return { title: null, description: null };
  }
}

export async function createTil(input: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const url = extractUrl(input);
  if (!url) {
    return { error: "No valid URL found" };
  }

  const { title, description } = await fetchMetadata(url);

  const { data, error } = await supabase
    .from("tils")
    .insert({
      user_id: user.id,
      url,
      title,
      description,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function deleteTil(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.from("tils").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
