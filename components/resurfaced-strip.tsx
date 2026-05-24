"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TilItem } from "@/components/til-item";
import { labelForResurfacedDate } from "@/lib/resurfaced";
import { useAppHaptics } from "@/context/haptics-provider";
import { useAppSound } from "@/hooks/use-app-sound";
import { useCaptureContext } from "@/context/capture-provider";
import type { TilWithTags } from "@/lib/types";

const WINDOW_ORDER = ["1 year ago", "6 months ago", "3 months ago"] as const;

export function ResurfacedStrip({ tils }: { tils: TilWithTags[] }) {
  const { deletedIds } = useCaptureContext();
  const [expanded, setExpanded] = useState(false);
  const click = useAppSound();
  const trigger = useAppHaptics();

  const visibleTils = tils.filter((til) => !deletedIds.has(til.id));

  const grouped = useMemo(() => {
    const map = new Map<(typeof WINDOW_ORDER)[number], TilWithTags[]>();
    for (const til of visibleTils) {
      const label = labelForResurfacedDate(til.created_at);
      const existing = map.get(label);
      if (existing) existing.push(til);
      else map.set(label, [til]);
    }
    return WINDOW_ORDER.flatMap((label) => {
      const items = map.get(label);
      return items ? [{ label, tils: items }] : [];
    });
  }, [visibleTils]);

  if (visibleTils.length === 0) return null;

  return (
    <section aria-label="From your archive" className="pt-4">
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => {
          click();
          trigger("light");
          setExpanded((v) => !v);
        }}
        aria-expanded={expanded}
        className="rounded-full h-7 gap-1.5"
      >
        <Sparkles className="size-3" aria-hidden="true" />
        {visibleTils.length} from your archive
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3 transition-transform duration-200", {
            "rotate-180": expanded,
          })}
        />
      </Button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="resurfaced-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-4">
              {grouped.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs inline-flex items-center gap-2 font-medium uppercase tracking-widest text-muted-foreground py-2.5">
                    {group.label}
                  </h3>
                  <ul className="relative flex flex-col gap-px">
                    {group.tils.map((til) => (
                      <TilItem key={til.id} til={til} showDate showYear />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
