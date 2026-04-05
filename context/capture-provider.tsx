"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { createTil, deleteTil } from "@/app/actions/tils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSound } from "@/hooks/use-app-sound";
import { clickSoftSound } from "@/sounds/click-soft";
import { useAppHaptics } from "@/context/haptics-provider";

type PendingTil = {
  id: string;
  url: string;
};

type CaptureContextType = {
  pendingTils: PendingTil[];
  deletedIds: Set<string>;
  optimisticDelete: (id: string) => void;
  capture: (text: string) => void;
};

const CaptureContext = createContext<CaptureContextType>({
  pendingTils: [],
  deletedIds: new Set(),
  optimisticDelete: () => {},
  capture: () => {},
});

export function useCaptureContext() {
  return useContext(CaptureContext);
}

export function usePendingTils() {
  return useContext(CaptureContext).pendingTils;
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingTils, setPendingTils] = useState<PendingTil[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [playDrop] = useAppSound(clickSoftSound);
  const trigger = useAppHaptics();

  const removeDeletedId = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const optimisticDelete = useCallback(
    (id: string) => {
      setDeletedIds((prev) => new Set(prev).add(id));

      startTransition(async () => {
        const result = await deleteTil(id);

        if (result.error) {
          removeDeletedId(id);
          toast.error(result.error);
        } else {
          toast.success("Link deleted");
          startTransition(() => {
            router.refresh();
            removeDeletedId(id);
          });
        }
      });
    },
    [router, startTransition, removeDeletedId],
  );

  const capture = useCallback(
    (text: string) => {
      if (!text.match(/^https?:\/\//)) return;

      const tempId = crypto.randomUUID();
      playDrop();
      trigger("success");
      setPendingTils((prev) => [{ id: tempId, url: text }, ...prev]);
      toast.success("Link saved");

      startTransition(async () => {
        const result = await createTil(text);

        if (result.error) {
          setPendingTils((prev) => prev.filter((t) => t.id !== tempId));
          toast.error(result.error);
        } else {
          startTransition(() => {
            router.refresh();
            setPendingTils((prev) => prev.filter((t) => t.id !== tempId));
          });
        }
      });
    },
    [router, startTransition, playDrop, trigger],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      if (!text.match(/^https?:\/\//)) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable
      )
        return;

      e.preventDefault();
      capture(text);
    },
    [capture],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const value = useMemo(
    () => ({ pendingTils, deletedIds, optimisticDelete, capture }),
    [pendingTils, deletedIds, optimisticDelete, capture],
  );

  return <CaptureContext value={value}>{children}</CaptureContext>;
}
