import { Zone, ZONE_CONFIG } from "@/lib/bands";

export function ZoneBadge({
  zone,
  showTime = true,
}: {
  zone: Zone;
  showTime?: boolean;
}) {
  const cfg = ZONE_CONFIG[zone];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: cfg.color }}
      />
      {cfg.label}
      {showTime && ` · ${cfg.time}`}
    </span>
  );
}
