"use client";

export function ChatInput() {
  return (
    <div className="fixed inset-x-0 bottom-2 bg-background">
      <div className="mx-auto flex h-14 max-w-2xl items-center px-6">
        <input
          type="text"
          placeholder="Ask me anything."
          className="h-12 w-full rounded-full border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
