import { readFileSync, writeFileSync } from "fs";

// Bands to revert: wrong location (not MA/New England) or wrong match
// Format: { id, genre (primary), genres[], reason }
const reverts = [
  { id: 404, genre: "Rock", genres: ["Rock"], reason: "Melbourne, Australia" },
  { id: 407, genre: "Blues", genres: ["Blues", "Rock"], reason: "Salt Lake City, Utah" },
  { id: 420, genre: "Rock", genres: ["Rock"], reason: "Manchester, UK (Playing with Fire)" },
  { id: 431, genre: "Folk", genres: ["Folk"], reason: "Berlin, Germany (Grapevine)" },
  { id: 432, genre: "Indie", genres: ["Indie"], reason: "Bozeman, Montana (cedar)" },
  { id: 435, genre: "Bluegrass", genres: ["Bluegrass"], reason: "Red Deer, Alberta (SLAPPY PAPPY)" },
  { id: 438, genre: "Rock", genres: ["Rock"], reason: "Tokyo, Japan (Anemoia)" },
  { id: 448, genre: "Electronic", genres: ["Electronic"], reason: "Wallaga Lake, Australia (Hoppers)" },
  { id: 454, genre: "Indie", genres: ["Indie"], reason: "Kuala Lumpur, Malaysia (Nightjar)" },
  { id: 469, genre: "Pop", genres: ["Pop"], reason: "Halifax, Nova Scotia (The Flakes)" },
  { id: 478, genre: "Folk", genres: ["Folk", "Singer/Songwriter"], reason: "Littlehampton, UK (Wilf)" },
  { id: 479, genre: "Jazz", genres: ["Jazz"], reason: "Cedar Rapids, Iowa (Calcifer)" },
  { id: 480, genre: "Indie", genres: ["Indie", "Pop"], reason: "Nashville, Tennessee (Lockstep)" },
  { id: 482, genre: "Rock", genres: ["Rock"], reason: "Unknown location (Rooftop Garden)" },
  { id: 483, genre: "Pop", genres: ["Pop"], reason: "Jerez, Spain (The Merman)" },
  { id: 499, genre: "Rock", genres: ["Rock"], reason: "Cleveland, Ohio (Hot Take)" },
  { id: 505, genre: "Pop", genres: ["Pop"], reason: "Wiesbaden, Germany (Leviathan)" },
  { id: 510, genre: "Funk", genres: ["Funk"], reason: "Phoenix, Arizona (Missed Call)" },
  { id: 521, genre: "Jazz", genres: ["Jazz"], reason: "Sun Salon Somerville but genre changed to Electronic — wrong" },
  { id: 531, genre: "Indie", genres: ["Indie"], reason: "Paris, France (MIK-E)" },
  { id: 545, genre: "Indie", genres: ["Indie"], reason: "England, UK (Stuck on Static)" },
];

let ts = readFileSync("lib/bands.ts", "utf8");

for (const r of reverts) {
  const genresStr = r.genres.map(g => `"${g}"`).join(", ");
  // Replace genre + genres for this band id
  const pattern = new RegExp(
    `(  \\{[\\s\\S]{0,100}?id: ${r.id},[\\s\\S]{0,30}?genre: )"[^"]*"([\\s\\S]{0,50}?genres: )\\[[^\\]]*\\]`
  );
  const before = ts;
  ts = ts.replace(pattern, `$1"${r.genre}"$2[${genresStr}]`);
  if (ts === before) {
    console.log(`WARNING: no match for id ${r.id}`);
  } else {
    console.log(`Reverted [${r.id}] to [${r.genres.join(", ")}] (${r.reason})`);
  }

  // Also remove the bandcamp URL that was added for this id
  ts = ts.replace(
    new RegExp(`(id: ${r.id},[\\s\\S]{0,600}?genres: \\[[^\\]]*\\],?)\n    bandcamp: "[^"]+",`),
    "$1"
  );
}

writeFileSync("lib/bands.ts", ts);
console.log("\nDone. Reverted false-positive Bandcamp matches.");
