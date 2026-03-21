"use client";

import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { SuggestedIcon } from "./icons/suggested";

type AttachedTil = {
  url: string;
  title: string | null;
  description?: string | null;
};

const suggestionPrompts = [
  "Write me a TIL from this",
  "Why is this worth remembering?",
  "Explain this simply",
];

type ChatSuggestionsProps = {
  attachedTils: AttachedTil[];
  onSend: (
    text: { text: string },
    options: {
      body: {
        tils: {
          url: string;
          title: string | null;
          description?: string | null;
        }[];
      };
    },
  ) => void;
};

export function ChatSuggestions({
  attachedTils,
  onSend,
}: ChatSuggestionsProps) {
  const tilsBody = attachedTils.map((t) => ({
    url: t.url,
    title: t.title,
    description: t.description,
  }));

  return (
    <div
      key="suggestions"
      className="flex flex-col items-end gap-2 mb-2 flex-wrap mx-2"
    >
      {suggestionPrompts.map((prompt) => (
        <motion.div key={prompt}>
          <Badge
            size="lg"
            variant="outline"
            onClick={() =>
              onSend({ text: prompt }, { body: { tils: tilsBody } })
            }
            className="cursor-pointer backdrop-blur-sm bg-input/30 border-border/40 hover:bg-muted/80 transition-[color,background-color,border-color] duration-200"
          >
            <SuggestedIcon aria-hidden="true" className="size-2.75 mr-1" />
            {prompt}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}
