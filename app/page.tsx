import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6">
      <Header />
      <EmptyState />
      <Footer />
    </div>
  );
}
