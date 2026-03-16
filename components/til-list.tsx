"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { TilItem } from "@/components/til-item";
import { TilItemSkeleton } from "@/components/til-item-skeleton";
import { EmptyState } from "@/components/empty-state";
import { TagFilter } from "@/components/tag-filter";
import { usePendingTils, useCaptureContext } from "@/context/capture-provider";
import { useSearch } from "@/context/search-provider";
import type { TilWithTags } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppHaptics } from "@/context/haptics-provider";

const DEFAULT_VISIBLE = 5;

function groupByRelativeDay(tils: TilWithTags[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: { label: string; tils: TilWithTags[] }[] = [];
  const map = new Map<string, TilWithTags[]>();

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
  tils: TilWithTags[];
  pendingItems?: PendingItem[];
}) {
  const [showAll, setShowAll] = useState(false);
  const { deletedIds } = useCaptureContext();
  const activeTils = tils.filter((til) => !deletedIds.has(til.id));
  const totalCount = activeTils.length + pendingItems.length;
  const hasMore = activeTils.length > DEFAULT_VISIBLE;
  const visible = showAll ? activeTils : activeTils.slice(0, DEFAULT_VISIBLE);

  return (
    <motion.section layout="position" transition={{ duration: 0.2 }}>
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground py-2.5">
        {label}{" "}
        <span className="font-mono tabular-nums text-muted-foreground/60">
          {totalCount}
        </span>
      </h2>
      <LayoutGroup>
        <ul className="relative flex flex-col gap-0.5">
          {pendingItems.map((til) => (
            <TilItemSkeleton key={til.id} url={til.url} />
          ))}
          <AnimatePresence initial={false}>
            {visible.map((til) => (
              <motion.div
                key={til.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <TilItem til={til} />
              </motion.div>
            ))}
          </AnimatePresence>
          {hasMore && !showAll && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
          )}
        </ul>
      </LayoutGroup>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1 py-2 text-xs transition-colors duration-150 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn("transition-transform duration-150 size-3.5", {
              "rotate-180": showAll,
            })}
          />
          {showAll
            ? "Show less"
            : `Show ${activeTils.length - DEFAULT_VISIBLE} more`}
        </button>
      )}
    </motion.section>
  );
}

export function TilList({ tils }: { tils: TilWithTags[] }) {
  const pendingTils = usePendingTils();
  const { query } = useSearch();
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const trigger = useAppHaptics();
  const hasPending = pendingTils.length > 0;
  const isEmpty = tils.length === 0 && !hasPending;

  const allTags = useMemo(() => {
    const tags = tils.flatMap((til) => til.tags ?? []);
    const counts = Map.groupBy(tags, (tag) => tag.name);

    return [...counts.entries()]
      .map(([name, group]) => ({
        id: group[0].id,
        name,
        count: group.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tils]);

  if (isEmpty) {
    return <EmptyState />;
  }

  const hasTagFilter = activeTags.size > 0;
  const searchLower = query.toLowerCase();
  const hasAnyFilter = hasTagFilter || !!query;

  let filtered = tils;
  if (hasTagFilter) {
    filtered = filtered.filter((til) =>
      til.tags?.some((t) => activeTags.has(t.name)),
    );
  }
  if (query) {
    filtered = filtered.filter(
      (til) =>
        til.title?.toLowerCase().includes(searchLower) ||
        til.url.toLowerCase().includes(searchLower) ||
        til.description?.toLowerCase().includes(searchLower),
    );
  }

  const groups = groupByRelativeDay(filtered);

  // If there are pending items but no "Today" group yet, create one
  if (hasPending && !hasAnyFilter && !groups.some((g) => g.label === "Today")) {
    groups.unshift({ label: "Today", tils: [] });
  }

  const toggleTag = (name: string) => {
    trigger("light");
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2 py-4 pb-20">
      <TagFilter
        tags={allTags}
        activeTags={activeTags}
        onTagClick={toggleTag}
        onClear={() => {
          trigger("light");
          setActiveTags(new Set());
        }}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        {groups.map((group, index) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn({
              "border-t border-border/30 pt-4 mt-2": index > 0,
              "mb-16": index === groups.length - 1,
            })}
          >
            <TilGroup
              label={group.label}
              tils={group.tils}
              pendingItems={
                group.label === "Today" && !hasAnyFilter ? pendingTils : []
              }
            />
          </motion.div>
        ))}

        {groups.length === 0 && hasAnyFilter && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-52 items-center justify-center"
          >
            <p className="text-muted-foreground text-sm text-center">
              No results found.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
