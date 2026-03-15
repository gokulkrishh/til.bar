"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  useMemo,
} from "react";
import { ArrowUp, LinkIcon, Maximize2, Minus, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCaptureContext } from "@/context/capture-provider";
import { useChatContext } from "@/context/chat-provider";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { z } from "zod";
import { ChatMessage, ChatMessageLoading } from "./chat-message";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { SuggestedIcon } from "./icons/suggested";

const urlSchema = z.url().check(z.startsWith("http"));

const suggestionPrompts = [
  "Write me a TIL from this",
  "Why is this worth remembering?",
  "Explain this simply",
];

export function ChatInput({ user }: { user: User }) {
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const { capture } = useCaptureContext();
  const { attachedTils, removeTil, clearAttachment } = useChatContext();

  const {
    messages,
    sendMessage: send,
    status,
    setMessages,
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

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? user.email ?? "";
  const initials = useMemo(() => {
    return fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [fullName]);

  return (
    <div className="fixed inset-x-0 bottom-0 bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex flex-col max-w-2xl px-2 py-2">
        {/* Minimized bar */}
        {isChatMode && minimized && (
          <div className="flex items-center dark:bg-input/30 border-input bg-transparent justify-between rounded-full border px-4 py-1.25 mb-2">
            <span className="text-sm text-muted-foreground">
              {attachedTils.length > 0
                ? `Chat with ${attachedTils.length} link${attachedTils.length > 1 ? "s" : ""}`
                : "Chat"}
              {messages.length > 0 ? ` · ${messages.length} messages` : ""}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={() => setMinimized(false)}
                aria-label="Expand chat"
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                className="rounded-full"
                variant="ghost"
                onClick={() => {
                  clearAttachment();
                  setMessages([]);
                  setInput("");
                  setMinimized(false);
                  setChatActive(false);
                }}
                aria-label="Close chat"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {isChatMode && !minimized && messages.length > 0 && (
          <div>
            <div className="flex items-center justify-end gap-1 mb-2">
              <Button
                onClick={() => setMinimized(true)}
                size="xs"
                className="rounded-full"
                variant="secondary"
              >
                <Minus className="size-3" aria-hidden="true" />
                Minimize
              </Button>
              <Button
                onClick={() => {
                  clearAttachment();
                  setMessages([]);
                  setInput("");
                  setChatActive(false);
                }}
                size="xs"
                className="rounded-full"
                variant="secondary"
              >
                <X className="size-3" aria-hidden="true" />
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] border border-muted shadow overflow-y-auto mb-3 flex flex-col gap-6 px-3 py-4 rounded-xl">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  avatarUrl={avatarUrl}
                  fullName={fullName}
                  initials={initials}
                  isStreaming={
                    status === "streaming" &&
                    message.id === messages[messages.length - 1]?.id
                  }
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <ChatMessageLoading />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Suggestion prompts — show before first message */}
        {isChatMode && !minimized && messages.length === 0 && (
          <div className="flex flex-col items-end gap-2 mb-2 flex-wrap">
            {suggestionPrompts.map((prompt) => (
              <Badge
                size="lg"
                key={prompt}
                variant="outline"
                onClick={() => {
                  send(
                    { text: prompt },
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
                }}
                className="cursor-pointer hover:bg-muted"
              >
                <SuggestedIcon className="size-2.75 mr-1" />
                {prompt}
              </Badge>
            ))}
          </div>
        )}

        {/* Attached TIL chips */}
        {isChatMode && !minimized && (
          <div className="flex pl-1.5 items-center gap-2 mb-2.5 flex-wrap">
            {attachedTils.map((til) => (
              <Badge
                key={til.id}
                variant="secondary"
                className="gap-1 flex flex-row"
              >
                <LinkIcon className="size-2.75 mr-0.75" />
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
                className="h-12 w-full rounded-full border bg-transparent px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="submit"
                disabled={isLoading}
                aria-label={isChatMode ? "Send message" : "Save link"}
                className={cn(
                  "absolute right-2 rounded-full top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center",
                )}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
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
