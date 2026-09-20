"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMetadata, fetchMetadataWithin } from "@/lib/metadata";
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

  // getUser() round trips to the Auth server, which costs more than the
  // insert itself. getClaims() verifies the JWT against the project's signing
  // keys locally, which is all a save needs to establish ownership.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  if (!userId) {
    return { error: "Sign in to save links" };
  }

  const url = extractUrl(input);

  if (!url) {
    return { error: "Not a valid URL" };
  }

  // Give the page a short window to answer, then insert whatever we have.
  // Folding the metadata into the insert keeps the save to a single database
  // round trip; a slow page just misses the window and gets filled in below.
  const meta = await fetchMetadataWithin(url);

  const { data, error } = await supabase
    .from("tils")
    .insert({
      user_id: userId,
      url,
      title: meta?.title ?? null,
      description: meta?.description ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: "Couldn't save this link. Try again." };
  }

  // Everything past here is off the critical path: re-fetch if the page
  // missed the window, then AI cleanup and tagging together.
  after(async () => {
    try {
      const admin = createAdminClient();

      let { title, description } = data;

      if (!meta) {
        const late = await fetchMetadata(url);
        title = late.title;
        description = late.description;

        if (title || description) {
          await admin
            .from("tils")
            .update({ title, description })
            .eq("id", data.id);
        }
      }

      await Promise.all([
        generateMetadata(url, title, description).then(async (aiMeta) => {
          if (!aiMeta) return;
          await admin
            .from("tils")
            .update({ title: aiMeta.title, description: aiMeta.description })
            .eq("id", data.id);
        }),
        generateTags({ ...data, title, description }),
      ]);
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

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

export async function refreshMetadata(id: string, url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to refresh metadata" };
  }

  const { data: existing } = await supabase
    .from("tils")
    .select("updated_at")
    .eq("id", id)
    .single();

  if (existing?.updated_at) {
    const elapsed = Date.now() - new Date(existing.updated_at).getTime();
    if (elapsed < REFRESH_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
      const wait =
        secondsLeft >= 60
          ? `${Math.ceil(secondsLeft / 60)} min`
          : `${secondsLeft}s`;
      return { error: `Just refreshed. Try again in ${wait}.` };
    }
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
