import { EmptyState } from "@/components/empty-state";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: tils } = await supabase
    .from("tils")
    .select()
    .order("created_at", { ascending: false });

  if (!tils?.length) {
    return <EmptyState />;
  }

  return <TilList tils={tils} />;
}
