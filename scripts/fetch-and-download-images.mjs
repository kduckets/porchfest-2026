import { readFileSync, writeFileSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
await mkdir("public/band-images", { recursive: true });

// Fetch all entry IDs
console.log("Fetching entry list...");
const listResp = await fetch("https://somervilleartscouncil.org/wp-admin/admin-ajax.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
  body: "action=gv_datatables_data&view_id=18158&post_id=18174&nonce=4f80d96286&draw=1&start=0&length=-1",
});
const listJson = await listResp.json();

// name → entryId (prefer higher ID = newer)
const nameToEntry = new Map();
for (const row of listJson.data) {
  const m = row[0].match(/entry\/(\d+)\/[^>]*>([^<]+)<\/a>/);
  if (!m) continue;
  const id = parseInt(m[1]);
  const name = m[2].replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ").trim();
  if (!nameToEntry.has(name) || id > nameToEntry.get(name)) nameToEntry.set(name, id);
}
console.log(`${nameToEntry.size} entries`);

// Parse band names from bands.ts
const bandsTs = readFileSync("lib/bands.ts", "utf8");
const bandBlocks = bandsTs.split(/(?=\n  \{[\s\n]*id: \d+,)/);

// Fetch entry page → extract image URL and youtube URL
async function fetchEntryMedia(entryId) {
  const r = await fetch(`https://somervilleartscouncil.org/view/porchfest-single-entry/entry/${entryId}/`, {
    headers: { "User-Agent": UA },
  });
  const html = await r.text();

  // Image: find img with gv-field-id-17 class
  let imageUrl = null;
  const imgM = html.match(/src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"[^>]*class="[^"]*gv-field-id-17|class="[^"]*gv-field-id-17[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"|<img[^>]*src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"[^>]*class="[^"]*gv-field-id-17/);
  if (imgM) imageUrl = imgM[1] || imgM[2] || imgM[3];
  // Simpler fallback
  if (!imageUrl) {
    const m2 = html.match(/gv-field-id-17[\s\S]{0,300}?src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"/);
    if (m2) imageUrl = m2[1];
  }

  // YouTube embed
  const ytM = html.match(/src="(https:\/\/www\.youtube\.com\/embed\/([^"?]+))/);
  const youtube = ytM ? `https://www.youtube.com/watch?v=${ytM[2]}` : null;

  return { imageUrl, youtube };
}

// Download image, returns local path or null
async function downloadImage(bandId, imageUrl) {
  const outPath = `public/band-images/${bandId}.jpg`;
  if (existsSync(outPath)) return `/band-images/${bandId}.jpg`;
  try {
    const r = await fetch(imageUrl, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000) return null;
    await writeFile(outPath, buf);
    return `/band-images/${bandId}.jpg`;
  } catch { return null; }
}

// Process each band block
let imgCount = 0, ytCount = 0, failCount = 0;
const BATCH = 5;

// Collect bands with entry matches
const toProcess = [];
for (const block of bandBlocks) {
  const idM = block.match(/id: (\d+),/);
  const nameM = block.match(/name: [`"]([^`"]+)[`"]/);
  if (!idM || !nameM) continue;
  const bandId = idM[1];
  const bandName = nameM[1].replace(/\\u[\dA-Fa-f]{4}/g, c => String.fromCharCode(parseInt(c.slice(2), 16))).trim();

  let entryId = nameToEntry.get(bandName);
  if (!entryId) {
    for (const [k, v] of nameToEntry) {
      if (k.toLowerCase() === bandName.toLowerCase()) { entryId = v; break; }
    }
  }
  if (!entryId) {
    // partial match
    for (const [k, v] of nameToEntry) {
      if (k.replace(/…$/, '').toLowerCase().trim() === bandName.replace(/…$/, '').toLowerCase().trim()) {
        entryId = v; break;
      }
    }
  }
  toProcess.push({ bandId, bandName, entryId });
}

// Process in batches
const results = new Map(); // bandId → { localPath, youtube }
for (let i = 0; i < toProcess.length; i += BATCH) {
  const batch = toProcess.slice(i, i + BATCH);
  await Promise.all(batch.map(async ({ bandId, entryId }) => {
    if (!entryId) return;
    try {
      const { imageUrl, youtube } = await fetchEntryMedia(entryId);
      let localPath = null;
      if (imageUrl) {
        localPath = await downloadImage(bandId, imageUrl);
        if (localPath) imgCount++;
        else failCount++;
      }
      if (localPath || youtube) results.set(bandId, { localPath, youtube });
    } catch { failCount++; }
  }));
  process.stdout.write(`\r${Math.min(i + BATCH, toProcess.length)}/${toProcess.length} (${imgCount} img, ${ytCount} yt, ${failCount} fail)`);
}
console.log("\nDone fetching.");

// Update bands.ts: insert image and youtube fields into each band block
const updatedBlocks = bandBlocks.map((block) => {
  const idM = block.match(/id: (\d+),/);
  if (!idM) return block;
  const media = results.get(idM[1]);
  if (!media) return block;

  let newBlock = block;
  // Remove any existing image/youtube fields (safety)
  newBlock = newBlock.replace(/\n\s+image: "[^"]*",?/g, "");
  newBlock = newBlock.replace(/\n\s+youtube: "[^"]*",?/g, "");

  if (media.localPath) {
    // Insert after bandcamp or after bio
    if (newBlock.includes('bandcamp:')) {
      newBlock = newBlock.replace(/(bandcamp: "[^"]*",)/, `$1\n    image: "${media.localPath}",`);
    } else {
      newBlock = newBlock.replace(/(bio: `[^`]*`,)/, `$1\n    image: "${media.localPath}",`);
    }
  }
  if (media.youtube) {
    if (newBlock.includes('image:')) {
      newBlock = newBlock.replace(/(image: "[^"]*",)/, `$1\n    youtube: "${media.youtube}",`);
    } else if (newBlock.includes('bandcamp:')) {
      newBlock = newBlock.replace(/(bandcamp: "[^"]*",)/, `$1\n    youtube: "${media.youtube}",`);
    } else {
      newBlock = newBlock.replace(/(bio: `[^`]*`,)/, `$1\n    youtube: "${media.youtube}",`);
    }
    ytCount++;
  }
  return newBlock;
});

writeFileSync("lib/bands.ts", updatedBlocks.join(""));
const finalImg = (updatedBlocks.join("").match(/image: "\/band-images\//g) || []).length;
const finalYt = (updatedBlocks.join("").match(/youtube:/g) || []).length;
console.log(`bands.ts: ${finalImg} local images, ${finalYt} youtube links`);
