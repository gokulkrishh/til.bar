"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  useMemo,
} from "react";
import { ArrowUp, Link, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCaptureContext } from "@/context/capture-provider";
import { useChatContext } from "@/context/chat-provider";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import type { User } from "@supabase/supabase-js";

const urlSchema = z.url().check(z.startsWith("http"));

export function ChatInput({ user }: { user: User }) {
  const [input, setInput] = useState("");
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
  const isChatMode = attachedTils.length > 0;
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

      if (isChatMode) {
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
      } else {
        const result = urlSchema.safeParse(trimmed);
        if (result.success) {
          capture(result.data);
          setInput("");
        }
      }
    },
    [input, isChatMode, send, capture, attachedTils],
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
      <div className="mx-auto flex flex-col max-w-2xl px-6 py-2">
        {/* Chat messages */}
        {isChatMode && messages.length > 0 && (
          <div className="relative">
            <Button
              onClick={() => {
                clearAttachment();
                setMessages([]);
                setInput("");
              }}
              size="xs"
              className="rounded-full absolute -top-10 right-1 flex items-center justify-center text-muted-foreground hover:text-foreground"
              variant="secondary"
            >
              <X className="size-3" aria-hidden="true" />
              Close chat
            </Button>
            <div className="relative max-h-80 border overflow-y-auto mb-3 flex flex-col gap-3 p-4 rounded-md">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("text-sm flex gap-2 max-w-[85%]", {
                    "self-end flex-row-reverse text-foreground":
                      message.role === "user",
                    "self-start text-foreground": message.role === "assistant",
                  })}
                >
                  {message.role === "user" ? (
                    <Avatar className="size-6 shrink-0">
                      <AvatarImage src={avatarUrl} alt={fullName} />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="size-6 shrink-0 bg-black">
                      <AvatarImage src="/logo.svg" alt="AI logo" />
                      <AvatarFallback className="font-bold text-xs text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "whitespace-pre-wrap text-foreground rounded-2xl px-3 py-2",
                      {
                        "bg-primary text-primary-foreground":
                          message.role === "user",
                        "bg-muted": message.role === "assistant",
                      },
                    )}
                  >
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <span key={i}>{part.text}</span>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="text-sm text-foreground flex gap-2 self-start max-w-[85%]">
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="ai-avatar font-bold text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-3 py-2">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Attached TIL chips */}
        {isChatMode && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {attachedTils.map((til) => (
              <Badge
                key={til.id}
                variant="secondary"
                className="gap-1 max-w-full"
              >
                <Link className="size-3 mr-1" />
                <span className="truncate">{til.title ?? til.url}</span>
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

        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            type="text"
            name={isChatMode ? "message" : "url"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              isChatMode
                ? "Ask a question about these links\u2026"
                : "Paste a link"
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
              "absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full",
            )}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {isChatMode
            ? "AI can make mistakes. Please verify the output."
            : "Paste a URL to save it."}
        </p>
      </div>
    </div>
  );
}
