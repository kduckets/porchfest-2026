import Redis from "ioredis";

const KEY = "pf2026_missed_connections";

// Reuse connection across requests in development
const getRedis = (() => {
  let client: Redis | null = null;
  return () => {
    if (!client) {
      const url = process.env.REDIS_URL;
      if (!url) throw new Error("REDIS_URL is not set");
      client = new Redis(url, { tls: { rejectUnauthorized: false } });
    }
    return client;
  };
})();

export interface McPost {
  id: string;
  handle: string;
  message: string;
  zone?: string;
  timestamp: number;
}

export async function getPosts(): Promise<McPost[]> {
  try {
    const redis = getRedis();
    const items = await redis.lrange(KEY, 0, 99);
    return items.map((s) => JSON.parse(s) as McPost);
  } catch {
    return [];
  }
}

export async function addPost(post: McPost): Promise<void> {
  const redis = getRedis();
  await redis.lpush(KEY, JSON.stringify(post));
}
