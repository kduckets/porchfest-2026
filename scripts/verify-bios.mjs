import { readFileSync, writeFileSync } from "fs";

// Fetch all entries
console.log("Fetching entry list...");
const resp = await fetch("https://somervilleartscouncil.org/wp-admin/admin-ajax.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: "action=gv_datatables_data&view_id=18158&post_id=18174&nonce=4f80d96286&draw=1&start=0&length=-1",
});
const json = await resp.json();

// Build name → entryId map (prefer higher entry IDs = newer submissions)
const entryMap = new Map();
for (const row of json.data) {
  const m = row[0].match(/entry\/(\d+)\/[^>]*>([^<]+)<\/a>/);
  if (m) {
    const entryId = parseInt(m[1]);
    const name = m[2].replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#039;/g, "'").trim();
    if (!entryMap.has(name) || entryId > entryMap.get(name).entryId) {
      entryMap.set(name, { entryId });
    }
  }
}
console.log(`Found ${entryMap.size} unique entries`);

// Fetch bio from entry page
async function fetchBio(entryId) {
  try {
    const r = await fetch(`https://somervilleartscouncil.org/view/porchfest-single-entry/entry/${entryId}/`);
    const html = await r.text();
    const m = html.match(/class="gv-field-10-42[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|td)>/);
    if (!m) return "";
    return m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#039;/g, "'").replace(/&rsquo;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&ndash;/g, "–").replace(/&hellip;/g, "…").trim();
  } catch {
    return "";
  }
}

// Fetch all bios in batches
console.log("Fetching bios...");
const officialBios = new Map(); // name → bio
const entries = [...entryMap.entries()];
const BATCH = 10;

for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH);
  const bios = await Promise.all(batch.map(([, { entryId }]) => fetchBio(entryId)));
  for (let j = 0; j < batch.length; j++) {
    officialBios.set(batch[j][0], bios[j]);
  }
  process.stdout.write(`\r${Math.min(i + BATCH, entries.length)}/${entries.length}`);
}
console.log("\nDone fetching bios.");

// Parse bands.ts into blocks
const bandsTs = readFileSync("lib/bands.ts", "utf8");
const blocks = bandsTs.split(/(?=\n  \{[\s\n]*id: \d+,)/);

let mismatches = 0;
let updated = 0;
let noMatch = 0;

const report = [];
const updatedBlocks = blocks.map((block) => {
  const nameM = block.match(/name: [`"](.*?)[`"],/);
  const bioM = block.match(/bio: `([\s\S]*?)`,/);
  if (!nameM || !bioM) return block;

  const bandName = nameM[1].replace(/\\u[\dA-Fa-f]{4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16))).trim();
  const currentBio = bioM[1].trim();

  // Find matching official entry - try exact, then case-insensitive, then partial
  let officialBio = null;
  let matchedName = null;

  if (officialBios.has(bandName)) {
    officialBio = officialBios.get(bandName);
    matchedName = bandName;
  } else {
    for (const [k, v] of officialBios) {
      if (k.toLowerCase() === bandName.toLowerCase()) {
        officialBio = v; matchedName = k; break;
      }
    }
  }
  if (!officialBio && !matchedName) {
    // Try partial match
    for (const [k, v] of officialBios) {
      if (k.toLowerCase().includes(bandName.toLowerCase()) || bandName.toLowerCase().includes(k.toLowerCase())) {
        officialBio = v; matchedName = k; break;
      }
    }
  }

  if (!matchedName) {
    noMatch++;
    report.push(`NO MATCH: "${bandName}"`);
    return block;
  }

  if (!officialBio) return block; // no bio on official page, keep existing

  // Normalize for comparison
  const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  if (norm(currentBio) === norm(officialBio)) return block;

  mismatches++;
  report.push(`MISMATCH: "${bandName}"\n  CURRENT: ${currentBio.slice(0, 100)}\n  OFFICIAL: ${officialBio.slice(0, 100)}`);

  // Replace bio
  const escaped = officialBio.replace(/`/g, "'");
  const newBlock = block.replace(/bio: `[\s\S]*?`,/, `bio: \`${escaped}\`,`);
  updated++;
  return newBlock;
});

writeFileSync("lib/bands.ts", updatedBlocks.join(""));
writeFileSync("scripts/bio-report.txt", report.join("\n\n"));

console.log(`\nResults:`);
console.log(`  Mismatches found: ${mismatches}`);
console.log(`  Updated: ${updated}`);
console.log(`  No official match: ${noMatch}`);
console.log(`  Report saved to scripts/bio-report.txt`);
