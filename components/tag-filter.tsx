"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppHaptics } from "@/context/haptics-provider";
import { useAppSound } from "@/hooks/use-app-sound";
import { drop003Sound } from "@/sounds/drop-003";
import { clickSoftSound } from "@/sounds/click-soft";

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
  const [click] = useAppSound(clickSoftSound);
  const [play] = useAppSound(drop003Sound);
  const trigger = useAppHaptics();

  if (tags.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex items-center gap-1.5 flex-wrap pb-2"
    >
      {tags.map((tag) => (
        <Badge
          className="hover:bg-muted"
          size="lg"
          key={tag.id}
          variant={activeTags.has(tag.name) ? "secondary" : "outline"}
          onClick={() => {
            click();
            trigger("light");
            onTagClick(tag.name);
          }}
        >
          {tag.name}
          <span
            className={cn("ml-1.5 font-mono tabular-nums text-[0.625rem]", {
              "text-muted-foreground/60": !activeTags.has(tag.name),
            })}
          >
            {tag.count}
          </span>
        </Badge>
      ))}

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
