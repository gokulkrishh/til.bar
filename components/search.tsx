"use client";

import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useSearch } from "@/context/search-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchButton() {
  const { query, setQuery, isOpen, open, close } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
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

  if (!isOpen) {
    return (
      <Button
        size="icon-lg"
        variant="ghost"
        onClick={open}
        aria-label="Search links"
        className="rounded-full"
      >
        <Search aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="relative flex gap-2">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search links..."
          aria-label="Search links"
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-64 pl-9 pr-8 text-sm rounded-full"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <Button
        size="icon-lg"
        variant="ghost"
        onClick={close}
        aria-label="Close search"
        className="rounded-full"
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
