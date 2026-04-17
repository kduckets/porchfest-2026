import { readFileSync, writeFileSync, existsSync } from "fs";
import { writeFile } from "fs/promises";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Fetch entry list
console.log("Fetching entry list...");
const listResp = await fetch("https://somervilleartscouncil.org/wp-admin/admin-ajax.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
  body: "action=gv_datatables_data&view_id=18158&post_id=18174&nonce=4f80d96286&draw=1&start=0&length=-1",
});
const listJson = await listResp.json();

// Build name → entryId (prefer higher ID)
const nameToEntry = new Map();
for (const row of listJson.data) {
  const m = row[0].match(/entry\/(\d+)\/[^>]*>([^<]+)<\/a>/);
  if (!m) continue;
  const id = parseInt(m[1]);
  const name = m[2].replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ").trim();
  if (!nameToEntry.has(name) || id > nameToEntry.get(name)) nameToEntry.set(name, id);
}

// Read bands.ts — find which bands have images (gk-download) and match to entry IDs
const bandsTs = readFileSync("lib/bands.ts", "utf8");

// Find bands that currently have gk-download URLs
const staleRe = /id: (\d+),\s*\n\s*name: [`"]([^`"]+)[`"]/g;
const bandNames = new Map(); // bandId → name
let sm;
while ((sm = staleRe.exec(bandsTs)) !== null) {
  bandNames.set(sm[1], sm[2].replace(/\\u[\dA-Fa-f]{4}/g, c => String.fromCharCode(parseInt(c.slice(2), 16))));
}

// Find bands with gk-download images
const gkRe = /id: (\d+),[\s\S]{0,500}?image: "(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"/g;
const bandsWithStaleImages = new Set();
let gm;
while ((gm = gkRe.exec(bandsTs)) !== null) {
  bandsWithStaleImages.add(gm[1]);
}
console.log(`${bandsWithStaleImages.size} bands have stale gk-download images`);

// For each band, find its entry ID then fetch fresh image URL
async function fetchFreshImageUrl(entryId) {
  const r = await fetch(`https://somervilleartscouncil.org/view/porchfest-single-entry/entry/${entryId}/`, {
    headers: { "User-Agent": UA },
  });
  const html = await r.text();
  // Try to find img with gv-field-id-17 class
  const m = html.match(/class="[^"]*gv-field-id-17[^"]*"[^>]*src="([^"]+)"|src="([^"]+)"[^>]*class="[^"]*gv-field-id-17/);
  if (m) return m[1] || m[2];
  // Try srcset or data-src
  const m2 = html.match(/gv-field-id-17[\s\S]{0,200}?src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"/);
  if (m2) return m2[1];
  return null;
}

async function downloadImage(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) return null; // reject HTML responses
  return buf;
}

let downloaded = 0, failed = 0, skipped = 0;
const BATCH = 5;
const updates = []; // { bandId, oldUrl, localPath }

const bandIds = [...bandsWithStaleImages];
for (let i = 0; i < bandIds.length; i += BATCH) {
  const batch = bandIds.slice(i, i + BATCH);
  await Promise.all(batch.map(async (bandId) => {
    const outPath = `public/band-images/${bandId}.jpg`;
    if (existsSync(outPath)) {
      skipped++;
      // Still record the update needed for bands.ts
      const gkMatch = bandsTs.match(new RegExp(`id: ${bandId},[\\s\\S]{0,500}?image: "(https://somervilleartscouncil\\.org/gk-download/[^"]+)"`));
      if (gkMatch) updates.push({ bandId, oldUrl: gkMatch[1], localPath: `/${outPath}` });
      return;
    }

    // Find entry ID for this band
    const bandName = bandNames.get(bandId);
    let entryId = bandName ? nameToEntry.get(bandName) : null;
    if (!entryId && bandName) {
      for (const [k, v] of nameToEntry) {
        if (k.toLowerCase() === bandName?.toLowerCase()) { entryId = v; break; }
      }
    }
    if (!entryId) { failed++; return; }

    try {
      const freshUrl = await fetchFreshImageUrl(entryId);
      if (!freshUrl) { failed++; return; }
      const buf = await downloadImage(freshUrl);
      if (!buf) { failed++; return; }
      await writeFile(outPath, buf);

      // Find old URL in bands.ts for this band
      const gkMatch = bandsTs.match(new RegExp(`id: ${bandId},[\\s\\S]{0,500}?image: "(https://somervilleartscouncil\\.org/gk-download/[^"]+)"`));
      if (gkMatch) updates.push({ bandId, oldUrl: gkMatch[1], localPath: `/${outPath}` });
      downloaded++;
    } catch (e) { failed++; }
  }));
  const done = downloaded + failed + skipped;
  process.stdout.write(`\r${done}/${bandIds.length} (${downloaded} dl, ${skipped} skip, ${failed} fail)`);
}
console.log("\nDownloads done.");

// Update bands.ts: replace old gk-download URLs with local paths
let updatedTs = bandsTs;
for (const { oldUrl, localPath } of updates) {
  updatedTs = updatedTs.replace(`"${oldUrl}"`, `"${localPath.replace('public/', '/')}"`);
}
// Also replace any remaining gk-download URLs for bands we successfully downloaded
for (const bandId of bandIds) {
  const localPath = `/band-images/${bandId}.jpg`;
  if (existsSync(`public${localPath}`)) {
    updatedTs = updatedTs.replace(
      new RegExp(`(id: ${bandId},[\\s\\S]{0,500}?image: )"https://somervilleartscouncil\\.org/gk-download/[^"]+"`),
      `$1"${localPath}"`
    );
  }
}

writeFileSync("lib/bands.ts", updatedTs);
const localCount = (updatedTs.match(/image: "\/band-images\//g) || []).length;
const remainingGk = (updatedTs.match(/gk-download/g) || []).length;
console.log(`bands.ts: ${localCount} local paths, ${remainingGk} still gk-download`);
