import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { ChatInput } from "@/components/chat-input";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
      <Header user={user} />
      <EmptyState />
      <ChatInput />
    </div>
  );
}
