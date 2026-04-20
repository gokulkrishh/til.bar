import { TilWithTags } from "@/lib/types";

const now = new Date();

const today = (hours: number, minutes: number) => {
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const yesterday = (hours: number, minutes: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const earlier = (daysAgo: number, hours: number, minutes: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const USER_ID = "41d10afa-f77c-4968-ad81-57aesasdaf674";

const tag = (id: string, name: string) => ({
  id,
  name,
  user_id: USER_ID,
  created_at: earlier(5, 10, 0),
});

const tags = {
  ai: tag("42cbd89f-62fc-4bc6-b114-e15a85fdss07", "ai"),
  design: tag("6d38bf1e-0901-467e-b727-00f79932404c", "design"),
  css: tag("851727f6-8430-457d-9421-a61b15a0fc21", "css"),
  javascript: tag("2d1e1dff-32fa-48b0-89d5-a3e7d4c96a29", "javascript"),
  automation: tag("bd6b051a-875c-4b08-b732-bd77ddc5d8e4", "automation"),
  analysis: tag("42cbd89f-62fc-4bc6-b114-e15a85fd6b07", "analysis"),
  audio: tag("03292e25-3a25-415e-8a39-6f37d1585bb0", "audio"),
  github: tag("ac40eeff-82e4-4e15-b3ed-2ed265e46b60", "github"),
  accessibility: tag("6763cb1c-ac5f-45ee-a24d-cf720a38a6ac", "accessibility"),
  haptics: tag("019944a4-7413-46c1-839d-3ae08306a016", "haptics"),
  icons: tag("c7bfa3d7-f8af-45a3-8938-0ec6fe360e64", "icons"),
  ux: tag("7a495943-714d-4d4a-883c-a7023f2e3869", "ux-principles"),
  notes: tag("37d4a462-2e1f-4080-a05d-00fb42296404", "notes"),
};

export const DEMO_ITEMS: TilWithTags[] = [
  // Today
  {
    id: "fde33db0-600a-4b46-82ad-95d887cd4f3d",
    user_id: USER_ID,
    url: "https://x.com",
    title: "1 million context window: Now GA for Claude Opus 4.6",
    description:
      "Anthropic has announced that their latest model, Claude Opus 4.6, is now generally available with a context window of up to 1 million tokens, enabling it to process and understand much larger inputs than before.",
    created_at: today(14, 12),
    tags: [tags.ai],
  },
  {
    id: "277ddd13-7124-4aec-be67-e48813e39a71",
    user_id: USER_ID,
    url: "https://github.com",
    title: "AI Exposure of the US Job Market",
    description: null,
    created_at: today(11, 23),
    tags: [tags.analysis, tags.ai],
  },
  {
    id: "0c302aa3-a24d-47a5-b80d-33d7bb43a141",
    user_id: USER_ID,
    url: "https://dither.neato.fun/",
    title: "Dither — Vector Dither Tool",
    description:
      "Convert images and gradients into scalable vector dither patterns. Bayer, halftone, dots, lines, and more. Export as SVG or PNG.",
    created_at: today(9, 54),
    tags: [tags.design],
  },
  {
    id: "5a6260da-9d60-4fcf-ab08-6f96d0a22c11",
    user_id: USER_ID,
    url: "https://x.com/jollytanpreet/status/2033128255424000289?s=12",
    title: "Browser-Whisper: Offline Audio Transcription",
    description:
      "A web-based tool for private audio-to-text transcription using WebGPU and WebCodecs that requires no backend or API keys.",
    created_at: today(8, 37),
    tags: [tags.audio, tags.ai],
  },
  // Yesterday
  {
    id: "23ed1249-40cf-40c5-b0d4-2c69f3945798",
    user_id: USER_ID,
    url: "https://bazza.dev/craft/2026/hit-area",
    title: "Expand hit area with TailwindCSS",
    description:
      "Utility classes in TailwindCSS to enlarge the clickable area of interactive elements.",
    created_at: yesterday(19, 40),
    tags: [tags.accessibility, tags.css],
  },
  {
    id: "85ae3431-0570-42b2-a5e5-3e54f579a1b3",
    user_id: USER_ID,
    url: "https://agent-browser.dev/",
    title: "Headless Browser Automation for AI | agent-browser",
    description: "Headless browser automation CLI for AI agents",
    created_at: yesterday(15, 22),
    tags: [tags.automation, tags.ai],
  },
  {
    id: "79448a5f-2263-4dbb-a382-c815f2a8b1d5",
    user_id: USER_ID,
    url: "https://x.com/_kaitodev/status/2032927164883153402",
    title: "AI Job Exposure Analysis",
    description:
      "Analysis of AI exposure in US jobs, scoring occupations on a 0-10 scale using an LLM and visualizing results.",
    created_at: yesterday(12, 50),
    tags: [tags.analysis, tags.ai],
  },
  {
    id: "697dfa2f-d7ff-4ce1-b49b-793deacd901c",
    user_id: USER_ID,
    url: "https://lucide.dev/",
    title: "Lucide Icons",
    description:
      "Beautiful &amp; consistent icon toolkit made by the community.",
    created_at: yesterday(10, 43),
    tags: [tags.design, tags.icons],
  },
  {
    id: "09da0d43-fae2-4c3b-86ac-358b35f611d2",
    user_id: USER_ID,
    url: "https://haptics.lochie.me/",
    title: "WebHaptics – Haptic feedback for the mobile web.",
    description: "Haptic feedback for the mobile web.",
    created_at: yesterday(9, 0),
    tags: [tags.haptics, tags.javascript],
  },
  // Older
  {
    id: "5b94c581-6833-490e-a329-d188240bb864",
    user_id: USER_ID,
    url: "https://skills.sh/",
    title: "The Agent Skills Directory",
    description: "Discover and install skills for AI agents.",
    created_at: earlier(3, 14, 27),
    tags: [tags.ai],
  },
  {
    id: "411a2ce1-0060-4a2b-9b95-b9f23346a234",
    user_id: USER_ID,
    url: "https://gists.sh/",
    title: "gists.sh - Beautiful Gists",
    description:
      "gists.sh provides a beautifully designed interface for GitHub Gists, offering a more visually appealing way to view and share code snippets.",
    created_at: earlier(4, 17, 24),
    tags: [tags.notes, tags.github],
  },
  {
    id: "ddebc1b6-fac7-4ce5-b4f9-bc5aa8e6edda",
    user_id: USER_ID,
    url: "https://www.soundcn.xyz/",
    title: "soundcn - Free Sound Effects for Modern Web Apps",
    description:
      "700+ curated UI sound effects for modern web apps. Browse, preview, and install sounds with a single command.",
    created_at: earlier(4, 11, 52),
    tags: [tags.audio, tags.design],
  },
  {
    id: "7fa31958-3f1b-4fd3-8e58-f7c9fc5f63e3",
    user_id: USER_ID,
    url: "https://www.userinterface.wiki/laws-of-ux",
    title: "Laws of UX",
    description:
      "There&#x27;s a set of psychological principles behind every interface that feels right. Here are the ones I think about the most.",
    created_at: earlier(5, 11, 39),
    tags: [tags.design, tags.ux],
  },
];

const tagCounts = new Map<string, number>();
for (const item of DEMO_ITEMS) {
  for (const t of item.tags) {
    tagCounts.set(t.id, (tagCounts.get(t.id) ?? 0) + 1);
  }
}

export const DEMO_TAGS = Object.values(tags)
  .map((t) => ({ id: t.id, name: t.name, count: tagCounts.get(t.id) ?? 0 }))
  .filter((t) => t.count > 0)
  .sort((a, b) => a.name.localeCompare(b.name));
