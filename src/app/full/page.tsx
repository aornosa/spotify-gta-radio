import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "This radio is full | Los Santos Radio",
  description: "This copy of Los Santos Radio has reached Spotify's user limit. Run your own copy for free.",
};

export default function FullPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_100%,#7c2d12_0%,#3b0764_45%,#07080a_80%)] opacity-70" />

      <div className="rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
        No signal
      </div>
      <h1 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-7xl [text-shadow:0_4px_0_#000]">
        This radio is full
      </h1>
      <p className="max-w-lg text-lg text-white/80">
        Spotify only lets <b>5 people</b> use a hobby app like this one, and the owner picks them by hand. Your
        account isn&apos;t one of them, so Spotify won&apos;t let this copy play for you. Nothing on your Spotify
        account was changed.
      </p>

      <div className="mt-2 w-full max-w-lg rounded-2xl border border-white/10 bg-black/50 p-6 text-left backdrop-blur">
        <h2 className="font-display text-2xl uppercase tracking-wide text-white">Get your own copy instead</h2>
        <p className="mt-2 text-sm text-white/70">
          Free, about 5 minutes, and it&apos;s all yours: no seat limits for you, and your keys stay on your computer.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-white/85">
          <li>
            <b>1.</b> Create a free Spotify app key (the guide walks you through it).
          </li>
          <li>
            <b>2.</b> Download the radio and double-click the start file.
          </li>
          <li>
            <b>3.</b> Paste your key once, then pick a station.
          </li>
        </ol>
        <Link
          href="/guide"
          className="mt-5 block rounded-full bg-[#1ed760] px-6 py-3 text-center font-bold text-black shadow-lg transition-transform hover:scale-[1.02]"
        >
          Show me how
        </Link>
      </div>

      <p className="max-w-md text-sm text-white/50">
        Know the person who runs this copy? Ask them to add your Spotify email under <i>User Management</i> in their
        Spotify developer dashboard, then{" "}
        <a href="/api/auth/login" className="text-white/80 underline underline-offset-2 hover:text-white">
          try logging in again
        </a>
        .
      </p>
      <Link href="/" className="text-sm text-white/40 hover:text-white">
        ← Back
      </Link>
    </main>
  );
}
