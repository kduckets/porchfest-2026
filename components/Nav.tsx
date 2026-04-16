"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSchedule } from "@/lib/store";
import { Music2 } from "lucide-react";

const TABS = [
  { href: "/", label: "Discover" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/map", label: "Route Map" },
];

export function Nav() {
  const pathname = usePathname();
  const { scheduledIds } = useSchedule();

  return (
    <nav className="sticky top-0 z-50 shadow-lg" style={{ background: "#4A9EB8" }}>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 py-3 shrink-0">
          <Music2 size={18} className="text-navy/70" />
          <div>
            <div className="font-display text-navy text-sm font-bold leading-tight">
              Porch Pilot
            </div>
            <div className="text-[10px] tracking-widest text-navy/50 uppercase font-light">
              Porchfest 2026
            </div>
          </div>
        </Link>

        {/* Tabs */}
        <div className="flex">
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  relative px-4 py-4 text-xs tracking-wide transition-colors duration-150 border-b-2
                  ${
                    isActive
                      ? "text-navy border-navy"
                      : "text-navy/50 border-transparent hover:text-navy"
                  }
                `}
              >
                {tab.label}
                {tab.href === "/schedule" && scheduledIds.length > 0 && (
                  <span className="ml-1.5 bg-rust text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {scheduledIds.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
