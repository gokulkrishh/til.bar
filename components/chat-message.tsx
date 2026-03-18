"use client";

import type { UIMessage } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { createCodePlugin } from "@streamdown/code";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const code = createCodePlugin({
  themes: ["github-light", "github-dark"],
});

type ChatMessageProps = {
  message: UIMessage;
  avatarUrl?: string;
  fullName?: string;
  initials?: string;
  isStreaming?: boolean;
};

export function ChatMessage({
  message,
  avatarUrl,
  fullName,
  initials,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("text-sm flex gap-2 md:max-w-[85%]", {
        "self-end flex-row-reverse text-foreground": isUser,
        "self-start text-foreground": !isUser,
      })}
    >
      {isUser ? (
        <Avatar className="size-6 shrink-0">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
        className={cn("rounded-2xl bg-muted py-2 px-3 w-full", {
          "bg-primary text-primary-foreground": isUser,
        })}
      >
        {message.parts.map((part) => {
          if (part.type !== "text") return null;
          return isUser ? (
            <span key={`${message.id}-${part.type}`}>{part.text}</span>
          ) : (
            <Streamdown
              linkSafety={{ enabled: false }}
              key={`${message.id}-${part.type}`}
              isAnimating={isStreaming}
              plugins={{ code }}
              lineNumbers
            >
              {part.text}
            </Streamdown>
          );
        })}
      </div>
    </div>
  );
}

export function ChatMessageLoading() {
  return (
    <div className="text-sm text-foreground flex gap-2 self-start md:max-w-[85%]">
      <Avatar className="size-6 shrink-0 bg-black animate-spin">
        <AvatarImage src="/logo.svg" alt="AI logo" />
        <AvatarFallback className="font-bold text-xs text-white">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl px-3 py-2">Thinking…</div>
    </div>
  );
}
