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
    <nav className="sticky top-0 z-50 shadow-md" style={{ background: "#6BB5DE" }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Top row: brand always visible */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 py-3 shrink-0">
            <Music2 size={18} className="text-white/70" />
            <div>
              <div className="font-display text-sm font-bold leading-tight text-white">
                Porch Pilot
              </div>
              <div className="text-[10px] tracking-widest text-white/55 uppercase font-light">
                Porchfest 2026
              </div>
            </div>
          </Link>

          {/* Tabs: inline on sm+, hidden here on mobile */}
          <div className="hidden sm:flex">
            {TABS.map((tab) => {
              const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative px-4 py-4 text-xs tracking-wide transition-colors duration-150 border-b-2 ${
                    isActive ? "text-white border-white" : "text-white/55 border-transparent hover:text-white"
                  }`}
                >
                  {tab.label}
                  {tab.href === "/schedule" && scheduledIds.length > 0 && (
                    <span className="ml-1.5 bg-white/25 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {scheduledIds.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile tabs: full-width row below brand */}
        <div className="flex sm:hidden border-t border-white/20 -mx-4">
          {TABS.map((tab) => {
            const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center py-2.5 text-[11px] tracking-wide transition-colors duration-150 border-b-2 ${
                  isActive ? "text-white border-white font-medium" : "text-white/55 border-transparent"
                }`}
              >
                {tab.label}
                {tab.href === "/schedule" && scheduledIds.length > 0 && (
                  <span className="ml-1 bg-white/25 text-white text-[10px] px-1.5 py-0.5 rounded-full">
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
