import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { TilList } from "@/components/til-list";
import { ChatInput } from "@/components/chat-input";
import { CaptureProvider } from "@/context/capture-provider";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CaptureProvider>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
        <Header user={user} />
        <TilList />
        <ChatInput />
      </div>
    </CaptureProvider>
  );
}
