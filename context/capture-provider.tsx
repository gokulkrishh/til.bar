"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useTransition,
} from "react";
import { createTil, deleteTil } from "@/app/actions/tils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSound } from "@/hooks/use-app-sound";
import { drop003Sound } from "@/sounds/drop-003";
import { useAppHaptics } from "@/context/haptics-provider";

type PendingTil = {
  id: string;
  url: string;
};

type CaptureContextType = {
  pendingTils: PendingTil[];
  deletedIds: Set<string>;
  optimisticDelete: (id: string) => void;
};

const CaptureContext = createContext<CaptureContextType>({
  pendingTils: [],
  deletedIds: new Set(),
  optimisticDelete: () => {},
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
  const [playDrop] = useAppSound(drop003Sound);
  const trigger = useAppHaptics();

  const optimisticDelete = useCallback(
    (id: string) => {
      setDeletedIds((prev) => new Set(prev).add(id));

      startTransition(async () => {
        const result = await deleteTil(id);
        toast.success("Deleted");

        if (result.error) {
          setDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.error(result.error);
        } else {
          startTransition(() => {
            router.refresh();
            setDeletedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          });
        }
      });
    },
    [router, startTransition],
  );

  const capture = useCallback(
    (text: string) => {
      if (!text.match(/^https?:\/\//)) return;

      const tempId = crypto.randomUUID();
      playDrop();
      trigger("success");
      setPendingTils((prev) => [{ id: tempId, url: text }, ...prev]);
      toast.success("Saved");

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

  return (
    <CaptureContext value={{ pendingTils, deletedIds, optimisticDelete }}>
      {children}
    </CaptureContext>
  );
}
