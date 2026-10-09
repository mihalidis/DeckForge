import type { Metadata } from "next";
import { Spectral, Manrope, JetBrains_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "DeckForge — AI deck builder for Hearthstone", template: "%s — DeckForge" },
  description:
    "Describe the deck you want to play. Get a legal 30-card Standard deck and a code that pastes straight into Hearthstone.",
  applicationName: "DeckForge",
  openGraph: { siteName: "DeckForge", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-forge relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
