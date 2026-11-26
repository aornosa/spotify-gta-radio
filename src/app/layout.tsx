import type { Metadata, Viewport } from "next";
import { Geist, Oswald } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "Los Santos Radio",
  description: "A GTA V-style car radio for Spotify, using the official Rockstar Games station playlists.",
};

export const viewport: Viewport = { themeColor: "#07080a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${oswald.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#07080a] text-white">{children}</body>
    </html>
  );
}
