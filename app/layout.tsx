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
        <footer className="border-t border-blush/40 mt-8 py-8 px-4 text-center text-xs text-navy/40 space-y-1">
          <p>Designed by Kev · a Somerville dad, musician, and web dev</p>
          <p>
            Questions · comments · help with your website:{" "}
            <a href="mailto:kmditroia@gmail.com" className="underline hover:text-navy/70 transition-colors">
              kmditroia@gmail.com
            </a>
          </p>
          <p>
            Complaints:{" "}
            <a href="mailto:guster@guster.com" className="underline hover:text-navy/70 transition-colors">
              guster@guster.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
