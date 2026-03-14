"use client";

import { ArrowUpRight, Globe } from "lucide-react";
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
    <li className="flex items-center group/row gap-4 rounded-lg py-3">
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
          <Globe className="size-4" />
        )}
        <Link
          href={til.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-1 text-sm items-center group font-medium text-foreground min-w-0 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
        >
          <span className="truncate">{til.title ?? til.url}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors" />
        </Link>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatDate(til.created_at)}
        </span>
        <TilActions tilId={til.id} url={til.url} />
      </div>
    </li>
  );
}
