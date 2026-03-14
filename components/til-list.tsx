"use client";

import { useState } from "react";
import { TilItem } from "@/components/til-item";
import { TilItemSkeleton } from "@/components/til-item-skeleton";
import { EmptyState } from "@/components/empty-state";
import { usePendingTils } from "@/context/capture-provider";
import type { Til } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_VISIBLE = 5;

function groupByRelativeDay(tils: Til[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: { label: string; tils: Til[] }[] = [];
  const map = new Map<string, Til[]>();

  for (const til of tils) {
    const date = new Date(til.created_at);
    date.setHours(0, 0, 0, 0);

    let label: string;
    if (date.getTime() === today.getTime()) {
      label = "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = "Earlier";
    }

    const existing = map.get(label);
    if (existing) {
      existing.push(til);
    } else {
      map.set(label, [til]);
    }
  }

  // Maintain order: Today, Yesterday, Earlier
  for (const label of ["Today", "Yesterday", "Earlier"]) {
    const tils = map.get(label);
    if (tils) {
      groups.push({ label, tils });
    }
  }

  return groups;
}

type PendingItem = { id: string; url: string };

function TilGroup({
  label,
  tils,
  pendingItems = [],
}: {
  label: string;
  tils: Til[];
  pendingItems?: PendingItem[];
}) {
  const [showAll, setShowAll] = useState(false);
  const totalCount = tils.length + pendingItems.length;
  const hasMore = tils.length > DEFAULT_VISIBLE;
  const visible = showAll ? tils : tils.slice(0, DEFAULT_VISIBLE);

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground py-2">
        {label} <span className="text-xs">({totalCount})</span>
      </h2>
      <ul className="relative flex flex-col gap-1 divide-border/40 divide-y">
        {pendingItems.map((til) => (
          <TilItemSkeleton key={til.id} url={til.url} />
        ))}
        {visible.map((til) => (
          <TilItem key={til.id} til={til} />
        ))}
        {hasMore && !showAll && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
        )}
      </ul>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1 py-2 text-xs transition-colors"
        >
          <ChevronDown
            className={cn("transition-transform size-4", {
              "rotate-180": showAll,
            })}
          />
          {showAll ? "Show less" : `Show ${tils.length - DEFAULT_VISIBLE} more`}
        </button>
      )}
    </section>
  );
}

export function TilList({ tils }: { tils: Til[] }) {
  const pendingTils = usePendingTils();
  const hasPending = pendingTils.length > 0;
  const isEmpty = tils.length === 0 && !hasPending;

  if (isEmpty) {
    return <EmptyState />;
  }

  const groups = groupByRelativeDay(tils);

  // If there are pending items but no "Today" group yet, create one
  if (hasPending && !groups.some((g) => g.label === "Today")) {
    groups.unshift({ label: "Today", tils: [] });
  }

  return (
    <div className="flex flex-col gap-6 py-4 pb-20">
      {groups.map((group) => (
        <TilGroup
          key={group.label}
          label={group.label}
          tils={group.tils}
          pendingItems={group.label === "Today" ? pendingTils : []}
        />
      ))}
    </div>
  );
}
