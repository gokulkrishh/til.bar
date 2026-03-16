"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

type AttachedTil = {
  id: string;
  url: string;
  title: string | null;
  description?: string | null;
};

type ChatContextType = {
  attachedTils: AttachedTil[];
  attachTil: (til: AttachedTil) => void;
  removeTil: (id: string) => void;
  clearAttachment: () => void;
};

const ChatContext = createContext<ChatContextType>({
  attachedTils: [],
  attachTil: () => {},
  removeTil: () => {},
  clearAttachment: () => {},
});

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [attachedTils, setAttachedTils] = useState<AttachedTil[]>([]);

  const attachTil = useCallback((til: AttachedTil) => {
    setAttachedTils((prev) =>
      prev.some((t) => t.id === til.id) ? prev : [...prev, til],
    );
  }, []);

  const removeTil = useCallback((id: string) => {
    setAttachedTils((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAttachment = useCallback(() => {
    setAttachedTils([]);
  }, []);

  const value = useMemo(
    () => ({ attachedTils, attachTil, removeTil, clearAttachment }),
    [attachedTils, attachTil, removeTil, clearAttachment],
  );

  return <ChatContext value={value}>{children}</ChatContext>;
}
