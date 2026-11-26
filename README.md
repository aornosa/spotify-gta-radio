# Los Santos Radio

A GTA V-style car radio for Spotify. Flip between the stations using the **official playlists published by Rockstar Games on Spotify**, or add any playlist as your own station.

- **Radio wheel:** tap `Q` / `Tab` for the next station; hold it to open the wheel and turn the dial with the mouse, scroll wheel or `←` / `→` (release to tune).
- **Live stations:** each station starts at a random song and keeps "playing" while you're tuned away, so coming back drops you mid-song, like in the game.
- **Play anywhere:** audio in the browser tab, or on any of your Spotify devices (phone, desktop app, speakers).
- **Custom stations:** paste any Spotify playlist link.

> Fan project, not affiliated with Rockstar Games or Spotify. Non-commercial.

---

## Who can use the hosted site?

Spotify's rules for hobby apps limit who can use any single copy of this radio:

| Limit | Value | Notes |
| --- | --- | --- |
| **Users per app** | **5** | Only Spotify accounts the app owner adds by hand (dashboard → *User Management*). Unchanged by the July 2026 update. |
| **Apps per developer account** | **25** | Raised from 1 to 25 in July 2026. This is how many separate apps one developer can create, not how many people can use one. |
| **Spotify Premium** | Required | For the app owner and for every listener (Spotify only allows playback control with Premium). |
| **API quota** | Shared | Counted per developer account across all its apps. |

Getting past the 5-user limit requires Spotify's "extended quota", which Spotify only grants to registered organizations with a large existing user base. A fan project can't get it.

**What happens when the hosted site is full:** if your Spotify account isn't one of the 5 the owner added, Spotify still lets you through the login, but then rejects every request. The site detects this right after login and shows a **"This radio is full"** screen pointing you to the setup guide below. Nothing on your Spotify account is changed.

The owner has to add and remove listeners by hand. Spotify offers no way for an app to manage its user list automatically, so inactive users can't be removed on a schedule.

Sources: [Spotify quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [February 2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [July 2026 changelog](https://developer.spotify.com/documentation/web-api/references/changes/july-2026).

---

## Run your own copy (about 5 minutes, free)

Running your own copy makes you the owner of your own Spotify app, so the 5-user limit doesn't get in your way. Your keys stay on your computer. The same steps are on the site, step by step, at **`/guide`**.

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

Built with Next.js, TypeScript and Tailwind CSS, using the Spotify Web API and Web Playback SDK.

`scripts/fetch-rockstar-playlists.mjs` lists the official playlists on the Rockstar Games Spotify account. Spotify no longer lets apps read the songs of playlists they don't own, so stations remember upcoming songs from the player's queue instead.

---

<sub>**PSA:** AI tools were used in making this project, mainly for the frontend UI/UX and for security auditing.</sub>
