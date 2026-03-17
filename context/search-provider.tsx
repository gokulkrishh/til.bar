"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

type SearchContextType = {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextType>({
  query: "",
  debouncedQuery: "",
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }, []);

  return (
    <SearchContext
      value={{ query, debouncedQuery, setQuery, isOpen, open, close }}
    >
      {children}
    </SearchContext>
  );
}
