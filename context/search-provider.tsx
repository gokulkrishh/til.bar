"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SearchContextType = {
  query: string;
  setQuery: (query: string) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextType>({
  query: "",
  setQuery: () => {},
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  return (
    <SearchContext value={{ query, setQuery, isOpen, open, close }}>
      {children}
    </SearchContext>
  );
}
