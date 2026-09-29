"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, MoreVertical, Tag as TagIcon, Trash2 } from "lucide-react";
import { buttonVariants } from "./ui/button";
import { useAppSound } from "@/hooks/use-app-sound";
import { useCaptureContext } from "@/context/capture-provider";
import { useAppHaptics } from "@/context/haptics-provider";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

export function TilActions({
  tilId,
  url,
  title,
  tags,
  onTagSelect,
}: {
  tilId: string;
  url: string;
  title: string | null;
  tags: Tag[];
  onTagSelect?: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const playClick = useAppSound();
  const { optimisticDelete } = useCaptureContext();
  const trigger = useAppHaptics();

  const handleCopyLink = async () => {
    playClick();
    trigger("light");
    await navigator.clipboard.writeText(url);
  };

  const handleTagSelect = (name: string) => {
    playClick();
    onTagSelect?.(name);
  };

  const handleDelete = () => {
    playClick();
    trigger("heavy");
    optimisticDelete(tilId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Actions"
        onClick={() => {
          trigger("light");
        }}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full hit-area-2 transition-opacity duration-150",
          "md:opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100",
        )}
      >
        <MoreVertical aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 aria-hidden="true" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <TagIcon aria-hidden="true" />
            Tags
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {tags.length === 0 ? (
              <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
            ) : (
              tags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.name)}
                >
                  <span className="text-muted-foreground">#</span>
                  {tag.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
