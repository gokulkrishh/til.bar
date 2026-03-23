"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMetadata } from "@/lib/metadata";
import { generateTags } from "@/lib/ai-tags";
import { generateMetadata } from "@/lib/ai-metadata";

export async function searchTils({
  query,
  tags,
}: {
  query?: string;
  tags?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to search" };
  }

  let q = supabase
    .from("tils")
    .select("*, tags:til_tags(...tags(*))")
    .order("created_at", { ascending: false });

  if (query) {
    const escaped = query.replace(/%/g, "\\%");
    q = q.or(
      `title.ilike.%${escaped}%,url.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  if (tags?.length) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .in("name", tags);

    if (tagRows?.length) {
      const tagIds = tagRows.map((t) => t.id);
      const { data: tilIds } = await supabase
        .from("til_tags")
        .select("til_id")
        .in("tag_id", tagIds);

      if (tilIds?.length) {
        q = q.in(
          "id",
          tilIds.map((t) => t.til_id),
        );
      } else {
        return { data: [] };
      }
    } else {
      return { data: [] };
    }
  }

  const { data, error } = await q;

  if (error) {
    return { error: "Search failed" };
  }

  return { data: data ?? [] };
}

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
    return { error: "Couldn't save this link. Try again." };
  }

  // Fetch metadata and generate tags in the background after response is sent
  after(async () => {
    try {
      const admin = createAdminClient();
      let { title, description } = await fetchMetadata(url);

      if (title || description) {
        await admin
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }

      // Generate better metadata via AI if needed
      const aiMeta = await generateMetadata(url, title, description);

      if (aiMeta) {
        title = aiMeta.title;
        description = aiMeta.description;
        await admin
          .from("tils")
          .update({ title, description })
          .eq("id", data.id);
      }

      await generateTags({ ...data, title, description });
    } catch (err) {
      console.error("[after] Background work failed:", err);
    } finally {
      revalidatePath("/");
    }
  });

  return { data };
}

export async function deleteTil(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to delete links" };
  }

  const { error } = await supabase.from("tils").delete().eq("id", id);

  if (error) {
    return { error: "Couldn't delete this link. Try again." };
  }

  return { success: true };
}

export async function refreshMetadata(id: string, url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to refresh metadata" };
  }

  let { title, description } = await fetchMetadata(url);

  // Generate better metadata via AI if needed
  const aiMeta = await generateMetadata(url, title, description);

  if (aiMeta) {
    title = aiMeta.title;
    description = aiMeta.description;
  }

  const { data: til, error } = await supabase
    .from("tils")
    .update({ title, description })
    .eq("id", id)
    .select()
    .single();

  if (error || !til) {
    return { error: "Couldn't refresh metadata. Try again." };
  }

  // Generate tags if this TIL has none
  const { count } = await supabase
    .from("til_tags")
    .select("*", { count: "exact", head: true })
    .eq("til_id", id);

  if (!count) {
    after(async () => {
      try {
        await generateTags(til);
      } catch (err) {
        console.error("[after] Background work failed:", err);
      } finally {
        revalidatePath("/");
      }
    });
  }

  return { success: true };
}
