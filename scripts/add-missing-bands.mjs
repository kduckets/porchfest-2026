import { readFileSync, writeFileSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Zone color mapping (same as existing bands)
const ZONE_COLORS = {
  west: "#4F9FD0",
  central: "#1B7A70",
  east: "#C44A3A",
};

// Determine zone from start time
function getZone(time) {
  const m = time.match(/^(\d+):(\d+)(am|pm)/i);
  if (!m) return "west";
  let h = parseInt(m[1]);
  const meridiem = m[3].toLowerCase();
  if (meridiem === "pm" && h !== 12) h += 12;
  if (h < 14) return "west";
  if (h < 16) return "central";
  return "east";
}

// Get primary genre from genre list
function primaryGenre(genres) {
  if (!genres || !genres.trim()) return "Rock";
  return genres.split(",")[0].trim();
}

// Parse genres array
function parseGenres(genres) {
  if (!genres || !genres.trim()) return ["Rock"];
  return genres.split(",").map(g => g.trim()).filter(Boolean);
}

// Geocode address using Nominatim
async function geocode(address) {
  const query = `${address}, Somerville, MA`;
  await new Promise(r => setTimeout(r, 1100)); // rate limit: 1 req/sec
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "porchfest-2026-app/1.0" } }
    );
    const data = await r.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

