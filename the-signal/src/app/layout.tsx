import type { Metadata, Viewport } from "next";
import { Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SignalProvider } from "@/context/SignalContext";
import { GlobalCanvas } from "@/components/GlobalCanvas";
import { HUD } from "@/components/HUD";
import { SignalEngineHost } from "@/components/SignalEngineHost";
import { RadialNav } from "@/components/RadialNav";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YASHOVARDHAN THOPTE — THE SIGNAL",
  description:
    "Systems engineer, AI researcher, and dual-degree scholar. B.E. Computer Engineering (Mumbai University) × B.S. Data Science & Applications (IIT Madras). PCSA-UNet, ValuRipple, and more.",
  keywords: [
    "Yashovardhan Thopte",
    "AI researcher",
    "deep learning",
    "IIT Madras",
    "portfolio",
    "WebGPU",
    "systems engineer",
  ],
  authors: [{ name: "Yashovardhan Thopte" }],
  openGraph: {
    title: "YASHOVARDHAN THOPTE — THE SIGNAL",
    description: "Engineering intelligence beyond systems.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${inter.variable}`}>
      <body className="bg-black text-white overflow-hidden scanlines">
        <SignalProvider>
          {/* Persistent GPU canvas — never unmounts */}
          <GlobalCanvas />

          {/* HUD overlay — audio toggle, neural mode, etc. */}
          <HUD />
          <SignalEngineHost />
          <RadialNav />

          {/* Page content */}
          <main id="signal-overlay" role="main">
            {children}
          </main>
        </SignalProvider>

        {/* Screen-reader accessible content summary */}
        <div className="sr-only" aria-live="polite" id="sr-announcer" />
      </body>
    </html>
  );
}
