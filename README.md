# Somerville Porchfest 2026

A full-featured festival guide web app built with Next.js 15, Tailwind CSS, Zustand, Framer Motion, and Leaflet maps.

## Features

- **Discover** — Browse all acts with live search, genre filters, and zone filters
- **Band detail pages** — Full bio, genre tags, listen links, and address with Google Maps link
- **My Schedule** — Add/remove acts, conflict detection for overlapping time slots
- **Route Map** — Interactive Leaflet map with numbered stops and a walking guide
- **Persistent schedule** — Saved to localStorage via Zustand persist

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
```

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
porchfest-2026/
├── app/
│   ├── layout.tsx          # Root layout with fonts and Nav
│   ├── globals.css         # Global styles + Tailwind
│   ├── page.tsx            # Discover/browse page
│   ├── not-found.tsx       # 404 page
│   ├── band/[id]/
│   │   ├── page.tsx        # Band detail (static params)
│   │   └── BandDetailClient.tsx
│   ├── schedule/
│   │   └── page.tsx        # My Schedule page
│   └── map/
│       ├── page.tsx        # Route Map page
│       ├── MapClient.tsx   # Map layout + stop list
│       └── LeafletMap.tsx  # Leaflet map (dynamic, no SSR)
├── components/
│   ├── Nav.tsx             # Sticky nav with schedule badge
│   ├── BandCard.tsx        # Grid card component
│   └── ZoneBadge.tsx       # Zone color pill
├── lib/
│   ├── bands.ts            # All band data + types
│   └── store.ts            # Zustand schedule store
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

## Updating Band Data

All band data lives in `lib/bands.ts`. When the official 2026 lineup is announced, update the `BANDS` array with real names, addresses, genres, and coordinates. Each band needs:

```ts
{
  id: number,           // unique
  name: string,
  genre: string,        // primary genre label
  genres: string[],     // for filtering
  zone: "west" | "central" | "east",
  time: "12:00–2:00pm" | "2:00–4:00pm" | "4:00–6:00pm",
  address: string,      // full street address
  bio: string,
  lat: number,          // GPS latitude
  lng: number,          // GPS longitude
  color: string,        // hex color for card art
  spotify?: string,     // optional listen links
  youtube?: string,
  website?: string,
}
```

## Tech Stack

- **Next.js 15** — App Router, static params, dynamic imports
- **TypeScript** — Full type safety throughout
- **Tailwind CSS** — Utility-first styling with custom theme
- **Zustand** — Lightweight state for schedule with localStorage persistence
- **Framer Motion** — Card animations, filter transitions
- **Leaflet + React Leaflet** — Interactive map (client-side only, no SSR)
- **Lucide React** — Icons
- **DM Sans / Playfair Display / DM Mono** — Google Fonts via next/font

## Deployment

Deployable to Vercel, Netlify, or any Node.js host with zero config:

```bash
# Vercel (recommended)
npx vercel

# Or push to GitHub and connect to vercel.com
```