// Fetch bio + image + youtube from entry page
async function fetchEntryMedia(entryId) {
  try {
    const r = await fetch(`https://somervilleartscouncil.org/view/porchfest-single-entry/entry/${entryId}/`, {
      headers: { "User-Agent": UA },
    });
    const html = await r.text();
    // Bio
    const bioM = html.match(/class="gv-field-10-42[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|td)>/);
    const bio = bioM ? bioM[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#039;/g, "'").replace(/&rsquo;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&ndash;/g, "–").trim() : "";
    // Image
    const imgM = html.match(/src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"[^>]*class="[^"]*gv-field-id-17|gv-field-id-17[\s\S]{0,300}?src="(https:\/\/somervilleartscouncil\.org\/gk-download\/[^"]+)"/);
    const imgUrl = imgM ? (imgM[1] || imgM[2]) : null;
    // YouTube
    const ytM = html.match(/src="(https:\/\/www\.youtube\.com\/embed\/([^"?]+))/);
    const youtube = ytM ? `https://www.youtube.com/watch?v=${ytM[2]}` : null;
    return { bio, imgUrl, youtube };
  } catch {
    return { bio: "", imgUrl: null, youtube: null };
  }
}

// Download image
async function downloadImage(bandId, imageUrl) {
  await mkdir("public/band-images", { recursive: true });
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

// The missing bands list with their CSV data
const missingBands = [
  { name: "Aardvark", time: "12:00pm – 2:00pm", genre: "Rock", address: "14 St James Ave, Somerville" },
  { name: "All Bangers No Clangers", time: "12:00pm – 2:00pm", genre: "", address: "31 Ossipee Road, Somerville" },
  { name: "Birds on Thursday", time: "12:00pm – 2:00pm", genre: "Indie", address: "8 Russell Rd, Somerville" },
  { name: "Brother Gabriel", time: "12:00pm – 1:00pm", genre: "Blues, Rock", address: "85 Bromfield Rd, Somerville" },
  { name: "Day Grazer", time: "12:00pm – 2:00pm", genre: "Rock", address: "9 Barton Street, Somerville" },
  { name: "DJ BbyBrd", time: "12:00pm – 1:30pm", genre: "Electronic", address: "20 Ellington Rd, Somerville" },
  { name: "Echo Bridge", time: "12:00pm – 2:00pm", genre: "", address: "45 Russell St, Somerville" },
  { name: "Espalier", time: "12:00pm – 1:00pm", genre: "Punk", address: "37 Paulina St, Somerville" },
  { name: "Funk Safari", time: "12:00pm – 2:00pm", genre: "Funk", address: "55 Wallace St, Somerville" },
  { name: "Jazz Rats Trio", time: "12:00pm – 2:00pm", genre: "Jazz", address: "14 Ellington Rd, Somerville" },
  { name: "Louder Than Milk & Slow Boat Home", time: "12:00pm – 2:00pm", genre: "Americana", address: "11 Morrison Pl, Somerville" },
  { name: "Major Grid", time: "12:00pm – 2:00pm", genre: "Indie", address: "104 North St, Somerville" },
  { name: "Mostly Bones", time: "12:00pm – 12:45pm", genre: "Jazz", address: "144 Morrison Ave, Somerville" },
  { name: "Muddy River Junction", time: "12:00pm – 2:00pm", genre: "Rock", address: "17 Endicott Ave, Somerville" },
  { name: "Nablus Road", time: "12:00pm – 1:00pm", genre: "", address: "66 Hall Ave, Somerville" },
  { name: "Panic! At the T Stop", time: "12:00pm – 2:00pm", genre: "Pop, Punk, Rock", address: "12 Cameron Ave, Somerville" },
  { name: "Playing with Fire", time: "12:00pm – 2:00pm", genre: "Rock", address: "4 College Ave, Somerville" },
  { name: "Regal Seagulls", time: "12:00pm – 2:00pm", genre: "Jazz", address: "64 Meacham Rd, Somerville" },
  { name: "Reward for Excellence", time: "12:00pm – 1:15pm", genre: "Indie", address: "158 Morrison Ave, Somerville" },
  { name: "Sing About that Elephant in the Roo…", time: "12:00pm – 2:00pm", genre: "Indie", address: "22 Liberty Ave, Somerville" },
  { name: "Spicy Rangoons", time: "12:00pm – 2:00pm", genre: "Rock", address: "28 Fairmount Ave, Somerville" },
  { name: "Spruce & Matt Lillie", time: "12:00pm – 2:00pm", genre: "Rock", address: "10 Mead St, Somerville" },
  { name: "State of Nature", time: "12:00pm – 2:00pm", genre: "Rock", address: "41 Ossipee Rd, Somerville" },
  { name: "Warm-Blooded Mammal", time: "12:00pm – 2:00pm", genre: "Pop", address: "44 Clarendon Ave, Somerville" },
  { name: "Watson Park", time: "12:00pm – 2:00pm", genre: "Indie", address: "9 Chapel St, Somerville" },
  { name: "Stacy and the Party", time: "12:15pm – 2:00pm", genre: "Indie", address: "26 Appleton St, Somerville" },
  { name: "The Last Second", time: "12:15pm – 1:00pm", genre: "Indie, Pop", address: "9 Thorndike St, Somerville" },
  { name: "Grapevine", time: "12:30pm – 1:30pm", genre: "Folk", address: "70 Ossipee Rd, Somerville" },
  { name: "cedar", time: "1:00pm – 2:00pm", genre: "Indie", address: "116 Pearson Rd, Somerville" },
  { name: "Lamb Rest", time: "1:00pm – 2:00pm", genre: "Rock", address: "90 Bromfield Rd, Somerville" },
  { name: "Seibab Ssip", time: "1:00pm – 2:00pm", genre: "Rock", address: "37 Paulina St, Somerville" },
  { name: "SLAPPY PAPPY", time: "1:00pm – 2:00pm", genre: "Bluegrass", address: "62 Liberty Ave, Somerville" },
  { name: "Alex, Joel, Thomas Trio", time: "2:00pm – 4:00pm", genre: "Jazz", address: "69 Lexington Ave, Somerville" },
  { name: "Alive After Five", time: "2:00pm – 4:00pm", genre: "Rock", address: "60 Murdock St, Somerville" },
  { name: "Anemoia", time: "2:00pm – 3:00pm", genre: "Rock", address: "12 Benton Rd, Somerville" },
  { name: "Bell System and Pals", time: "2:00pm – 4:00pm", genre: "Electronic", address: "26 Hudson St, Somerville" },
  { name: "Boston Liberation Center (BLC) Band", time: "2:00pm – 4:00pm", genre: "Jazz, Latin, Pop, Rock, R&B", address: "166 Albion St, Somerville" },
  { name: "Cassie Kollman Quartet", time: "2:00pm – 3:00pm", genre: "Jazz", address: "79 Hudson St, Somerville" },
  { name: "Come By This", time: "2:00pm – 3:00pm", genre: "Rock", address: "36 Rogers Ave, Somerville" },
  { name: "Currently Naught", time: "2:00pm – 4:00pm", genre: "Latin", address: "47 Harrison St, Somerville" },
  { name: "Dr. Beaver 貫子髙 feat. Boston…", time: "2:00pm – 4:00pm", genre: "Folk, Pop, Rock, Singer/songwriter, World", address: "9 Spencer Ave, Somerville" },
  { name: "Erika Renée", time: "2:00pm – 3:00pm", genre: "Singer/songwriter", address: "6 Holyoke Rd, Somerville" },
  { name: "Grape Slushies", time: "2:00pm – 4:00pm", genre: "", address: "12 Evergreen Square, Somerville" },
  { name: "Hill House The Band & The Far Out", time: "2:00pm – 4:00pm", genre: "Pop", address: "15 Westwood Rd, Somerville" },
  { name: "Hoppers", time: "2:00pm – 3:00pm", genre: "Electronic", address: "102 Morrison Ave, Somerville" },
  { name: "Keeping Time", time: "2:00pm – 4:00pm", genre: "Jazz", address: "16 Brastow Avenue, Somerville" },
  { name: "Late Weights", time: "2:00pm – 4:00pm", genre: "Rock", address: "35 Princeton St, Somerville" },
  { name: "Leaf and Machine", time: "2:00pm – 2:40pm", genre: "Indie", address: "4 Banks St, Somerville" },
  { name: "Michael Reilly Peraza is That Guy", time: "2:00pm – 4:00pm", genre: "Rock", address: "29 Warwick St, Somerville" },
  { name: "Mr. Rat's Petals", time: "2:00pm – 3:00pm", genre: "Bluegrass, Folk", address: "115 Highland Rd, Somerville" },
  { name: "Nightjar", time: "2:00pm – 3:00pm", genre: "Indie", address: "17 Ibbetson Street, Somerville" },
  { name: "One Lonely Meerkat", time: "2:00pm – 2:27pm", genre: "Indie", address: "44 Morrison Ave, Somerville" },
  { name: "Pat and Dank Play Music!", time: "2:00pm – 4:00pm", genre: "Americana", address: "59 Pearson Ave, Somerville" },
  { name: "Patrick Synan", time: "2:00pm – 4:00pm", genre: "Bluegrass", address: "10 Lesley Ave, Somerville" },
  { name: "PRETTY PANTHA", time: "2:00pm – 4:00pm", genre: "Rock", address: "Wade Ct, Somerville" },
  { name: "Purple Corn", time: "2:00pm – 4:00pm", genre: "Pop", address: "29 Cambria St, Somerville" },
  { name: "Rain House", time: "2:00pm – 4:00pm", genre: "Blues", address: "42 Spencer Ave, Somerville" },
  { name: "Rat of the Year", time: "2:00pm – 4:00pm", genre: "Pop, Punk, Rock", address: "5 Stanford Terrace, Somerville" },
  { name: "Riches the Fish", time: "2:00pm – 4:00pm", genre: "Indie", address: "55 Fremont St, Somerville" },
  { name: "Seldom Chalant", time: "2:00pm – 3:30pm", genre: "Pop", address: "8 Craigie St, Somerville" },
  { name: "SG Stone", time: "2:00pm – 4:00pm", genre: "Rock", address: "454 Medford St, Somerville" },
  { name: "Ship of Fools & Friends", time: "2:00pm – 4:00pm", genre: "Rock", address: "19 Trull St, Somerville" },
  { name: "Stella Starfox", time: "2:00pm – 4:00pm", genre: "Indie, Pop, Rock", address: "22 Wade Ct, Somerville" },
  { name: "The Cherry Pits and Viv Moda", time: "2:00pm – 4:00pm", genre: "Blues, Pop, Rock", address: "28 Hall St, Somerville" },
  { name: "The Coe Street Co-Op", time: "2:00pm – 4:00pm", genre: "Americana", address: "53 Rogers Ave, Somerville" },
  { name: "The Flakes", time: "2:00pm – 4:00pm", genre: "Pop", address: "89 Morrison Ave, Somerville" },
  { name: "The Goobers", time: "2:00pm – 3:00pm", genre: "Pop", address: "33 Pearson Ave, Somerville" },
  { name: "The Hopeless Romantics", time: "2:00pm – 3:00pm", genre: "Rock", address: "28 Aberdeen Rd, Somerville" },
  { name: "The Pointe", time: "2:00pm – 4:00pm", genre: "Rock", address: "110 Glenwood Rd, Somerville" },
  { name: "The Waterspouts", time: "2:00pm – 4:00pm", genre: "Rock", address: "25 Burnside Ave, Somerville" },
  { name: "Truckers Atlas", time: "2:00pm – 4:00pm", genre: "Indie", address: "53 Rogers Ave, Somerville" },
  { name: "VO Extra Special", time: "2:00pm – 4:00pm", genre: "Folk, Indie, Rock", address: "34 Morrison Ave, Somerville" },
  { name: "Weird Frenz", time: "2:00pm – 3:00pm", genre: "Indie", address: "56 Vernon St, Somerville" },
  { name: "WHOP", time: "2:00pm – 4:00pm", genre: "Rock", address: "40 A Hancock St, Somerville" },
  { name: "Wilf", time: "2:00pm – 4:00pm", genre: "Folk, Singer/songwriter", address: "8 Steeves Cir, Somerville" },
  { name: "Calcifer", time: "3:00pm – 4:00pm", genre: "Jazz", address: "81 Boston Avenue, Somerville" },
  { name: "Lockstep", time: "3:00pm – 4:00pm", genre: "Indie, Pop", address: "28 Aberdeen Rd, Somerville" },
  { name: "mz konduct", time: "3:00pm – 4:00pm", genre: "Punk, Rock", address: "35 Princeton St, Somerville" },
  { name: "Rooftop Garden", time: "3:00pm – 4:00pm", genre: "Rock", address: "26 Pearson Ave, Somerville" },
  { name: "The Merman", time: "3:00pm – 4:00pm", genre: "Pop", address: "24 Alpine St, Somerville" },
  { name: "The Van Burens", time: "3:00pm – 4:00pm", genre: "Funk", address: "56 Vernon Street, Somerville" },
  { name: "Alex & the People", time: "4:00pm – 5:00pm", genre: "Rock", address: "12 Grand View Ave, Somerville" },
  { name: "Bahloul & Friends", time: "4:00pm – 6:00pm", genre: "World", address: "30 Evergreen Ave, Somerville" },
  { name: "Baker Thomas Band", time: "4:00pm – 6:00pm", genre: "Rock", address: "58 Fellsway W, Somerville" },
  { name: "Bent Luck", time: "4:00pm – 6:00pm", genre: "Punk", address: "12 Sunnyside Ave, Somerville" },
  { name: "Cat Noeth", time: "4:00pm – 6:00pm", genre: "Country, Indie, Rock, Singer/songwriter", address: "46 Dartmouth St, Somerville" },
  { name: "Cloud Prescott", time: "4:00pm – 6:00pm", genre: "Pop", address: "35 Dane Street, Somerville" },
  { name: "Copilot", time: "4:00pm – 6:00pm", genre: "Rock", address: "75 Marshall St, Somerville" },
  { name: "Couch", time: "4:00pm – 6:00pm", genre: "Pop", address: "10 Magnus Ave, Somerville" },
  { name: "DJs at Black Cat Labs, Presented by…", time: "4:00pm – 6:00pm", genre: "Funk", address: "47 Webster Ave, Somerville" },
  { name: "Drug Deal Gone Rad", time: "4:00pm – 4:30pm", genre: "Punk", address: "14 Lincoln Pkwy, Somerville" },
  { name: "Entifan", time: "4:00pm – 5:00pm", genre: "Folk", address: "35 Dane St, Somerville" },
  { name: "Graham Sahagian and Pat Convery", time: "4:00pm – 6:00pm", genre: "Americana, Indie", address: "14 Calvin St, Somerville" },
  { name: "Great Uncle Peter", time: "4:00pm – 6:00pm", genre: "Rock", address: "12 Sunnyside Ave, Somerville" },
  { name: "Hilltop Sunset", time: "4:00pm – 4:45pm", genre: "Folk", address: "70 Newton St, Somerville" },
  { name: "Hot Take", time: "4:00pm – 6:00pm", genre: "Rock", address: "8 Lee St, Somerville" },
  { name: "Jack & The Offs", time: "4:00pm – 5:00pm", genre: "Rock", address: "8 Pembroke Ct, Somerville" },
  { name: "Jimmy Kelly & Friends", time: "4:00pm – 6:00pm", genre: "Bluegrass, Folk", address: "82 Concord Ave, Somerville" },
  { name: "Justin & Friends", time: "4:00pm – 6:00pm", genre: "Americana", address: "11 Pleasant Ave, Somerville" },
  { name: "layzi", time: "4:00pm – 4:45pm", genre: "Indie", address: "40 Laurel St, Somerville" },
  { name: "Lenny's Funk Club", time: "4:00pm – 4:00pm", genre: "Indie", address: "4 Bolton St, Somerville" },
  { name: "Leviathan", time: "4:00pm – 6:00pm", genre: "Pop", address: "23 Summit ave, Somerville" },
  { name: "Live Code Boston", time: "4:00pm – 6:00pm", genre: "Electronic", address: "71 Bonair St, Somerville" },
  { name: "Local Milk", time: "4:00pm – 5:00pm", genre: "Indie, Rock", address: "92 Concord Ave, Somerville" },
  { name: "Mary Hail", time: "4:00pm – 6:00pm", genre: "Indie", address: "9 Kingman Rd, Somerville" },
  { name: "Melted Chapsticks", time: "4:00pm – 6:00pm", genre: "Rock", address: "515 Somerville Ave, Somerville" },
  { name: "Missed Call", time: "4:00pm – 5:00pm", genre: "Funk", address: "46 Laurel St, Somerville" },
  { name: "Mnemonist", time: "4:00pm – 6:00pm", genre: "Indie", address: "12 Grand View Ave, Somerville" },
  { name: "Nala on the Moon", time: "4:00pm – 5:00pm", genre: "Indie", address: "40 Stone Ave, Somerville" },
  { name: "Otis Shanty", time: "4:00pm – 5:30pm", genre: "Indie", address: "71 Boston St, Somerville" },
  { name: "Phil and the Flying Leap", time: "4:00pm – 5:30pm", genre: "Folk", address: "65 Merriam St, Somerville" },
  { name: "Pluto's Return", time: "4:00pm – 6:00pm", genre: "Rock", address: "17 Aldersey St, Somerville" },
  { name: "Postmoral", time: "4:00pm – 6:00pm", genre: "Americana, Punk", address: "50 1/2 Prescott St, Somerville" },
  { name: "Saklamara/Porchfest Project", time: "4:00pm – 6:00pm", genre: "World", address: "43 Springfield St, Somerville" },
  { name: "Shadows on the Mountain", time: "4:00pm – 5:00pm", genre: "Folk, Pop", address: "321 Washington St, Somerville" },
  { name: "Sherry's Friends", time: "4:00pm – 6:00pm", genre: "Pop", address: "20 Prospect St, Somerville" },
  { name: "Solo Piper", time: "4:00pm – 6:00pm", genre: "Folk", address: "7 Dickinson St, Somerville" },
  { name: "Sun Salon", time: "4:00pm – 6:00pm", genre: "Jazz", address: "12 Sunnyside Ave, Somerville" },
  { name: "The Gronwup Noise, Horsehands, peop…", time: "4:00pm – 6:00pm", genre: "Folk, Indie, Pop, Rock, Singer/songwriter", address: "32 Prescott St, Somerville" },
  { name: "The Jam Brands", time: "4:00pm – 6:00pm", genre: "Rock", address: "88 Prospect St, Somerville" },
  { name: "The nãgs", time: "4:00pm – 6:00pm", genre: "World", address: "20 Avon St, Somerville" },
  { name: "The Toucans", time: "4:00pm – 6:00pm", genre: "Rock", address: "63 Marshall St, Somerville" },
  { name: "The Wickies", time: "4:00pm – 6:00pm", genre: "", address: "64 Park St, Somerville" },
  { name: "Tony and Clio Flackett", time: "4:00pm – 6:00pm", genre: "Singer/songwriter", address: "32 Lincoln Pkwy, Somerville" },
  { name: "Unusual Methods", time: "4:00pm – 6:00pm", genre: "Punk", address: "51 Avon St, Somerville" },
  { name: "Wetware", time: "4:00pm – 6:00pm", genre: "Electronic", address: "5 Morgan St, Somerville" },
  { name: "items", time: "4:30pm – 5:30pm", genre: "Indie", address: "10 Tennyson Street, Somerville" },
  { name: "MIK-E", time: "4:30pm – 5:30pm", genre: "Indie", address: "19 Bolton St, Somerville" },
  { name: "The ABCs", time: "4:30pm – 5:15pm", genre: "Punk", address: "16 Oxford St, Somerville" },
  { name: "The Fisticuffs", time: "4:30pm – 5:30pm", genre: "Metal, Rock", address: "60 Prescott St, Somerville" },
  { name: "Hog Trouble", time: "5:00pm – 6:00pm", genre: "Rock", address: "12 Indiana Ave, Somerville" },
  { name: "Imagine Pigeons", time: "5:00pm – 6:00pm", genre: "Indie, Pop, Rock, Soul", address: "60 Avon St, Somerville" },
  { name: "May Street Quintet", time: "5:00pm – 6:00pm", genre: "Jazz", address: "82 Munroe St, Somerville" },
  { name: "Mel Starr & the Astral Projection", time: "5:00pm – 6:00pm", genre: "Indie", address: "4 Bolton St, Somerville" },
  { name: "Regal Seagull", time: "5:00pm – 6:00pm", genre: "Rock", address: "8 Pembroke Ct, Somerville" },
  { name: "The Glow", time: "5:00pm – 6:00pm", genre: "Blues, Soul", address: "20 Wesley St, Somerville" },
  { name: "The Number Three", time: "5:00pm – 6:00pm", genre: "Rock", address: "42 Allen St, Somerville" },
  { name: "The Weekend Commitments", time: "5:00pm – 6:00pm", genre: "Rock", address: "21 Gilman Street, Somerville" },
  { name: "Three Weeks Notice", time: "5:00pm – 6:00pm", genre: "Indie", address: "70 Newton Street, Somerville" },
  { name: "Viruette", time: "5:00pm – 6:00pm", genre: "Indie", address: "40 Laurel St, Somerville" },
  { name: "The Dotted Lines", time: "5:01pm – 5:59pm", genre: "Indie, Punk, Rock", address: "40 Stone Ave, Somerville" },
  { name: "Stuck on Static", time: "5:30pm – 6:00pm", genre: "Indie", address: "28 Adrian St, Somerville" },
];

// Fetch entry list to find entry IDs (nonce from /porchfest/porchfest-listing/)
console.log("Fetching entry list nonce...");
const listingPage = await fetch("https://somervilleartscouncil.org/porchfest/porchfest-listing/", {
  headers: { "User-Agent": UA },
});
const listingHtml = await listingPage.text();
const listingCookies = listingPage.headers.getSetCookie ? listingPage.headers.getSetCookie() : [];
const nonceM = listingHtml.match(/"nonce":"([a-f0-9]+)"/);
if (!nonceM) throw new Error("Could not find nonce in listing page");
const nonce = nonceM[1];
console.log(`Got nonce: ${nonce}`);

console.log("Fetching entry list...");
const listResp = await fetch("https://somervilleartscouncil.org/wp-admin/admin-ajax.php", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": UA,
    "Referer": "https://somervilleartscouncil.org/porchfest/porchfest-listing/",
    ...(listingCookies.length ? { "Cookie": listingCookies.join("; ") } : {}),
  },
  body: `action=gv_datatables_data&view_id=18158&post_id=18174&nonce=${nonce}&getData=false&hideUntilSearched=0&draw=1&start=0&length=-1`,
});
const listJson = await listResp.json();

const nameToEntry = new Map();
for (const row of listJson.data) {
  const m = row[0].match(/entry\/(\d+)\/[^>]*>([^<]+)<\/a>/);
  if (!m) continue;
  const id = parseInt(m[1]);
  const name = m[2].replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ").trim();
  if (!nameToEntry.has(name) || id > nameToEntry.get(name)) nameToEntry.set(name, id);
}

// Read current bands.ts
let bandsTs = readFileSync("lib/bands.ts", "utf8");
let nextId = 404;

const newBandEntries = [];

for (let i = 0; i < missingBands.length; i++) {
  const band = missingBands[i];
  process.stdout.write(`\r[${i+1}/${missingBands.length}] ${band.name.slice(0,30).padEnd(30)}`);

  const zone = getZone(band.time);
  const genre = primaryGenre(band.genre);
  const genres = parseGenres(band.genre);
  const color = ZONE_COLORS[zone];

  // Find entry ID
  let entryId = nameToEntry.get(band.name);
  if (!entryId) {
    const nameLower = band.name.toLowerCase().replace(/…$/, '').trim();
    for (const [k, v] of nameToEntry) {
      const kLower = k.toLowerCase().replace(/…$/, '').trim();
      if (kLower === nameLower || kLower.startsWith(nameLower.slice(0,15)) || nameLower.startsWith(kLower.slice(0,15))) {
        entryId = v; break;
      }
    }
  }

  // Fetch media
  let bio = "", localImagePath = null, youtube = null;
  if (entryId) {
    const media = await fetchEntryMedia(entryId);
    bio = media.bio;
    youtube = media.youtube;
    if (media.imgUrl) {
      localImagePath = await downloadImage(nextId, media.imgUrl);
    }
  }

  // Geocode
  const coords = await geocode(band.address);
  const lat = coords?.lat ?? 42.3876;
  const lng = coords?.lng ?? -71.1132;

  const addrDisplay = band.address.replace(/, Somerville$/, "") + ", Somerville";

  // Build band entry
  const lines = [
    `  {`,
    `    id: ${nextId},`,
    `    name: \`${band.name.replace(/`/g, "'")}\`,`,
    `    genre: "${genre}",`,
    `    genres: [${genres.map(g => `"${g}"`).join(", ")}],`,
    `    zone: "${zone}",`,
    `    time: "${band.time}",`,
    `    address: "${addrDisplay}",`,
    `    bio: \`${bio.replace(/`/g, "'")}\`,`,
    localImagePath ? `    image: "${localImagePath}",` : null,
    youtube ? `    youtube: "${youtube}",` : null,
    `    lat: ${lat.toFixed(6)},`,
    `    lng: ${lng.toFixed(6)},`,
    `    color: "${color}",`,
    `  },`,
  ].filter(Boolean).join("\n");

  newBandEntries.push(lines);
  nextId++;
}

console.log(`\n\nGenerated ${newBandEntries.length} new band entries`);

// Insert before the closing bracket of BANDS array
bandsTs = bandsTs.replace(/\];\s*$/, newBandEntries.join("\n") + "\n];");
writeFileSync("lib/bands.ts", bandsTs);
console.log("Written to lib/bands.ts");
