"use client";

import { Band, ZONE_CONFIG } from "@/lib/bands";
import { useSchedule } from "@/lib/store";
import { ZoneBadge } from "@/components/ZoneBadge";
import {
  Check,
  Plus,
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Music,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export function BandDetailClient({ band }: { band: Band }) {
  const { toggle, has } = useSchedule();
  const inSchedule = has(band.id);
  const zCfg = ZONE_CONFIG[band.zone];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-up">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        All bands
      </Link>

      {/* Hero card */}
      <div
        className="rounded-2xl overflow-hidden mb-6 border border-[#A8D8D4]"
        style={{ background: `${band.color}15` }}
      >
        <div
          className="h-48 flex items-end justify-between px-6 pb-5 relative"
          style={{
            background: band.image
              ? `linear-gradient(to top, ${band.color}EE 0%, ${band.color}88 50%, transparent 100%)`
              : `linear-gradient(135deg, ${band.color}CC, ${band.color}88)`,
          }}
        >
          {band.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={band.image}
              alt={band.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ zIndex: 0 }}
            />
          )}
          {/* Gradient overlay sits on top of image */}
          {band.image && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${band.color}EE 0%, ${band.color}55 55%, transparent 100%)`,
                zIndex: 1,
              }}
            />
          )}
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 className="font-display text-3xl font-bold text-white drop-shadow-sm leading-tight">
              {band.name}
            </h1>
            <span className="inline-block mt-1 text-[11px] tracking-widest uppercase text-white/70 bg-white/15 px-2.5 py-0.5 rounded-full">
              {band.genre}
            </span>
          </div>
          {/* Big note decoration — only when no image */}
          {!band.image && (
            <div className="text-6xl opacity-20 text-white select-none">♪</div>
          )}
        </div>

        {/* Meta strip */}
        <div className="bg-white/60 px-6 py-3 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-navy/60">
            <MapPin size={13} />
            {band.address}
          </span>
          <span className="flex items-center gap-1.5 text-navy/60">
            <Clock size={13} />
            {band.time}
          </span>
          {band.members && (
            <span className="flex items-center gap-1.5 text-navy/60">
              <Users size={13} />
              {band.members}
            </span>
          )}
          {band.formed && (
            <span className="flex items-center gap-1.5 text-navy/60">
              <Music size={13} />
              Est. {band.formed}
            </span>
          )}
        </div>
      </div>

      {/* Zone */}
      <div className="mb-5">
        <ZoneBadge zone={band.zone} />
        <p className="mt-1.5 text-xs text-navy/40">
          {zCfg.label} · Plays {band.time}
        </p>
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {band.genres.map((g) => (
          <span
            key={g}
            className="text-xs px-2.5 py-1 bg-navy/5 text-navy/60 rounded-full border border-navy/10"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Bio */}
      <p className="text-[0.9rem] leading-7 text-navy/70 mb-6">{band.bio}</p>

      {/* Listen */}
      {(band.bandcamp || band.instagram || band.spotify || band.youtube || band.website) && (
        <div className="mb-6">
          <p className="text-[10px] tracking-widest uppercase text-navy/40 mb-2.5">
            Listen & Learn
          </p>
          <div className="flex flex-wrap gap-2">
            {band.bandcamp && (
              <a
                href={band.bandcamp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#1DA0C3] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                ♫ Bandcamp
              </a>
            )}
            {band.instagram && (
              <a
                href={band.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
              >
                📷 Instagram
              </a>
            )}
            {band.spotify && (
              <a
                href={band.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                ▶ Spotify
              </a>
            )}
            {band.youtube && (
              <a
                href={band.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                ▶ YouTube
              </a>
            )}
            {band.website && (
              <a
                href={band.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-navy text-cream text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={13} />
                Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Map link */}
      <div className="mb-6 p-4 bg-white border border-[#A8D8D4] rounded-xl text-sm text-navy/60">
        <p className="font-medium text-navy mb-1">📍 Find this porch</p>
        <p className="text-sm">{band.address}</p>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(band.address + ", Somerville, MA")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sage text-xs hover:underline"
        >
          Open in Google Maps <ExternalLink size={11} />
        </a>
      </div>

      {/* CTA */}
      <button
        onClick={() => toggle(band.id)}
        className={clsx(
          "w-full py-3.5 rounded-xl text-base font-medium transition-all duration-150 flex items-center justify-center gap-2",
          inSchedule
            ? "bg-sage/10 text-sage border-2 border-sage hover:bg-sage/20"
            : "bg-sage text-white hover:bg-sage-dark"
        )}
      >
        {inSchedule ? (
          <>
            <Check size={16} />
            On Your Schedule · Remove
          </>
        ) : (
          <>
            <Plus size={16} />
            Add to My Schedule
          </>
        )}
      </button>

      {inSchedule && (
        <div className="mt-3 text-center">
          <Link href="/schedule" className="text-sm text-sage hover:underline">
            View your full schedule →
          </Link>
        </div>
      )}
    </div>
  );
}
