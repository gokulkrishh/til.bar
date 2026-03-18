"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
} from "react";
import { AnimatePresence } from "motion/react";
import { ArrowUp, LinkIcon, Square, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCaptureContext } from "@/context/capture-provider";
import { useChatContext } from "@/context/chat-provider";
import { useAppHaptics } from "@/context/haptics-provider";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { ChatMinimizedBar } from "./chat-minimized-bar";
import { ChatMessagesPanel } from "./chat-messages-panel";
import { ChatSuggestions } from "./chat-suggestions";

const urlSchema = z.url().check(z.startsWith("http"));

export function ChatInput({ user }: { user: User }) {
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const { capture } = useCaptureContext();
  const { attachedTils, removeTil, clearAttachment } = useChatContext();
  const trigger = useAppHaptics();

  const {
    messages,
    sendMessage: send,
    status,
    setMessages,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatActive, setChatActive] = useState(false);
  const isChatMode = attachedTils.length > 0 || chatActive;
  const isLoading = status === "submitted" || status === "streaming";

  // Focus input when a TIL is attached
  useEffect(() => {
    if (isChatMode) {
      inputRef.current?.focus();
    }
  }, [isChatMode]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Always capture URLs on paste, regardless of mode
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      const result = urlSchema.safeParse(text);
      if (!result.success) return;

      e.preventDefault();
      capture(result.data);
    },
    [capture],
  );

  const handleSubmit = useCallback(
    (e: React.ChangeEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      // If it's a URL, always capture it
      const result = urlSchema.safeParse(trimmed);
      if (result.success) {
        capture(result.data);
        setInput("");
        return;
      }

      // Non-URL text → send as chat message (with or without attachments)
      if (!chatActive) setChatActive(true);
      send(
        { text: trimmed },
        {
          body: {
            tils: attachedTils.map((t) => ({
              url: t.url,
              title: t.title,
              description: t.description,
            })),
          },
        },
      );
      setInput("");
    },
    [input, chatActive, send, capture, attachedTils],
  );

  const closeChat = useCallback(() => {
    trigger("light");
    stop();
    clearAttachment();
    setMessages([]);
    setInput("");
    setMinimized(false);
    setChatActive(false);
  }, [trigger, stop, clearAttachment, setMessages]);

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? user.email ?? "";
  const initials = getInitials(fullName);

  return (
    <div className="fixed inset-x-0 bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/30 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex flex-col max-w-2xl px-3 py-2">
        {/* Minimized bar */}
        <AnimatePresence initial={false}>
          {isChatMode && minimized && (
            <ChatMinimizedBar
              linkCount={attachedTils.length}
              messageCount={messages.length}
              onExpand={() => {
                trigger("light");
                setMinimized(false);
              }}
              onClose={closeChat}
            />
          )}
        </AnimatePresence>

        {/* Chat messages */}
        <AnimatePresence initial={false}>
          {isChatMode && !minimized && messages.length > 0 && (
            <ChatMessagesPanel
              messages={messages}
              status={status}
              avatarUrl={avatarUrl}
              fullName={fullName}
              initials={initials}
              messagesEndRef={messagesEndRef}
              onMinimize={() => {
                trigger("light");
                setMinimized(true);
              }}
              onClose={closeChat}
            />
          )}
        </AnimatePresence>

        {/* Suggestion prompts — show before first message */}
        <AnimatePresence>
          {isChatMode && !minimized && messages.length === 0 && (
            <ChatSuggestions attachedTils={attachedTils} onSend={send} />
          )}
        </AnimatePresence>

        {/* Attached TIL chips */}
        {isChatMode && !minimized && (
          <div className="flex pl-1.5 items-center gap-2 mb-2.5 flex-wrap">
            {attachedTils.map((til) => (
              <Badge
                key={til.id}
                variant="secondary"
                className="gap-1 flex flex-row"
              >
                <LinkIcon aria-hidden="true" className="size-2.75 mr-0.75" />
                <Link href={til.url} target="_blank">
                  <span className="truncate">{til.title ?? til.url}</span>
                </Link>
                <button
                  onClick={() => {
                    removeTil(til.id);
                    if (attachedTils.length === 1) {
                      setMessages([]);
                    }
                  }}
                  aria-label="Remove attached link"
                  className="shrink-0 cursor-pointer"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {!(isChatMode && minimized) && (
          <>
            <form onSubmit={handleSubmit} className="relative">
              <Input
                ref={inputRef}
                type="text"
                name={isChatMode ? "message" : "url"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder={
                  attachedTils.length > 1
                    ? "Ask about these links…"
                    : attachedTils.length === 1
                      ? "Ask about this link…"
                      : "Ask about your saved links…"
                }
                aria-label={isChatMode ? "Chat message" : "URL to save"}
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-full border bg-transparent shadow-sm px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {isLoading ? (
                <Button
                  type="button"
                  onClick={stop}
                  aria-label="Stop generating"
                  className="absolute right-2 rounded-full top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center"
                >
                  <Square
                    aria-hidden="true"
                    className="size-3.5 fill-current"
                  />
                </Button>
              ) : (
                <Button
                  type="submit"
                  aria-label={isChatMode ? "Send message" : "Save link"}
                  className="absolute right-2 rounded-full top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center"
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
              )}
            </form>
            <p
              className={cn("text-center text-xs text-muted-foreground mt-2", {
                "max-sm:opacity-0 max-sm:mt-0": !isChatMode,
              })}
            >
              {isChatMode
                ? "AI can make mistakes. Verify the output."
                : "Tip: Copy and Paste link anywhere to save."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
