"use client";

import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { useSearch } from "@/context/search-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchButton() {
  const { query, setQuery, isOpen, open, close } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        close();
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open, close]);

  return (
    <div className="flex items-center gap-1">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="search-input"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ originX: 1 }}
          >
            <div className="relative flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search links… ⌘K"
                aria-label="Search links"
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-64 pl-4 pr-8 text-sm rounded-full bg-muted/50 backdrop-blur-sm"
              />
              {query && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setQuery("")}
                  className="rounded-full absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon-lg"
        variant="ghost"
        onClick={isOpen ? close : open}
        aria-label={isOpen ? "Close search" : "Search links"}
        className="rounded-full"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="search"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Search aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
