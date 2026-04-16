"use client";

import { Band } from "@/lib/bands";
import { ZoneBadge } from "./ZoneBadge";
import { useSchedule } from "@/lib/store";
import { Plus, Check, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function BandCard({ band }: { band: Band }) {
  const { toggle, has } = useSchedule();
  const inSchedule = has(band.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white border border-[#A8D8D4] rounded-xl overflow-hidden hover:shadow-md hover:border-sage/40 transition-all duration-200"
    >
      <div className="p-4 relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: band.color }}
        />

        <button
          onClick={(e) => { e.preventDefault(); toggle(band.id); }}
          title={inSchedule ? "Remove from schedule" : "Add to schedule"}
          className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
            inSchedule
              ? "bg-sage text-white"
              : "bg-navy/5 text-navy/40 hover:bg-sage hover:text-white"
          }`}
        >
          {inSchedule ? <Check size={13} /> : <Plus size={13} />}
        </button>

        <Link href={`/band/${band.id}`} className="block pl-3">
          <h3 className="font-display text-[1.05rem] leading-tight mb-0.5 pr-8">
            {band.name}
          </h3>
          <p className="text-[11px] uppercase tracking-widest text-navy/40 mb-2">
            {band.genre}
          </p>
          <p className="text-[11px] text-navy/50 flex items-center gap-1 mb-3 truncate">
            <MapPin size={10} />
            {band.address}
          </p>
          <ZoneBadge zone={band.zone} />
        </Link>
      </div>
    </motion.div>
  );
}
