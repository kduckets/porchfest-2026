import { BANDS } from "@/lib/bands";
import { BandDetailClient } from "./BandDetailClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return BANDS.map((b) => ({ id: String(b.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const band = BANDS.find((b) => b.id === Number(id));
  if (!band) return {};
  return {
    title: `${band.name} · Porch Pilot`,
    description: band.bio.slice(0, 160),
  };
}

export default async function BandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const band = BANDS.find((b) => b.id === Number(id));
  if (!band) notFound();

  return <BandDetailClient band={band} />;
}
