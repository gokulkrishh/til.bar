"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Til } from "@/lib/types";
import Link from "next/link";
import { TilActions } from "@/components/til-actions";
import { useCaptureContext } from "@/context/capture-provider";
import { refreshMetadata } from "@/app/actions/tils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function getFaviconUrl(url: string): string {
  try {
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=64`;
  } catch {
    return "";
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function formatDate(dateStr: string) {
  return dateFormatter.format(new Date(dateStr));
}

export function TilItem({ til }: { til: Til }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { deletedIds } = useCaptureContext();
  const faviconUrl = getFaviconUrl(til.url);

  if (deletedIds.has(til.id)) return null;

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshMetadata(til.id, til.url);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Refreshed");
        router.refresh();
      }
    });
  };

  return (
    <li className="flex items-center group/row gap-4 py-1">
      <div className="flex items-center gap-2 min-w-0 w-full">
        <Tooltip>
          <TooltipTrigger
            onClick={handleRefresh}
            disabled={isPending}
            className="relative size-4 shrink-0 group/favicon cursor-pointer"
          >
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt={`${til.title ?? til.url} icon`}
                className={cn(
                  "size-4 rounded-sm transition-opacity group-hover/favicon:opacity-0",
                  { "opacity-0": isPending },
                )}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe
                className={cn(
                  "size-4 transition-opacity group-hover/favicon:opacity-0",
                  { "opacity-0": isPending },
                )}
              />
            )}
            <RefreshCw
              className={cn(
                "absolute inset-0 size-4 text-muted-foreground opacity-0 transition-opacity group-hover/favicon:opacity-100",
                { "opacity-100 animate-spin": isPending },
              )}
            />
          </TooltipTrigger>
          <TooltipContent>Refresh metadata</TooltipContent>
        </Tooltip>
        <Link
          href={til.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-color w-full flex gap-1 text-sm items-center group font-medium group-hover/row:text-foreground min-w-0 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
        >
          <span className="truncate">{til.title ?? til.url}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground group-hover/row:text-foreground transition-colors" />
        </Link>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatDate(til.created_at)}
        </span>
        <TilActions key={til.id} tilId={til.id} url={til.url} />
      </div>
    </li>
  );
}
