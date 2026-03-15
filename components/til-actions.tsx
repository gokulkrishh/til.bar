"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  Link2,
  MessageCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { buttonVariants } from "./ui/button";
import { useAppSound } from "@/hooks/use-app-sound";
import { clickSoftSound } from "@/sounds/click-soft/click-soft";
import { drop003Sound } from "@/sounds/drop-003/drop-003";
import { useCaptureContext } from "@/context/capture-provider";
import { useAppHaptics } from "@/context/haptics-provider";
import { toast } from "sonner";

export function TilActions({ tilId, url }: { tilId: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [playClick] = useAppSound(clickSoftSound);
  const [playDrop] = useAppSound(drop003Sound);
  const { optimisticDelete } = useCaptureContext();
  const trigger = useAppHaptics();

  const handleCopyLink = async () => {
    playClick();
    trigger("light");
    await navigator.clipboard.writeText(url);
  };

  const handleDelete = () => {
    playDrop();
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
        <DropdownMenuItem onClick={() => {}}>
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
