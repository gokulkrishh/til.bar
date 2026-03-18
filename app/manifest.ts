import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest & {
  share_target: Record<string, unknown>;
} {
  return {
    name: "til.bar",
    short_name: "til.bar",
    description: "Capture all your links in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    share_target: {
      action: "/",
      method: "GET",
      params: {
        url: "shared_url",
        text: "shared_text",
        title: "shared_title",
      },
    },
  };
}
