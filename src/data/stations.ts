export interface Station {
  id: string;
  name: string;
  /** Short label for the badge on the wheel. */
  short: string;
  genre: string;
  color: string;
  playlistId: string;
  /** Playlist cover art (Spotify CDN). */
  image?: string;
  custom?: boolean;
}

/**
 * Default stations: official playlists published by the Rockstar Games Spotify
 * account (owner id `rockstargames`). Found with scripts/fetch-rockstar-playlists.mjs.
 * Stations without an official Rockstar playlist are intentionally left out.
 */
export const DEFAULT_STATIONS: Station[] = [
  { id: "ls-rock", name: "Los Santos Rock Radio", short: "LSRR", genre: "Classic rock", color: "#d94f30", playlistId: "6DgiDBgyHTWhd997CR8SHK", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da846c39c7820202568dbde46039" },
  { id: "non-stop-pop", name: "Non-Stop-Pop FM", short: "NSP", genre: "Pop", color: "#e84393", playlistId: "119RwhTmhNelp6IqJpt0K4", image: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cace76c7df336b501e329e718" },
  { id: "radio-ls", name: "Radio Los Santos", short: "RLS", genre: "Modern hip-hop", color: "#f1c40f", playlistId: "3xJbVoB5fvWhCV8hVhsU5b", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c600977b28a75baf057e07a92" },
  { id: "channel-x", name: "Channel X", short: "CHX", genre: "Punk", color: "#c0392b", playlistId: "6a7d9LEO2H6sr2Upb0rKI5", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72cd917ec02abecaeac9daa81e0" },
  { id: "rebel", name: "Rebel Radio", short: "RBL", genre: "Country", color: "#a0522d", playlistId: "1q89ugwbPGMwjAlgX1k5Jz", image: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8490efcc2f4befedace134bc2a" },
  { id: "soulwax", name: "Soulwax FM", short: "SWX", genre: "Electronic", color: "#8e44ad", playlistId: "5b2v391AwkTQDVE8nSEulG", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c6dd56e4d427b4e9a4fc501ac" },
  { id: "east-los", name: "East Los FM", short: "ELF", genre: "Mexican", color: "#27ae60", playlistId: "5Alfk8JLqHk6r61zQLrMqR", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da8443bd814f9ce5fb572ac90495" },
  { id: "wcc", name: "West Coast Classics", short: "WCC", genre: "Classic hip-hop", color: "#2c3e50", playlistId: "0aslgxsPY13vd3X1IuxeE6", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c5a6a083e1619569cd4204fcd" },
  { id: "blue-ark", name: "The Blue Ark", short: "ARK", genre: "Reggae", color: "#2980b9", playlistId: "3zk5nCnmrdKE2doKlrXVTt", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da846a202717970f8ddbd17faf6a" },
  { id: "worldwide", name: "Worldwide FM", short: "WWF", genre: "Eclectic", color: "#16a085", playlistId: "070GmV0d5LCGPhlJRLKPxO", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84857b4680295ff270a247a520" },
  { id: "flylo", name: "FlyLo FM", short: "FLY", genre: "Experimental", color: "#d35400", playlistId: "6UIPSckAdkoRLMxYkQRFPU", image: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c4be71a09e6e7c7687992c29b" },
  { id: "lowdown", name: "The Low Down 91.1", short: "91.1", genre: "Classic soul", color: "#b8860b", playlistId: "4BHVFx2AXp2bXpaRe1KwEJ", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c32b18554bb54bb2db716b958" },
  { id: "mirror-park", name: "Radio Mirror Park", short: "RMP", genre: "Indie", color: "#1abc9c", playlistId: "6undnlVhPbAU5o6PL2fhwc", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84c5536ec993b0e76bad61f2ce" },
  { id: "space", name: "Space 103.2", short: "103.2", genre: "Funk", color: "#6c5ce7", playlistId: "4lP4j39cZZQneig4wlekbQ", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c6171e375fb8e5d40298d38d3" },
  { id: "vinewood", name: "Vinewood Boulevard Radio", short: "VBR", genre: "Garage rock", color: "#e67e22", playlistId: "5DPJUBMBHV10jNs3vPmiOR", image: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84a9a306f3c5bbc51d7886e98d" },
  { id: "still-slipping", name: "Still Slipping Los Santos", short: "SSL", genre: "Underground", color: "#7f8c8d", playlistId: "0L5ooIRUfpGE75W3DsaoqS", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84b06ef4fbed8f7d409e4904b5" },
  { id: "motomami", name: "MOTOMAMI Los Santos", short: "MOTO", genre: "Latin / pop", color: "#ff3f6c", playlistId: "6VGEAEUNGq9jJZl5A3NsjZ", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c860ac28f614c7b67ba9622fb" },
  { id: "ifruit", name: "iFruit Radio", short: "iFR", genre: "Hip-hop / R&B", color: "#e74c3c", playlistId: "3WBZcZ9qV7vyht2H1RcOEJ", image: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84a28a283f9bb67cd8a4b71188" },
];

/** Accepts a Spotify playlist URL, URI, or bare id; returns the id or null. */
export function parsePlaylistId(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]{22})/) ??
    s.match(/^spotify:playlist:([A-Za-z0-9]{22})$/) ??
    s.match(/^([A-Za-z0-9]{22})$/);
  return m ? m[1] : null;
}
