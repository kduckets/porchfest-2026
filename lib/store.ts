"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScheduleStore {
  scheduledIds: number[];
  add: (id: number) => void;
  remove: (id: number) => void;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
}

export const useSchedule = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      scheduledIds: [],
      add: (id) =>
        set((s) => ({
          scheduledIds: s.scheduledIds.includes(id)
            ? s.scheduledIds
            : [...s.scheduledIds, id],
        })),
      remove: (id) =>
        set((s) => ({
          scheduledIds: s.scheduledIds.filter((x) => x !== id),
        })),
      toggle: (id) => {
        if (get().scheduledIds.includes(id)) {
          get().remove(id);
        } else {
          get().add(id);
        }
      },
      has: (id) => get().scheduledIds.includes(id),
      clear: () => set({ scheduledIds: [] }),
    }),
    { name: "porchfest-schedule" }
  )
);
