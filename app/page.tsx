import { ChatInput } from "@/components/chat-input";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";
import type { TilWithTags } from "@/lib/types";
import { Suspense } from "react";
import Loading from "./loading";

export default async function Home() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: rawTils },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tils")
      .select("*, til_tags(tag:tags(*))")
      .order("created_at", { ascending: false }),
  ]);

  const tils: TilWithTags[] = (rawTils ?? []).map((til) => ({
    ...til,
    tags: (til.til_tags ?? []).map(
      (tt: { tag: TilWithTags["tags"][number] }) => tt.tag,
    ),
  }));

  return (
    <Suspense fallback={<Loading />}>
      <TilList tils={tils} />
      {user && <ChatInput user={user} />}
    </Suspense>
  );
}
