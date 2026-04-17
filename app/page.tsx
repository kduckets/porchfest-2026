"use client";

import { useState, useMemo, useRef } from "react";
import { BANDS, ALL_GENRES, Zone, ZONE_CONFIG } from "@/lib/bands";
import { BandCard } from "@/components/BandCard";
import { Search, X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

const ZONES: Zone[] = ["west", "central", "east"];

const GENRE_COLORS: Record<string, string> = {
  Rock: "#8B2500",
  Indie: "#5C2A7A",
  Pop: "#1A4A7A",
  Folk: "#3A5220",
  Jazz: "#7A5800",
  Punk: "#7A1A00",
  Blues: "#1A5A6A",
  Funk: "#8A3200",
  Electronic: "#1A3A6A",
  Americana: "#6A4018",
  Classical: "#4A3068",
  Metal: "#2A2A2A",
  Latin: "#8A4400",
  World: "#1A5A40",
  "R&B": "#6A2048",
  Soul: "#7A2818",
  Country: "#5A4A10",
  "Hip-Hop": "#3A1A5A",
  Bluegrass: "#224018",
  "Singer/Songwriter": "#2A4858",
  "Alternative Rock": "#6A1A40",
  "Art Rock": "#3A2858",
  "Classic Rock": "#5A3010",
  Emo: "#4A1A5A",
  "Garage Rock": "#6A2810",
  Grunge: "#3A3A1A",
  "Math Rock": "#1A4A3A",
  "Pop Punk": "#6A1A2A",
  "Post-Punk": "#2A2A4A",
  "Progressive Rock": "#1A3A5A",
  "Psychedelic Rock": "#4A1A6A",
  Shoegaze: "#3A2A5A",
  "Surf Rock": "#1A5A4A",
};

const ZONE_LABELS: Record<Zone, string> = {
  west: "Noon",
  central: "Afternoon",
  east: "Evening",
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [activeZones, setActiveZones] = useState<Set<Zone>>(new Set(ZONES));
  const resultsRef = useRef<HTMLDivElement>(null);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BANDS.forEach((b) => b.genres.forEach((g) => { counts[g] = (counts[g] || 0) + 1; }));
    return counts;
  }, []);

  const zoneCounts = useMemo(() => ({
    west: BANDS.filter((b) => b.zone === "west").length,
    central: BANDS.filter((b) => b.zone === "central").length,
    east: BANDS.filter((b) => b.zone === "east").length,
  }), []);

  const hasFilters = !!(query || selectedGenres.length > 0 || activeZones.size < 3);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return BANDS.filter((b) => {
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.genres.some((g) => g.toLowerCase().includes(q));
      const matchGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => b.genres.includes(g));
      const matchZone = activeZones.has(b.zone);
      return matchSearch && matchGenre && matchZone;
    });
  }, [query, selectedGenres, activeZones]);

  const scrollToResults = () =>
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    scrollToResults();
  };

  const setOnlyZone = (z: Zone) => {
    setActiveZones(new Set([z]));
    scrollToResults();
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedGenres([]);
    setActiveZones(new Set(ZONES));
  };

  return (
    <div className="pb-16">
      {/* Compact hero — just tagline + search */}
      <div className="px-6 py-7 relative overflow-hidden" style={{ background: "#4F9FD0" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 40%, rgba(255,255,255,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)",
          }}
        />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/60 mb-3 font-light">
            Somerville Porchfest · {BANDS.length} acts · May 9, 2026
          </p>
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bands, genres, addresses…"
              className="w-full pl-11 pr-10 py-3.5 text-sm bg-white/15 border border-white/25 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results — appears right below hero when any filter is active */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {hasFilters && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-4 py-5 border-b border-blush/30"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-navy/60">
                  <span className="font-medium text-navy">{filtered.length}</span> act{filtered.length !== 1 ? "s" : ""}
                  {selectedGenres.length > 0 && (
                    <span> in <span className="font-medium text-navy">{selectedGenres.join(", ")}</span></span>
                  )}
                  {query && (
                    <span> matching <span className="font-medium text-navy">&ldquo;{query}&rdquo;</span></span>
                  )}
                </p>
                <button onClick={clearFilters} className="text-xs text-rust hover:underline flex items-center gap-1">
                  <X size={11} /> Clear all
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12 text-navy/40">
                  <p className="text-3xl mb-2">🎵</p>
                  <p className="font-display text-lg text-navy/50">No acts match</p>
                  <button onClick={clearFilters} className="mt-3 text-sm text-sage hover:underline">
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((band) => (
                    <BandCard key={band.id} band={band} />
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Genre grid — now above time slots */}
      <section className="max-w-5xl mx-auto px-4 py-6 border-t border-blush/30">
        <p className="text-xs text-navy/40 mb-3">Filter by genre.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map((g) => {
            const color = GENRE_COLORS[g] || "#4A4A4A";
            const isSelected = selectedGenres.includes(g);
            const count = genreCounts[g] || 0;
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
                style={{
                  background: isSelected ? color : `${color}18`,
                  color: isSelected ? "white" : color,
                  border: `1.5px solid ${color}${isSelected ? "FF" : "60"}`,
                }}
              >
                {g}
                <span className="text-[10px] font-mono" style={{ opacity: isSelected ? 0.8 : 0.6 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {selectedGenres.length > 0 && (
          <button
            onClick={() => setSelectedGenres([])}
            className="mt-3 text-xs text-navy/40 hover:text-navy underline"
          >
            Clear genres
          </button>
        )}
      </section>

      {/* Time slot cards */}
      <section className="max-w-5xl mx-auto px-4 py-6 border-t border-blush/30">
        <p className="text-xs text-navy/40 mb-4">Pick a time slot to see who&rsquo;s playing.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ZONES.map((z) => {
            const cfg = ZONE_CONFIG[z];
            const isActive = activeZones.size === 1 && activeZones.has(z);
            return (
              <button
                key={z}
                onClick={() => setOnlyZone(z)}
                className={clsx(
                  "relative rounded-2xl p-6 text-left transition-all duration-200 overflow-hidden group",
                  isActive ? "ring-2 ring-offset-2 ring-offset-cream scale-[1.02]" : "hover:scale-[1.01]"
                )}
                style={{
                  background: isActive ? cfg.color : `${cfg.color}18`,
                  border: `2px solid ${cfg.color}${isActive ? "FF" : "50"}`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `${cfg.color}10` }}
                />
                <p className="font-display text-3xl mb-1" style={{ color: isActive ? "white" : cfg.color }}>
                  {ZONE_LABELS[z]}
                </p>
                <p className="font-mono text-xs mb-3" style={{ color: isActive ? "rgba(255,255,255,0.7)" : cfg.text }}>
                  {cfg.time}
                </p>
                <p className="text-sm font-medium" style={{ color: isActive ? "rgba(255,255,255,0.9)" : cfg.text }}>
                  {zoneCounts[z]} acts
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: isActive ? "white" : cfg.color }}>
                  Browse <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
        {activeZones.size === 1 && (
          <button
            onClick={() => setActiveZones(new Set(ZONES))}
            className="mt-3 text-xs text-navy/40 hover:text-navy underline"
          >
            Show all time slots
          </button>
        )}
      </section>
    </div>
  );
}
