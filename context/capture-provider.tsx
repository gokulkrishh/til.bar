"use client";

import { useEffect, useCallback, useState, useTransition } from "react";
import { createTil } from "@/app/actions/tils";
import { useRouter } from "next/navigation";

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    "idle" | "capturing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      // Only capture if it looks like a URL
      if (!text.match(/^https?:\/\//)) return;

      // Don't capture if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      setStatus("capturing");
      setMessage("Capturing...");

      startTransition(async () => {
        const result = await createTil(text);
        if (result.error) {
          setStatus("error");
          setMessage(result.error);
        } else {
          setStatus("success");
          setMessage("Captured!");
          router.refresh();
        }

        setTimeout(() => setStatus("idle"), 2000);
      });
    },
    [router, startTransition],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <>
      {children}
      {status !== "idle" && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-2 text-sm font-medium shadow-md ${
            status === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : status === "success"
                ? "border-border bg-background text-foreground"
                : "border-border bg-background text-muted-foreground"
          }`}
        >
          {message}
        </div>
      )}
    </>
  );
}
