import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/theme-provider";
import { SWRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { CaptureProvider } from "@/context/capture-provider";
import { SoundProvider } from "@/context/sound-provider";
import { HapticsProvider } from "@/context/haptics-provider";
import { Header } from "@/components/header";
import { ShareTargetHandler } from "@/components/share-target-handler";
import { ChatProvider } from "@/context/chat-provider";
import { SearchProvider } from "@/context/search-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "til.bar";
const description = "Capture all your links in one place.";

export const metadata: Metadata = {
  metadataBase: new URL("https://til.bar"),
  alternates: { canonical: "/" },
  title: "til.bar",
  description: "Capture all your links in one place.",
  twitter: {
    card: "summary_large_image",
    title,
    site: "@gokul_i",
    description,
    creator: "@gokul_i",
    images: [
      {
        type: "image/svg+xml",
        url: "/og.svg",
        width: 1920,
        height: 1080,
        alt: "til.bar",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "til.bar",
    title,
    description,
    url: "https://til.bar",
    images: [
      {
        type: "image/svg+xml",
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "til.bar",
      },
    ],
  },
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      media: "(prefers-color-scheme: light)",
      url: "/logo-dark.svg",
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      media: "(prefers-color-scheme: dark)",
      url: "/logo-light.svg",
    },
  ],
  appleWebApp: {
    title,
    statusBarStyle: "default",
    startupImage: ["/512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "light dark",
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SoundProvider>
            <HapticsProvider>
              <TooltipProvider delay={1000}>
                <SearchProvider>
                  <CaptureProvider>
                    <ChatProvider>
                      <div className="mx-auto flex h-screen max-w-2xl flex-col px-4">
                        <Header />
                        {children}
                      </div>
                      <Suspense>
                        <ShareTargetHandler />
                      </Suspense>
                    </ChatProvider>
                  </CaptureProvider>
                </SearchProvider>
              </TooltipProvider>
            </HapticsProvider>
          </SoundProvider>
          <Toaster richColors position="top-center" />
          <SWRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
