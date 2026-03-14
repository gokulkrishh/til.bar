import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { ChatInput } from "@/components/chat-input";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
      <Header />
      <EmptyState />
      <ChatInput />
    </div>
  );
}
