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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  ArrowUpRight01Icon,
  CopyLinkIcon,
  Delete02Icon,
  MoreVerticalIcon,
} from "@hugeicons-pro/core-stroke-rounded";
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
        <HugeiconsIcon icon={MoreVerticalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem onClick={() => {}}>
          <HugeiconsIcon icon={ArrowUpRight01Icon} />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <HugeiconsIcon icon={CopyLinkIcon} />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <HugeiconsIcon icon={AiChat02Icon} />
          Add to chat
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
