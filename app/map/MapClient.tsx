"use client";

import { useSchedule } from "@/lib/store";
import { BANDS, ZONE_CONFIG, Zone } from "@/lib/bands";
import { ZoneBadge } from "@/components/ZoneBadge";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, Clock, ExternalLink } from "lucide-react";

// Dynamically import map to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export function MapClient() {
  const { scheduledIds } = useSchedule();
  const scheduled = BANDS.filter((b) => scheduledIds.includes(b.id)).sort(
    (a, b) => {
      const order: Zone[] = ["west", "central", "east"];
      return order.indexOf(a.zone) - order.indexOf(b.zone);
    }
  );

  if (scheduled.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🗺</div>
        <h2 className="font-display text-2xl mb-2">No acts on your schedule</h2>
        <p className="text-navy/50 mb-6">
          Add some acts to your schedule first to see your personalized route
          map.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl">Your Route Map</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          {scheduled.length} stop{scheduled.length !== 1 ? "s" : ""} · sorted
          west → central → east
        </p>
      </div>

      {/* Leaflet map */}
      <div className="rounded-2xl overflow-hidden border border-[#A8D8D4] mb-5 shadow-sm">
        <LeafletMap bands={scheduled} />
        <div className="px-4 py-3 bg-white border-t border-[#A8D8D4] flex items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            {(["west", "central", "east"] as Zone[]).map((z) => (
              <div
                key={z}
                className="flex items-center gap-1.5 text-xs text-navy/60"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: ZONE_CONFIG[z].color }}
                />
                {ZONE_CONFIG[z].label}
              </div>
            ))}
          </div>
          <a
            href="https://somervilleartscouncil.org/porchfest/porchfest-map/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-sage hover:underline"
          >
            Official map <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Stop list */}
      <div className="space-y-2.5">
        {scheduled.map((band, i) => (
          <div
            key={band.id}
            className="bg-white border border-[#A8D8D4] rounded-xl p-3.5 flex gap-3 items-center hover:border-sage/30 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-mono font-bold flex-shrink-0"
              style={{ background: ZONE_CONFIG[band.zone].color }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/band/${band.id}`}
                className="font-display font-bold hover:text-sage transition-colors"
              >
                {band.name}
              </Link>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-navy/50">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {band.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {band.time}
                </span>
              </div>
            </div>
            <ZoneBadge zone={band.zone} showTime={false} />
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 bg-sage/8 border border-sage/20 rounded-xl text-sm text-navy/60 leading-relaxed">
        <p className="font-medium text-sage mb-1">🚶 Getting around</p>
        <p>
          Porchfest is a walking festival — most acts are within a 10–15 minute
          walk of each other. Arrive early, bring a blanket, and enjoy the
          neighborhood. Parking is limited so consider the T (Davis or Porter
          Square on the Red Line) or cycling.
        </p>
      </div>
    </div>
  );
}
