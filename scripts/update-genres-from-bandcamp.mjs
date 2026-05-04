import { readFileSync, writeFileSync } from "fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MA_KEYWORDS = ["ma", "massachusetts", "boston", "somerville", "cambridge", "medford", "brookline", "new england", "allston", "jamaica plain", "jp", "watertown", "waltham", "newton", "malden", "quincy", "arlington"];

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function isMALocation(loc) {
  if (!loc) return false;
  const l = loc.toLowerCase();
  return MA_KEYWORDS.some(k => l.includes(k));
}

async function searchBandcamp(name) {
  await new Promise(r => setTimeout(r, 500));
  try {
    const r = await fetch(
      `https://bandcamp.com/api/fuzzysearch/2/app_autocomplete?q=${encodeURIComponent(name)}`,
      { headers: { "User-Agent": UA } }
    );
    const data = await r.json();
    return data.results?.filter(x => x.type === "b") || [];
  } catch { return []; }
}

function parseTagsToGenres(tags) {
  if (!tags || tags.length === 0) return null;

  const GENRE_MAP = {
    "rock": "Rock", "indie": "Indie", "pop": "Pop", "folk": "Folk",
    "jazz": "Jazz", "punk": "Punk", "blues": "Blues", "funk": "Funk",
    "electronic": "Electronic", "americana": "Americana", "classical": "Classical",
    "metal": "Metal", "latin": "Latin", "world": "World", "r&b": "R&B",
    "rnb": "R&B", "soul": "Soul", "country": "Country", "hip-hop": "Hip-Hop",
    "hip hop": "Hip-Hop", "hiphop": "Hip-Hop", "rap": "Hip-Hop",
    "bluegrass": "Bluegrass", "singer-songwriter": "Singer/Songwriter",
    "singer songwriter": "Singer/Songwriter", "alternative": "Indie",
    "alt rock": "Alternative Rock", "alternative rock": "Alternative Rock",
    "art rock": "Art Rock", "classic rock": "Classic Rock", "emo": "Emo",
    "garage rock": "Garage Rock", "grunge": "Grunge", "math rock": "Math Rock",
    "pop punk": "Pop Punk", "post-punk": "Post-Punk", "post punk": "Post-Punk",
    "progressive rock": "Progressive Rock", "psychedelic": "Psychedelic Rock",
    "psych rock": "Psychedelic Rock", "shoegaze": "Shoegaze", "surf rock": "Surf Rock",
    "acoustic": "Folk", "chamber music": "Classical", "orchestral": "Classical",
    "experimental": "Electronic", "ambient": "Electronic", "dance": "Electronic",
    "reggae": "World", "ska": "Punk", "indie pop": "Indie", "indie rock": "Indie",
    "singer/songwriter": "Singer/Songwriter",
  };

  const genres = new Set();
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (GENRE_MAP[lower]) {
      genres.add(GENRE_MAP[lower]);
    }
    // Also check partial matches
    for (const [key, val] of Object.entries(GENRE_MAP)) {
      if (lower === key || lower.includes(key)) {
        genres.add(val);
        break;
      }
    }
  }
  return genres.size > 0 ? [...genres] : null;
}

// Extract new bands from bands.ts
const bandsTs = readFileSync("lib/bands.ts", "utf8");

// Parse band blocks for ids 404+
const bandRegex = /\{\s*\n\s*id: (\d+),[\s\S]*?(?=\n  [,\}])/g;
const newBands = [];

let blockStart = 0;
const lines = bandsTs.split("\n");
let currentBlock = null;
let currentStart = -1;

