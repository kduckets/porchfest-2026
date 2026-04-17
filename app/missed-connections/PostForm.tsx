"use client";

import { useRef, useState } from "react";
import { submitPost } from "./actions";
import { Send } from "lucide-react";

const ZONES = [
  { value: "", label: "Anywhere" },
  { value: "west", label: "West Zone (noon)" },
  { value: "central", label: "Central Zone (2pm)" },
  { value: "east", label: "East Zone (4pm)" },
];

export function PostForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await submitPost(formData);
    setPending(false);
    setSent(true);
    formRef.current?.reset();
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-white border border-[#A8D8D4] rounded-2xl p-5 mb-8 space-y-4">
      <h2 className="font-display text-lg text-navy">Leave a note</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-widest text-navy/40 block mb-1">
            Your name / handle
          </label>
          <input
            name="handle"
            type="text"
            placeholder="Anonymous"
            maxLength={40}
            className="w-full px-3 py-2 text-sm border border-navy/15 rounded-lg bg-cream focus:outline-none focus:border-sage/60 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-navy/40 block mb-1">
            Where were you?
          </label>
          <select
            name="zone"
            className="w-full px-3 py-2 text-sm border border-navy/15 rounded-lg bg-cream focus:outline-none focus:border-sage/60 transition-colors"
          >
            {ZONES.map((z) => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-widest text-navy/40 block mb-1">
          Your message
        </label>
        <textarea
          name="message"
          required
          minLength={3}
          maxLength={500}
          rows={3}
          placeholder="You were playing on a red porch on Elm St. Your reggae version of Landslide made me cry. Who are you?"
          className="w-full px-3 py-2 text-sm border border-navy/15 rounded-lg bg-cream focus:outline-none focus:border-sage/60 transition-colors resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage text-white text-sm rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50"
        >
          <Send size={13} />
          {pending ? "Posting…" : "Post"}
        </button>
        {sent && (
          <span className="text-sm text-sage animate-fade-up">
            ✓ Posted!
          </span>
        )}
      </div>
    </form>
  );
}
