"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { buttonVariants } from "./ui/button";
import { useAppSound } from "@/hooks/use-app-sound";
import { clickSoftSound } from "@/sounds/click-soft";
import { useCaptureContext } from "@/context/capture-provider";
import { useChatContext } from "@/context/chat-provider";
import { useAppHaptics } from "@/context/haptics-provider";
import { cn } from "@/lib/utils";

export function TilActions({
  tilId,
  url,
  title,
}: {
  tilId: string;
  url: string;
  title: string | null;
}) {
  const [open, setOpen] = useState(false);
  const playClick = useAppSound(clickSoftSound);
  const { optimisticDelete } = useCaptureContext();
  const { attachTil } = useChatContext();
  const trigger = useAppHaptics();

  const handleCopyLink = async () => {
    playClick();
    trigger("light");
    await navigator.clipboard.writeText(url);
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
        <DropdownMenuItem
          onClick={() => {
            playClick();
            attachTil({ id: tilId, url, title });
            setOpen(false);
          }}
        >
          <MessageCircle aria-hidden="true" />
          Ask AI
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 aria-hidden="true" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
