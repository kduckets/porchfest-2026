import type { Metadata } from "next";
import { Abril_Fatface, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Porch Pilot · Somerville Porchfest 2026",
  description:
    "The unofficial Somerville Porchfest guide. Discover local music and plan your day.",
  openGraph: {
    title: "Porch Pilot · Somerville Porchfest 2026",
    description: "Discover local music and plan your Porchfest day.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${abrilFatface.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="bg-cream text-navy min-h-screen font-sans antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
