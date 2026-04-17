"use server";

import { revalidatePath } from "next/cache";
import { addPost, McPost } from "@/lib/kv";

export async function submitPost(formData: FormData) {
  const handle = (formData.get("handle") as string)?.trim() || "Anonymous";
  const message = (formData.get("message") as string)?.trim();
  const zone = (formData.get("zone") as string) || undefined;

  if (!message || message.length < 3 || message.length > 500) return;

  const post: McPost = {
    id: crypto.randomUUID(),
    handle: handle.slice(0, 40),
    message: message.slice(0, 500),
    zone: zone || undefined,
    timestamp: Date.now(),
  };

  await addPost(post);
  revalidatePath("/missed-connections");
}
