import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Run your own Los Santos Radio",
  description: "Set up Los Santos Radio on your own computer or your own Vercel account in a few minutes.",
};

const REPO = "https://github.com/aornosa/spotify-gta-radio";
const LOCAL_REDIRECT = "http://127.0.0.1:3000/api/auth/callback";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 leading-relaxed text-white/85">
      <Link href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to the radio
      </Link>
      <h1 className="mt-6 font-display text-5xl uppercase tracking-wide text-white">Run your own radio</h1>
      <p className="mt-4">
        Spotify only lets a handful of people use any single hobby app, so the easiest way for everyone to listen is to
        run their own copy. It takes about 5 minutes, it&apos;s free, and your Spotify keys never leave your computer.
      </p>

      <Callout>
        <strong>You need:</strong> a <strong>Spotify Premium</strong> account (Spotify requires it for playback
        control) and a Windows, Mac or Linux computer.
      </Callout>

      <Step n={1} title="Create your Spotify app key">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Go to{" "}
            <A href="https://developer.spotify.com/dashboard">developer.spotify.com/dashboard</A>, log in with your
            Spotify account and click <b>Create app</b>.
          </li>
          <li>Give it any name and description (for example “My Radio”).</li>
          <li>
            Under <b>Redirect URIs</b>, add exactly: <Code>{LOCAL_REDIRECT}</Code>
            <br />
            <span className="text-sm text-white/55">
              It must say <b>127.0.0.1</b>, not “localhost”, or Spotify will reject it.
            </span>
          </li>
          <li>
            Tick <b>Web API</b> and <b>Web Playback SDK</b>, accept the terms, and click <b>Save</b>.
          </li>
          <li>
            Open the app&apos;s <b>Settings</b>. You&apos;ll need the <b>Client ID</b> and <b>Client Secret</b> (click
            “View client secret”) in step 3.
          </li>
        </ol>
      </Step>

      <Step n={2} title="Download the radio">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Install <A href="https://nodejs.org/en/download">Node.js</A> (choose the <b>LTS</b> version, default options
            are fine).
          </li>
          <li>
            Open the <A href={REPO}>project on GitHub</A>, click the green <b>Code</b> button, then{" "}
            <b>Download ZIP</b>.
          </li>
          <li>Unzip it anywhere, for example your Desktop.</li>
        </ol>
      </Step>

      <Step n={3} title="Start it">
        <ul className="space-y-3">
          <li>
            <b>Windows:</b> double-click <Code>start-windows.bat</Code> in the unzipped folder.
            <span className="block text-sm text-white/55">
              If Windows shows “Windows protected your PC”, click <i>More info</i> → <i>Run anyway</i>.
            </span>
          </li>
          <li>
            <b>Mac / Linux:</b> open Terminal in the folder and run <Code>sh start-mac-linux.sh</Code>
          </li>
        </ul>
        <p className="mt-3">
          The first time, it installs what it needs and asks for the <b>Client ID</b> and <b>Client Secret</b> from step
          1 (paste them and press Enter). Then your browser opens{" "}
          <Code>http://127.0.0.1:3000</Code>. Log in with Spotify and pick a station.
        </p>
        <p className="mt-3 text-sm text-white/55">
          Next time, just run the same file again. Close its window to stop the radio.
        </p>
      </Step>

      <Step n={4} title="Optional: put it online for your friends">
        <p>
          Prefer a link you can open from your phone? Deploy your own copy for free on Vercel:
        </p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            Fork the <A href={REPO}>GitHub project</A>, then on <A href="https://vercel.com/new">vercel.com/new</A>{" "}
            import your fork.
          </li>
          <li>
            Before deploying, add the environment variables <Code>SPOTIFY_CLIENT_ID</Code> and{" "}
            <Code>SPOTIFY_CLIENT_SECRET</Code> with your keys.
          </li>
          <li>
            After it deploys, add <Code>https://&lt;your-site&gt;.vercel.app/api/auth/callback</Code> as a Redirect
            URI on your Spotify app.
          </li>
          <li>
            To let friends log in, add their Spotify email under <b>User Management</b> in your Spotify app (up to 5
            people, each needs Premium).
          </li>
        </ol>
      </Step>

      <h2 className="mt-12 font-display text-2xl uppercase tracking-wide text-white">Troubleshooting</h2>
      <dl className="mt-4 space-y-4">
        <Faq q="“INVALID_CLIENT: Invalid redirect URI” when logging in">
          The Redirect URI on your Spotify app doesn&apos;t match. It must be exactly <Code>{LOCAL_REDIRECT}</Code>,
          and you must open the radio at <Code>http://127.0.0.1:3000</Code> (not localhost).
        </Faq>
        <Faq q="“Spotify Premium is required”">
          Playback control only works with Premium, both for the app owner and for whoever is listening.
        </Faq>
        <Faq q="No sound in the browser">
          Click anywhere on the page first (browsers block audio until you interact), or switch the output to one of your
          Spotify devices with the speaker button at the bottom.
        </Faq>
        <Faq q="I typed the wrong keys">
          Delete the <Code>.env.local</Code> file in the folder (or run <Code>npm run setup</Code>) and start again.
        </Faq>
      </dl>

      <p className="mt-12 text-xs text-white/40">
        Fan project, not affiliated with Rockstar Games or Spotify. Station playlists are the official public playlists
        published by Rockstar Games on Spotify.
      </p>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-3 font-display text-2xl uppercase tracking-wide text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-black">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3 text-sm">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-white">{children}</code>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-emerald-300 underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-white">{q}</dt>
      <dd className="mt-1 text-white/70">{children}</dd>
    </div>
  );
}
