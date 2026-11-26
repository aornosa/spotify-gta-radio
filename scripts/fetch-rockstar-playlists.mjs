// Finds the official GTA V station playlists owned by the Rockstar Games Spotify account.
// Spotify blocks listing another user's playlists, so we search each station name and
// keep only results owned by `rockstargames`.
// Usage: node --env-file=.env.local scripts/fetch-rockstar-playlists.mjs
const OWNER = "rockstargames";
const STATIONS = [
  "Los Santos Rock Radio", "Non-Stop-Pop FM", "Radio Los Santos", "Channel X",
  "Rebel Radio", "Soulwax FM", "East Los FM", "West Coast Classics", "Blue Ark",
  "WorldWide FM", "FlyLo FM", "The Lowdown 91.1", "Radio Mirror Park", "Space 103.2",
  "Vinewood Boulevard Radio", "Blonded Los Santos 97.8", "Los Santos Underground Radio",
  "The Lab", "Kult FM", "Still Slipping Los Santos", "MOTOMAMI Los Santos",
  "The Music Locker", "Radio X", "iFruit Radio", "Self Radio", "The Blue Ark",
  "Welcome to Los Santos", "GTA Online",
];

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");

const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});
if (!tokenRes.ok) throw new Error(`Token error ${tokenRes.status}: ${await tokenRes.text()}`);
const { access_token } = await tokenRes.json();
const api = async (url) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) throw new Error(`API ${res.status} ${url}: ${await res.text()}`);
  return res.json();
};

const found = new Map();
for (const q of [...STATIONS, "GTAV", "GTA V radio", "Rockstar Games"]) {
  const data = await api(
    `https://api.spotify.com/v1/search?type=playlist&limit=10&q=${encodeURIComponent(q + " GTAV")}`,
  );
  for (const p of data.playlists.items.filter(Boolean)) {
    if (p.owner?.id === OWNER) found.set(p.id, p.name);
  }
}

console.log(`${found.size} playlists owned by ${OWNER}:\n`);
for (const [pid, name] of [...found].sort((a, b) => a[1].localeCompare(b[1]))) {
  console.log(`${pid}\t${name}`);
}
