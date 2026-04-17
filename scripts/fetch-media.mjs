import { readFileSync, writeFileSync } from "fs";

// Step 1: Fetch all entries from DataTables AJAX
console.log("Fetching entry list...");
const resp = await fetch("https://somervilleartscouncil.org/wp-admin/admin-ajax.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: "action=gv_datatables_data&view_id=18158&post_id=18174&nonce=4f80d96286&draw=1&start=0&length=-1",
});
const json = await resp.json();

// Parse name → entryId map
const entryMap = new Map(); // name → entryId
for (const row of json.data) {
  const m = row[0].match(/entry\/(\d+)\/[^>]*>([^<]+)<\/a>/);
  if (m) {
    const entryId = m[1];
    const name = m[2].replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
    entryMap.set(name, entryId);
  }
}
console.log(`Found ${entryMap.size} entries`);

// Step 2: Fetch each entry page to get image + YouTube
async function fetchMedia(entryId) {
  try {
    const r = await fetch(`https://somervilleartscouncil.org/view/porchfest-single-entry/entry/${entryId}/`);
    const html = await r.text();

    // Image: <img ... class="gv-image gv-field-id-17" src="...">
    const imgMatch = html.match(/class="gv-image gv-field-id-17"[^>]*>|<img[^>]*gv-field-id-17[^>]*>/);
    let image = null;
    if (imgMatch) {
      // search around match for src
      const idx = html.indexOf(imgMatch[0]);
      const chunk = html.slice(Math.max(0, idx - 200), idx + imgMatch[0].length + 200);
      const srcM = imgMatch[0].match(/src="([^"]+)/) || chunk.match(/src="([^"]+gk-download[^"]+)/);
      if (srcM) image = srcM[1];
    }
    // Also try: any img with gv-field-id-17
    if (!image) {
      const m2 = html.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*gv-field-id-17[^"]*"/);
      if (m2) image = m2[1];
    }

    // YouTube embed
    const ytMatch = html.match(/src="(https:\/\/www\.youtube\.com\/embed\/[^"?]+[^"]*)"/);
    const youtube = ytMatch ? ytMatch[1].split("?")[0].replace("/embed/", "/watch?v=").replace("https://www.youtube.com/watch?v=", "https://www.youtube.com/watch?v=") : null;

    return { image, youtube };
  } catch {
    return { image: null, youtube: null };
  }
}

// Fetch in batches of 10
const results = new Map(); // entryId → { image, youtube }
const entries = [...entryMap.entries()];
const BATCH = 10;
let found = 0;

for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH);
  const fetched = await Promise.all(batch.map(([, id]) => fetchMedia(id)));
  for (let j = 0; j < batch.length; j++) {
    const [name, id] = batch[j];
    const { image, youtube } = fetched[j];
    results.set(name, { entryId: id, image, youtube });
    if (image || youtube) found++;
  }
  process.stdout.write(`\r${Math.min(i + BATCH, entries.length)}/${entries.length} (${found} with media)`);
}
console.log("\nDone fetching.");

// Step 3: Match to bands.ts by name and update
let bandsTs = readFileSync("lib/bands.ts", "utf8");

// Parse band blocks
const bandBlocks = bandsTs.split(/(?=\n  \{[\s\n]*id: \d+,)/);
let updated = 0;
let updatedBlocks = bandBlocks.map((block) => {
  const nameM = block.match(/name: [`"](.*?)[`"],/);
  if (!nameM) return block;

  const bandName = nameM[1]
    .replace(/\\u[\dA-Fa-f]{4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)))
    .trim();

  // Try exact match first, then partial
  let entry = results.get(bandName);
  if (!entry) {
    // Try case-insensitive
    for (const [k, v] of results) {
      if (k.toLowerCase() === bandName.toLowerCase()) { entry = v; break; }
    }
  }
  if (!entry) return block;

  const { image, youtube } = entry;
  let newBlock = block;

  // Remove existing image/youtube fields
  newBlock = newBlock.replace(/\n\s+image: "[^"]*",?/g, "");
  newBlock = newBlock.replace(/\n\s+youtube: "[^"]*",?/g, "");

  // Insert image after bandcamp (or after bio if no bandcamp)
  if (image) {
    if (newBlock.includes("bandcamp:")) {
      newBlock = newBlock.replace(/(bandcamp: "[^"]*",)/, `$1\n    image: "${image}",`);
    } else {
      newBlock = newBlock.replace(/(bio: `[^`]*`,)/, `$1\n    image: "${image}",`);
    }
    updated++;
  }

  // Insert youtube
  if (youtube) {
    const youtubeClean = youtube.replace(/\/embed\/([^?]+).*/, "/watch?v=$1").replace("https://www.youtube.com/watch?v=", "https://www.youtube.com/watch?v=");
    if (newBlock.includes("image:")) {
      newBlock = newBlock.replace(/(image: "[^"]*",)/, `$1\n    youtube: "${youtubeClean}",`);
    } else {
      newBlock = newBlock.replace(/(bio: `[^`]*`,)/, `$1\n    youtube: "${youtubeClean}",`);
    }
    if (!image) updated++;
  }

  return newBlock;
});

bandsTs = updatedBlocks.join("");
writeFileSync("lib/bands.ts", bandsTs);
console.log(`Updated ${updated} bands with media.`);
