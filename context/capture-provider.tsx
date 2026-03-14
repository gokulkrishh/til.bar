"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useTransition,
} from "react";
import { createTil } from "@/app/actions/tils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PendingTil = {
  id: string;
  url: string;
};

const CaptureContext = createContext<PendingTil[]>([]);

export function usePendingTils() {
  return useContext(CaptureContext);
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingTils, setPendingTils] = useState<PendingTil[]>([]);

  const capture = useCallback(
    (text: string) => {
      if (!text.match(/^https?:\/\//)) return;

      const tempId = crypto.randomUUID();
      setPendingTils((prev) => [{ id: tempId, url: text }, ...prev]);

      startTransition(async () => {
        const result = await createTil(text);

        if (result.error) {
          setPendingTils((prev) => prev.filter((t) => t.id !== tempId));
          toast.error(result.error);
        } else {
          toast.success("Saved");
          // Refresh first, then remove pending item so there's no gap
          startTransition(() => {
            router.refresh();
            setPendingTils((prev) => prev.filter((t) => t.id !== tempId));
          });
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

  return <CaptureContext value={pendingTils}>{children}</CaptureContext>;
}
