# Los Santos Radio

> **Fan project. Not affiliated with, endorsed by, or connected to Rockstar Games or Spotify.** Non-commercial.

A GTA V-style car radio for Spotify. Flip between the stations using the **official playlists published by Rockstar Games on Spotify**, or turn any Spotify playlist into your own station.

**Requires Spotify Premium.** Run it on your own computer or deploy your own copy; see [Run your own copy](#run-your-own-copy-about-5-minutes-free).

---

## Features

| | |
| --- | --- |
| **Radio wheel** | Tap `Q` / `Tab` for the next station. Hold it to open the wheel, aim with the mouse or scroll wheel, and release to tune. |
| **Live stations** | Each station starts at a random song and keeps "playing" while you're tuned away, so coming back drops you mid-song, like in the game. |
| **Play anywhere** | Audio in the browser tab, or on any of your Spotify devices (phone, desktop app, speakers). |
| **Custom stations** | Add any Spotify playlist to the wheel. See below. |

## <img src="docs/icons/stations.svg" width="22" height="22" alt=""> Custom stations

Add your own playlists to the wheel, next to the Rockstar stations.

1. Click the **Manage stations** button <img src="docs/icons/stations.svg" width="16" height="16" alt="Stations icon"> at the bottom right of the player.
2. Paste a Spotify playlist link (in Spotify: **⋯** → **Share** → **Copy link to playlist**).
3. Click **Add**. The station appears on the wheel with the playlist's cover.

From the same panel you can **delete** your custom stations, **hide** default stations you don't want, and **restore** hidden ones. Custom stations are saved in your browser.

## <img src="docs/icons/spotify-device.svg" width="22" height="22" alt=""> Choosing where it plays

Click the **Audio output** button at the bottom right of the player. Its icon shows where audio is going:

| Icon | Option | What it does |
| :---: | --- | --- |
| <img src="docs/icons/this-browser.svg" width="20" height="20" alt="Laptop icon"> | **This browser** | Plays right in the tab. |
| <img src="docs/icons/spotify-device.svg" width="20" height="20" alt="Speaker icon"> | **Spotify device** | Plays on your phone, desktop app or speaker. Open Spotify on that device first, then press refresh in the menu if it isn't listed. |

---

## Spotify's user limits

Spotify's rules for hobby apps limit who can use any single deployed copy of this radio:

| Limit | Value | Notes |
| --- | --- | --- |
| **Users per app** | **5** | Only Spotify accounts the app owner adds by hand (dashboard → *User Management*). Unchanged by the July 2026 update. |
| **Apps per developer account** | **25** | Raised from 1 to 25 in July 2026. This is how many separate apps one developer can create, not how many people can use one. |
| **Spotify Premium** | Required | For the app owner and for every listener. Spotify only allows playback control with Premium. |
| **API quota** | Shared | Counted per developer account across all its apps. |

Getting past the 5-user limit requires Spotify's "extended quota", which Spotify only grants to registered organizations with a large existing user base. A fan project can't get it.

**When a copy is full:** if your Spotify account isn't one of the 5 the owner added, Spotify still lets you through the login but rejects every request afterwards. The app detects this right after login and shows a **"This radio is full"** screen pointing you to the setup guide below. Nothing on your Spotify account is changed.

The owner adds and removes listeners by hand. Spotify offers no way for an app to manage its user list automatically, so inactive users can't be removed on a schedule.

> **Sources:** [Spotify quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) · [February 2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) · [July 2026 changelog](https://developer.spotify.com/documentation/web-api/references/changes/july-2026)

---

## Run your own copy (about 5 minutes, free)

Running your own copy makes you the owner of your own Spotify app, so the 5-user limit doesn't get in your way. Your keys stay on your computer. The same steps are built into the app at **`/guide`**.

### 1. Create a Spotify app key

1. Go to <https://developer.spotify.com/dashboard> and click **Create app**.
2. Use any name and description.
3. Under **Redirect URIs** add exactly `http://127.0.0.1:3000/api/auth/callback` (Spotify rejects `localhost`).
4. Tick **Web API** and **Web Playback SDK**, accept the terms, and save.
5. In the app's **Settings**, note the **Client ID** and **Client Secret**.

### 2. Download and start

1. Install [Node.js](https://nodejs.org/en/download) (LTS).
2. Download this repository: green **Code** button → **Download ZIP**, then unzip it.
3. Start it:
   - **Windows:** double-click `start-windows.bat`.
   - **macOS / Linux:** run `sh start-mac-linux.sh` in the folder.

The first run installs everything, asks for your Client ID and Secret (and checks them with Spotify), builds the app and opens <http://127.0.0.1:3000>. After that, the same file starts it straight away. The server only accepts connections from your own computer.

### Deploy your own on Vercel (optional)

1. Fork this repository and import it at <https://vercel.com/new>.
2. Add the environment variables `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.
3. After the first deploy, add `https://<your-project>.vercel.app/api/auth/callback` as a Redirect URI on your Spotify app.
4. Add up to 5 friends under **User Management** in your Spotify app.

`SPOTIFY_REDIRECT_URI` is optional on Vercel: the site uses its own `/api/auth/callback` address.

---

## Development

```sh
npm install
npm run setup     # writes .env.local (or copy .env.example)
npm run dev -- -H 127.0.0.1
npm test          # broadcast-clock unit tests
npm run lint
```

Built with Next.js, TypeScript and Tailwind CSS, using the Spotify Web API and Web Playback SDK. Icons from [Lucide](https://lucide.dev) (ISC license).

`scripts/fetch-rockstar-playlists.mjs` lists the official playlists on the Rockstar Games Spotify account. Spotify no longer lets apps read the songs of playlists they don't own, so stations remember upcoming songs from the player's queue instead.

---

<sub>**PSA:** AI tools were used in making this project, mainly for the frontend UI/UX and for security auditing.</sub>
