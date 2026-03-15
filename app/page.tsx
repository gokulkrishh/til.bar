import { ChatInput } from "@/components/chat-input";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: tils } = await supabase
    .from("tils")
    .select()
    .order("created_at", { ascending: false });

  return (
    <>
      <TilList tils={tils ?? []} />
      <ChatInput />
    </>
  );
}
