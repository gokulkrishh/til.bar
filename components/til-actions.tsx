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
import { error007Sound } from "@/sounds/error-007";

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
  const [playClick] = useAppSound(clickSoftSound);
  const [playTrash] = useAppSound(error007Sound);
  const { optimisticDelete } = useCaptureContext();
  const { attachTil } = useChatContext();
  const trigger = useAppHaptics();

  const handleCopyLink = async () => {
    playClick();
    trigger("light");
    await navigator.clipboard.writeText(url);
  };

  const handleDelete = () => {
    playTrash();
    trigger("heavy");
    optimisticDelete(tilId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <MoreVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem
          onClick={() => {
            attachTil({ id: tilId, url, title });
            setOpen(false);
          }}
        >
          <MessageCircle />
          Ask about this
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
