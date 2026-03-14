"use client";

import { useEffect, useCallback, useTransition } from "react";
import { createTil } from "@/app/actions/tils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const capture = useCallback(
    (text: string) => {
      if (!text.match(/^https?:\/\//)) return;

      startTransition(async () => {
        const result = await createTil(text);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Saved");
          router.refresh();
        }
      });
    },
    [router, startTransition],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      if (!text.match(/^https?:\/\//)) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.isContentEditable) return;

      e.preventDefault();
      capture(text);
    },
    [capture],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return <>{children}</>;
}
