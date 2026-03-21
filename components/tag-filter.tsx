"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppHaptics } from "@/context/haptics-provider";
import { useAppSound } from "@/hooks/use-app-sound";
import { drop003Sound } from "@/sounds/drop-003";
import { clickSoftSound } from "@/sounds/click-soft";
import { AnimateNumber } from "motion-plus/react";

const DEFAULT_VISIBLE_TAGS = 10;

export type TagInfo = { id: string; name: string; count: number };

export function TagFilter({
  tags,
  activeTags,
  onTagClick,
  onClear,
}: {
  tags: TagInfo[];
  activeTags: Set<string>;
  onTagClick: (tagName: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [click] = useAppSound(clickSoftSound);
  const [play] = useAppSound(drop003Sound);
  const trigger = useAppHaptics();

  if (tags.length === 0) return null;

  const hasMore = tags.length > DEFAULT_VISIBLE_TAGS;
  // Always show active tags even when collapsed
  const visibleTags = expanded
    ? tags
    : tags.filter(
        (tag, i) => i < DEFAULT_VISIBLE_TAGS || activeTags.has(tag.name),
      );
  const hiddenCount = tags.length - DEFAULT_VISIBLE_TAGS;

  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex items-center gap-1.5 flex-wrap pb-2"
    >
      {visibleTags.map((tag) => (
        <Badge
          className="inline-flex gap-2"
          size="lg"
          key={tag.id}
          variant={activeTags.has(tag.name) ? "default" : "outline"}
          onClick={() => {
            click();
            trigger("light");
            onTagClick(tag.name);
          }}
        >
          {tag.name}
          <span
            className={cn("font-mono tabular-nums text-[0.625rem]", {
              "text-muted-foreground/60": !activeTags.has(tag.name),
            })}
          >
            <AnimateNumber>{tag.count}</AnimateNumber>
          </span>
        </Badge>
      ))}

      {hasMore && (
        <Button
          size="xs"
          onClick={() => {
            click();
            trigger("light");
            setExpanded(!expanded);
          }}
          variant="ghost"
          className="rounded-full h-6.5"
        >
          <ChevronDown
            className={cn("size-3 transition-transform duration-150", {
              "rotate-180": expanded,
            })}
            aria-hidden="true"
          />
          {expanded ? "Less" : `${hiddenCount} more`}
        </Button>
      )}

      {activeTags.size > 0 && (
        <Button
          size="xs"
          onClick={() => {
            play();
            trigger("light");
            onClear();
          }}
          variant="ghost"
          className="rounded-full h-6.5"
        >
          <X className="size-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}
