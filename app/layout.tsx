import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/theme-provider";
import { SWRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { CaptureProvider } from "@/context/capture-provider";
import { SoundProvider } from "@/context/sound-provider";
import { Header } from "@/components/header";

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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    title,
    statusBarStyle: "default",
    startupImage: ["/apple-icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1917",
  userScalable: false,
  viewportFit: "cover",
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
            <TooltipProvider delay={1000}>
              <CaptureProvider>
                <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
                  <Header />
                  {children}
                </div>
              </CaptureProvider>
            </TooltipProvider>
          </SoundProvider>
          <Toaster richColors position="top-center" />
          <SWRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
