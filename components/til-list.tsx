import { TilItem } from "@/components/til-item";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "./empty-state";

export async function TilList() {
  const supabase = await createClient();

  const { data: tils } = await supabase
    .from("tils")
    .select()
    .order("created_at", { ascending: false });

  if (!tils?.length) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-2 py-4 pb-20">
      {tils.map((til) => (
        <TilItem key={til.id} til={til} />
      ))}
    </ul>
  );
}
