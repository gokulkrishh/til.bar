import { ChatInput } from "@/components/chat-input";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";
import type { TilWithTags } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();

  const { data: rawTils } = await supabase
    .from("tils")
    .select("*, til_tags(tag:tags(*))")
    .order("created_at", { ascending: false });

  const tils: TilWithTags[] = (rawTils ?? []).map((til) => ({
    ...til,
    tags: (til.til_tags ?? []).map(
      (tt: { tag: TilWithTags["tags"][number] }) => tt.tag,
    ),
  }));

  return (
    <>
      <TilList tils={tils} />
      <ChatInput />
    </>
  );
}
