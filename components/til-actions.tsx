"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTil } from "@/app/actions/tils";
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

export function TilActions({ tilId, url }: { tilId: string; url: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTil(tilId);
      router.refresh();
    });
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
          <ExternalLink />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <MessageCircle />
          Add to chat
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
