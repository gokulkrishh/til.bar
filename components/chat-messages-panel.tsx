"use client";

import type { RefObject } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Minus, X } from "lucide-react";
import { Button } from "./ui/button";
import { ChatMessage, ChatMessageLoading } from "./chat-message";

type ChatMessagesPanelProps = {
  messages: UIMessage[];
  status: string;
  avatarUrl?: string;
  fullName: string;
  initials: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onMinimize: () => void;
  onClose: () => void;
};

export function ChatMessagesPanel({
  messages,
  status,
  avatarUrl,
  fullName,
  initials,
  messagesEndRef,
  onMinimize,
  onClose,
}: ChatMessagesPanelProps) {
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div key="chat-messages">
      <div className="flex items-center justify-end gap-1 mb-2">
        <Button
          onClick={onMinimize}
          size="xs"
          className="rounded-full"
          variant="secondary"
        >
          <Minus className="size-3" aria-hidden="true" />
          Minimize
        </Button>
        <Button
          onClick={onClose}
          size="xs"
          className="rounded-full"
          variant="secondary"
        >
          <X className="size-3" aria-hidden="true" />
          Close
        </Button>
      </div>
      <div className="max-h-[60vh] border border-border/40 shadow-lg shadow-black/5 overflow-y-auto mb-3 flex flex-col gap-6 px-3 py-4 rounded-2xl">
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
  );
}
