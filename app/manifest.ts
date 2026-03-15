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
    background_color: "#1a1917",
    theme_color: "#1a1917",
    icons: [
      {
        src: "/192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/512.png",
        sizes: "512x512",
        type: "image/png",
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
