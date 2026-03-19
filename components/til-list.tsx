"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { TilItem } from "@/components/til-item";
import { TilItemSkeleton } from "@/components/til-item-skeleton";
import { EmptyState } from "@/components/empty-state";
import { TagFilter, type TagInfo } from "@/components/tag-filter";
import { usePendingTils, useCaptureContext } from "@/context/capture-provider";
import { useSearch } from "@/context/search-provider";
import { searchTils } from "@/app/actions/tils";
import type { TilWithTags } from "@/lib/types";
import { useAppHaptics } from "@/context/haptics-provider";
import { Spinner } from "./ui/spinner";
import { SkeletonGroup } from "./page-loading";

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
  totalCount: totalCountOverride,
}: {
  label: string;
  tils: TilWithTags[];
  pendingItems?: PendingItem[];
  totalCount?: number;
}) {
  const { deletedIds } = useCaptureContext();
  const activeTils = tils.filter((til) => !deletedIds.has(til.id));
  const totalCount =
    totalCountOverride ?? activeTils.length + pendingItems.length;

  return (
    <motion.section layout="position" transition={{ duration: 0.2 }}>
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground py-2.5">
        {label}{" "}
        <span className="font-mono tabular-nums text-muted-foreground/60">
          {totalCount}
        </span>
      </h2>
      <LayoutGroup>
        <ul className="relative flex flex-col gap-px">
          {pendingItems.map((til) => (
            <TilItemSkeleton key={til.id} url={til.url} />
          ))}
          <AnimatePresence initial={false}>
            {activeTils.map((til) => (
              <motion.div
                key={til.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <TilItem til={til} showDate={label === "Earlier"} />
              </motion.div>
            ))}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
    </motion.section>
  );
}

export function TilList({
  tils: initialTils,
  totalCount,
  allTags,
}: {
  tils: TilWithTags[];
  totalCount: number;
  allTags: TagInfo[];
}) {
  const pendingTils = usePendingTils();
  const { debouncedQuery } = useSearch();
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [filteredTils, setFilteredTils] = useState<TilWithTags[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const trigger = useAppHaptics();

  const hasPending = pendingTils.length > 0;
  const hasAnyFilter = activeTags.size > 0 || !!debouncedQuery;

  // Server-side search (debounce handled by SearchProvider)
  useEffect(() => {
    if (!debouncedQuery && activeTags.size === 0) return;

    startTransition(async () => {
      const result = await searchTils({
        query: debouncedQuery || undefined,
        tags: activeTags.size > 0 ? [...activeTags] : undefined,
      });

      if ("data" in result) {
        setFilteredTils(result.data ?? []);
      }
    });
  }, [debouncedQuery, activeTags]);

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

  // Show filtered results when filtering, initial data otherwise
  const displayTils = hasAnyFilter ? (filteredTils ?? []) : initialTils;
  const isEmpty = initialTils.length === 0 && !hasPending;

  if (isEmpty) {
    return <EmptyState />;
  }

  const groups = groupByRelativeDay(displayTils);
  const hiddenCount = totalCount - initialTils.length;

  // Compute real total for "Earlier" when not filtering
  const groupTotals: Record<string, number | undefined> = {};
  if (!hasAnyFilter && hiddenCount > 0) {
    const todayCount =
      groups.find((g) => g.label === "Today")?.tils.length ?? 0;
    const yesterdayCount =
      groups.find((g) => g.label === "Yesterday")?.tils.length ?? 0;
    groupTotals["Earlier"] = totalCount - todayCount - yesterdayCount;
  }

  if (hasPending && !hasAnyFilter && !groups.some((g) => g.label === "Today")) {
    groups.unshift({ label: "Today", tils: [] });
  }

  return (
    <div className="flex flex-col gap-4 py-4 pb-20">
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
          >
            <TilGroup
              label={group.label}
              tils={group.tils}
              totalCount={groupTotals[group.label]}
              pendingItems={
                group.label === "Today" && !hasAnyFilter ? pendingTils : []
              }
            />

            {groups.length > 1 && index !== groups.length - 1 && (
              <div className="border-t border-border/30 mt-5 w-[95%]" />
            )}
          </motion.div>
        ))}

        {groups.length === 0 && hasAnyFilter && !isPending && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-52 items-center justify-center"
          >
            <p className="text-muted-foreground text-sm text-center">
              No results found. Try a different search or tag.
            </p>
          </motion.div>
        )}

        {isPending && groups.length === 0 && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col w-full h-52 items-center justify-center"
          >
            <SkeletonGroup />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasAnyFilter && hiddenCount > 0 ? (
        <p className="text-xs text-muted-foreground text-center mb-8">
          Use search or tags to find {hiddenCount} more
        </p>
      ) : (
        <div className="h-16" />
      )}
    </div>
  );
}
