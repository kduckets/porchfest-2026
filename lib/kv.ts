import { kv } from "@vercel/kv";

const KEY = "pf2026_missed_connections";

export interface McPost {
  id: string;
  handle: string;
  message: string;
  zone?: string;
  timestamp: number;
}

export async function getPosts(): Promise<McPost[]> {
  try {
    const items = await kv.lrange<string>(KEY, 0, 99);
    return items.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as McPost);
  } catch {
    return [];
  }
}

export async function addPost(post: McPost): Promise<void> {
  await kv.lpush(KEY, JSON.stringify(post));
}
