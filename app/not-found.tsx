import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">🎵</div>
      <h1 className="font-display text-3xl mb-3">Page not found</h1>
      <p className="text-navy/50 mb-6">
        This porch doesn&apos;t seem to exist. Head back to the festival.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-sage text-white px-5 py-2.5 rounded-lg text-sm hover:bg-sage-dark transition-colors"
      >
        Back to Discover
      </Link>
    </div>
  );
}
