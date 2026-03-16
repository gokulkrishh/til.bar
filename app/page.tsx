import { ChatInput } from "@/components/chat-input";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import PageLoading from "@/components/page-loading";
import { DemoState } from "@/components/demo-state";

export default async function Home() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: tils },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tils")
      .select("*, tags:til_tags(...tags(*))")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      {user ? <TilList tils={tils ?? []} /> : <DemoState />}
      {user && <ChatInput user={user} />}
    </Suspense>
  );
}
