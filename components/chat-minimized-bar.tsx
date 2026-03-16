"use client";

import { Maximize2, X } from "lucide-react";
import { Button } from "./ui/button";

type ChatMinimizedBarProps = {
  linkCount: number;
  messageCount: number;
  onExpand: () => void;
  onClose: () => void;
};

export function ChatMinimizedBar({
  linkCount,
  messageCount,
  onExpand,
  onClose,
}: ChatMinimizedBarProps) {
  return (
    <div key="minimized-bar">
      <div className="flex items-center bg-muted/50 dark:bg-input/30 backdrop-blur-sm justify-between rounded-full border border-input px-4 py-1.25 mb-2">
        <span className="text-sm text-muted-foreground">
          {linkCount > 0
            ? `Chat with ${linkCount} link${linkCount > 1 ? "s" : ""}`
            : "Chat"}
          {messageCount > 0 ? ` · ${messageCount} messages` : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={onExpand}
            aria-label="Expand chat"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            className="rounded-full"
            variant="ghost"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
