import { getPosts } from "@/lib/kv";
import { PostForm } from "./PostForm";
import { ZONE_CONFIG } from "@/lib/bands";

const ZONE_LABELS: Record<string, string> = {
  west: "West Zone",
  central: "Central Zone",
  east: "East Zone",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Missed Connections · Porch Pilot",
  description: "Leave a note for someone you spotted at Somerville Porchfest 2026.",
};

export default async function MissedConnectionsPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl">Missed Connections</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          Spotted someone at Porchfest? Leave them a note.
        </p>
      </div>

      <PostForm />

      {posts.length === 0 ? (
        <div className="text-center py-16 text-navy/40">
          <p className="text-4xl mb-3">💌</p>
          <p className="font-display text-lg text-navy/50">No notes yet</p>
          <p className="text-sm mt-1">Be the first to leave one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-[#A8D8D4] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="font-medium text-sm text-navy">
                  {post.handle}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.zone && ZONE_CONFIG[post.zone as keyof typeof ZONE_CONFIG] && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${ZONE_CONFIG[post.zone as keyof typeof ZONE_CONFIG].color}18`,
                        color: ZONE_CONFIG[post.zone as keyof typeof ZONE_CONFIG].text,
                      }}
                    >
                      {ZONE_LABELS[post.zone]}
                    </span>
                  )}
                  <span className="text-[11px] text-navy/35">{timeAgo(post.timestamp)}</span>
                </div>
              </div>
              <p className="text-sm text-navy/70 leading-relaxed">{post.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
