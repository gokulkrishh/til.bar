"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight, Globe02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Til } from "@/lib/types";
import Link from "next/link";
import { TilActions } from "@/components/til-actions";

function getFaviconUrl(url: string): string {
  try {
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=64`;
  } catch {
    return "";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TilItem({ til }: { til: Til }) {
  const faviconUrl = getFaviconUrl(til.url);

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg py-3">
      <div className="flex items-center gap-2 min-w-0 w-full">
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={`${til.title ?? til.url} icon`}
            className="size-4 shrink-0 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <HugeiconsIcon icon={Globe02Icon} className="size-4" />
        )}
        <Link
          href={til.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex gap-1 text-sm items-center group font-medium text-foreground hover:underline hover:underline-offset-2 truncate focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
        >
          {til.title ?? til.url}
          <HugeiconsIcon
            icon={ArrowUpRight}
            className="size-4 transition-colors opacity-0 group-hover:opacity-100"
          />
        </Link>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground mr-1">
          {formatDate(til.created_at)}
        </span>
        <TilActions tilId={til.id} url={til.url} />
      </div>
    </li>
  );
}
