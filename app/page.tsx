import { ChatInput } from "@/components/chat-input";
import { TilList } from "@/components/til-list";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import PageLoading from "@/components/page-loading";
import { DemoState } from "@/components/demo-state";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Suspense fallback={<PageLoading />}>
        <DemoState />
      </Suspense>
    );
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const [
    { data: todayTils },
    { data: yesterdayTils },
    { data: earlierTils },
    { count: totalCount },
    { data: tagRows },
  ] = await Promise.all([
    supabase
      .from("tils")
      .select("*, tags:til_tags(...tags(*))")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("tils")
      .select("*, tags:til_tags(...tags(*))")
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("tils")
      .select("*, tags:til_tags(...tags(*))")
      .lt("created_at", yesterdayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("tils").select("id", { count: "exact", head: true }),
    supabase
      .from("tags")
      .select("id, name, til_tags(count)")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  const tils = [
    ...(todayTils ?? []),
    ...(yesterdayTils ?? []),
    ...(earlierTils ?? []),
  ];

  const allTags = (tagRows ?? [])
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: (tag.til_tags as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Suspense fallback={<PageLoading />}>
      <TilList tils={tils} totalCount={totalCount ?? 0} allTags={allTags} />
      <ChatInput user={user} />
    </Suspense>
  );
}
