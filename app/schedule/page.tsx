"use client";

import { useSchedule } from "@/lib/store";
import { BANDS, ZONE_CONFIG, Zone } from "@/lib/bands";
import { ZoneBadge } from "@/components/ZoneBadge";
import Link from "next/link";
import { X, MapPin, Clock, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function startMinutes(time: string): number {
  const m = time.match(/^(\d+):(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

export default function SchedulePage() {
  const { scheduledIds, remove } = useSchedule();
  const scheduled = BANDS.filter((b) => scheduledIds.includes(b.id));

  if (scheduled.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎶</div>
        <h2 className="font-display text-2xl mb-2">Your schedule is empty</h2>
        <p className="text-navy/50 mb-6">
          Browse acts and tap{" "}
          <span className="font-mono text-sm bg-navy/10 px-1.5 py-0.5 rounded">
            +
          </span>{" "}
          to add them to your day.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-sage text-white px-5 py-2.5 rounded-lg text-sm hover:bg-sage-dark transition-colors"
        >
          Discover Acts <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const byTime: Record<string, typeof BANDS> = {};
  scheduled.forEach((b) => {
    if (!byTime[b.time]) byTime[b.time] = [];
    byTime[b.time].push(b);
  });

  // Check for time conflicts (multiple in same zone)
  const conflicts = Object.values(byTime).filter((group) => group.length > 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl">My Porchfest Day</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          {scheduled.length} act{scheduled.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ⚠️ You have{" "}
          <strong>{conflicts.reduce((s, g) => s + g.length, 0)}</strong> acts
          overlapping in the same time slot. You can only see one per slot!
        </div>
      )}

      {/* Schedule by time */}
      <AnimatePresence>
        {Object.keys(byTime).sort((a, b) => startMinutes(a) - startMinutes(b)).map((slot) => {
          const acts = byTime[slot];
          if (!acts) return null;
          return (
            <div key={slot} className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <Clock size={13} className="text-navy/40" />
                <span className="font-mono text-xs text-navy/50 tracking-wide">
                  {slot}
                </span>
                <div className="flex-1 border-b border-dashed border-navy/10" />
                {acts.length > 1 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    conflict
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {acts.map((band) => (
                  <motion.div
                    key={band.id}
                    layout
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="bg-white border border-[#A8D8D4] rounded-xl p-3.5 flex items-center gap-3 group hover:border-sage/30 transition-colors"
                  >
                    {/* Zone color bar */}
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{
                        background: ZONE_CONFIG[band.zone as Zone].color,
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/band/${band.id}`}
                        className="font-display font-bold text-[1rem] hover:text-sage transition-colors"
                      >
                        {band.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-navy/40">
                          {band.genre}
                        </span>
                        <span className="text-navy/20">·</span>
                        <span className="text-[11px] text-navy/40 truncate flex items-center gap-1">
                          <MapPin size={9} />
                          {band.address}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ZoneBadge zone={band.zone} showTime={false} />
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => remove(band.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full border border-[#A8D8D4] text-navy/40 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </AnimatePresence>

      {/* Walking tip */}
      <div className="mt-4 p-4 bg-sage/8 border border-sage/20 rounded-xl text-sm text-navy/60 leading-relaxed">
        <p className="font-medium text-sage mb-1">💡 Walking tip</p>
        <p>
          Start in the West Zone at noon, move to Central at 2pm, and finish in
          the East at 4pm for a natural route through Somerville.
        </p>
      </div>

      {/* Map CTA */}
      <Link
        href="/map"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm text-white hover:opacity-90 transition-opacity"
        style={{ background: "#4F9FD0" }}
      >
        See Your Route on the Map <ArrowRight size={14} />
      </Link>
    </div>
  );
}
