"use client";

import { useState, useCallback, type ClipboardEvent, ChangeEvent } from "react";
import { ArrowUp } from "lucide-react";
import { useCaptureContext } from "@/context/capture-provider";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const [value, setValue] = useState("");
  const { capture } = useCaptureContext();

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      if (!text.match(/^https?:\/\//)) return;

      e.preventDefault();
      capture(text);
      setValue("");
    },
    [capture],
  );

  const handleSubmit = useCallback(
    (e: ChangeEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      capture(trimmed);
      setValue("");
    },
    [value, capture],
  );

  return (
    <div className="fixed inset-x-0 bottom-2 bg-background">
      <div className="mx-auto flex flex-col gap-2 max-w-2xl px-6">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste a link here..."
            className="h-12 w-full rounded-full border border-input bg-transparent px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity",
              { "opacity-0 pointer-events-none": !value.trim() },
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Paste a URL to save it.
        </p>
      </div>
    </div>
  );
}