for (let i = 0; i < lines.length; i++) {
  const idMatch = lines[i].match(/^\s+id: (\d+),$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (id >= 404) {
      const nameMatch = lines[i+1]?.match(/name: `([^`]+)`/);
      const genreMatch = lines.slice(i, i+10).join("\n").match(/genres: \[([^\]]+)\]/);
      const bcMatch = lines.slice(i, i+15).join("\n").match(/bandcamp: "([^"]+)"/);

      if (nameMatch && !bcMatch) { // Only process bands without existing Bandcamp
        newBands.push({
          id,
          name: nameMatch[1],
          currentGenres: genreMatch ? genreMatch[1].replace(/"/g, "").split(", ") : [],
          lineIdx: i,
        });
      }
    }
  }
}

console.log(`Found ${newBands.length} new bands without Bandcamp URLs`);

const updates = [];

for (let i = 0; i < newBands.length; i++) {
  const band = newBands[i];
  process.stdout.write(`\r[${i+1}/${newBands.length}] ${band.name.slice(0, 35).padEnd(35)}`);

  const results = await searchBandcamp(band.name);
  if (results.length === 0) continue;

  const normName = normalize(band.name);

  // Find best match: exact name, prefer MA location
  let best = null;
  for (const r of results) {
    const rNorm = normalize(r.name || "");
    if (rNorm === normName) {
      if (isMALocation(r.location)) {
        best = r;
        break;
      } else if (!best) {
        best = r; // fallback: same name, any location
      }
    }
  }

  // If only one result and name is close enough
  if (!best && results.length === 1) {
    const rNorm = normalize(results[0].name || "");
    if (rNorm === normName || normName.startsWith(rNorm) || rNorm.startsWith(normName.slice(0, 8))) {
      best = results[0];
    }
  }

  if (!best || !best.tag_names || best.tag_names.length === 0) continue;

  const newGenres = parseTagsToGenres(best.tag_names);
  if (!newGenres || newGenres.length === 0) continue;

  updates.push({
    id: band.id,
    name: band.name,
    oldGenres: band.currentGenres,
    newGenres,
    bcUrl: best.url,
    bcLocation: best.location || "unknown",
    tags: best.tag_names,
  });
}

console.log(`\n\nFound ${updates.length} bands with Bandcamp genre data:\n`);

for (const u of updates) {
  const changed = JSON.stringify(u.oldGenres.sort()) !== JSON.stringify(u.newGenres.sort());
  const marker = changed ? "★" : "·";
  console.log(`${marker} [${u.id}] ${u.name.slice(0, 35).padEnd(35)} ${u.bcLocation.slice(0, 20).padEnd(20)} ${u.oldGenres.join(",")} → ${u.newGenres.join(",")}`);
}

const changed = updates.filter(u => JSON.stringify(u.oldGenres.sort()) !== JSON.stringify(u.newGenres.sort()));
console.log(`\n${changed.length} bands have updated genres`);

// Apply updates to bands.ts
let updated = bandsTs;

for (const u of updates) {
  // Update genres array
  const genresStr = u.newGenres.map(g => `"${g}"`).join(", ");
  const primaryGenre = u.newGenres[0];

  // Find the band block by id and update genre + genres
  const idPattern = new RegExp(`(  \\{[\\s\\S]{0,50}?id: ${u.id},[\\s\\S]{0,200}?genre: )"[^"]*"(,[\\s\\S]{0,50}?genres: )\\[[^\\]]*\\]`);
  updated = updated.replace(idPattern, `$1"${primaryGenre}"$2[${genresStr}]`);

  // Add bandcamp URL after genres line if not present
  if (u.bcUrl) {
    const bcInsertPattern = new RegExp(`(  \\{[\\s\\S]{0,50}?id: ${u.id},[\\s\\S]{0,400}?genres: \\[[^\\]]*\\],?\n)`);
    const match = updated.match(new RegExp(`id: ${u.id},[\\s\\S]{0,600}?genres: \\[[^\\]]*\\]`));
    if (match && !updated.slice(updated.indexOf(match[0])).slice(0, 500).includes('bandcamp:')) {
      updated = updated.replace(
        new RegExp(`(id: ${u.id},[\\s\\S]{0,600}?genres: \\[[^\\]]*\\],?)`),
        `$1\n    bandcamp: "${u.bcUrl}",`
      );
    }
  }
}

writeFileSync("lib/bands.ts", updated);
console.log("\nWritten to lib/bands.ts");
