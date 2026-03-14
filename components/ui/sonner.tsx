"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      className="toaster group"
      gap={8}
      toastOptions={{
        style: {
          gap: "0.125rem",
          padding: "0.25rem 0.75rem",
          width: "fit-content",
          maxWidth: "20rem",
          margin: "0 auto",
          borderRadius: "9999px",
        },
        className: "[&_[data-icon]>svg]:size-4",
      }}
      {...props}
    />
  );
}

export { Toaster };
