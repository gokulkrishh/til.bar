"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCaptureContext } from "@/context/capture-provider";

const URL_REGEX = /https?:\/\/[^\s]+/;

function extractUrl(shared_url?: string, shared_text?: string): string | null {
  if (shared_url?.match(/^https?:\/\//)) return shared_url;
  if (shared_text) {
    const match = shared_text.match(URL_REGEX);
    if (match) return match[0];
  }
  return null;
}

export function ShareTargetHandler() {
  const searchParams = useSearchParams();
  const { capture } = useCaptureContext();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const sharedUrl = searchParams.get("shared_url") ?? undefined;
    const sharedText = searchParams.get("shared_text") ?? undefined;

    const url = extractUrl(sharedUrl, sharedText);
    if (!url) return;

    handled.current = true;
    capture(url);

    // Clean up query params so refresh doesn't re-trigger
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("shared_url");
    cleanUrl.searchParams.delete("shared_text");
    cleanUrl.searchParams.delete("shared_title");
    window.history.replaceState({}, "", cleanUrl.pathname);
  }, [searchParams, capture]);

  return null;
}
