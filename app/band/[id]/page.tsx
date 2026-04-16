import { BANDS, ZONE_CONFIG } from "@/lib/bands";
import { BandDetailClient } from "./BandDetailClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return BANDS.map((b) => ({ id: String(b.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const band = BANDS.find((b) => b.id === Number(params.id));
  if (!band) return {};
  return {
    title: `${band.name} · Porch Pilot`,
    description: band.bio.slice(0, 160),
  };
}

export default function BandPage({ params }: { params: { id: string } }) {
  const band = BANDS.find((b) => b.id === Number(params.id));
  if (!band) notFound();

  return <BandDetailClient band={band} />;
}
