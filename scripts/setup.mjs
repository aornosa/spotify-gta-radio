// One-time local setup: asks for your Spotify app's Client ID and Secret, checks them
// with Spotify, and writes .env.local. Run with: npm run setup
import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const REDIRECT_URI = "http://127.0.0.1:3000/api/auth/callback";
const rl = createInterface({ input, output });

console.log(`
Los Santos Radio: local setup
-----------------------------
1. Open https://developer.spotify.com/dashboard and click "Create app".
2. Fill in any name/description. As Redirect URI, add exactly:
     ${REDIRECT_URI}
3. Tick "Web API" and "Web Playback SDK", accept the terms, and save.
4. Open the app's Settings and copy the Client ID and Client Secret.
`);

if (existsSync(".env.local")) {
  const answer = (await rl.question(".env.local already exists. Overwrite it? (y/N) ")).trim().toLowerCase();
  if (answer !== "y") {
    console.log("Keeping your existing settings.");
    rl.close();
    process.exit(0);
  }
}

const isKey = (s) => /^[0-9a-f]{32}$/i.test(s);
let clientId = "";
let clientSecret = "";
for (;;) {
  clientId = (await rl.question("Client ID: ")).trim();
  clientSecret = (await rl.question("Client Secret: ")).trim();
  if (!isKey(clientId) || !isKey(clientSecret)) {
    console.log("Those don't look right (each should be 32 letters/numbers). Try again.\n");
    continue;
  }
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  }).catch(() => null);
  if (res?.ok) break;
  console.log(
    res ? "Spotify rejected those keys. Double-check them and try again.\n" : "Couldn't reach Spotify. Check your internet connection.\n",
  );
}
rl.close();

writeFileSync(
  ".env.local",
  `# Created by npm run setup. Keep this file private.
SPOTIFY_CLIENT_ID=${clientId}
SPOTIFY_CLIENT_SECRET=${clientSecret}
SPOTIFY_REDIRECT_URI=${REDIRECT_URI}
`,
);
console.log("\nSaved. Your keys stay on this computer in .env.local.\n");
