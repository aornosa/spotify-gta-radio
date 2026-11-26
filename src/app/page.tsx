import { cookies } from "next/headers";
import { Suspense } from "react";
import { Radio } from "@/components/Radio";
import { COOKIE } from "@/lib/spotify/server";

const AUTH_ERRORS: Record<string, string> = {
  access_denied: "You cancelled the Spotify login.",
  invalid_state: "The login link expired. Please try again.",
  token_exchange_failed: "Spotify rejected the login. Check the app's client ID, secret and redirect URI.",
};

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#07080a]" />}>
      <Gate {...props} />
    </Suspense>
  );
}

async function Gate({ searchParams }: PageProps<"/">) {
  const loggedIn = (await cookies()).has(COOKIE.refresh);
  if (loggedIn) return <Radio />;

  const { auth_error } = await searchParams;
  const error = typeof auth_error === "string" ? (AUTH_ERRORS[auth_error] ?? `Login failed (${auth_error}).`) : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_100%,#f97316_0%,#be185d_35%,#1e1b4b_70%,#07080a_100%)] opacity-70" />
      <h1 className="font-display text-6xl uppercase leading-none tracking-wide sm:text-8xl [text-shadow:0_4px_0_#000]">
        Los Santos
        <br />
        Radio
      </h1>
      <p className="max-w-md text-lg text-white/80">
        Your car radio, powered by Spotify. Flip between the stations from the official Rockstar Games
        playlists, or add your own. Every station keeps playing while you&apos;re tuned away.
      </p>
      <a
        href="/api/auth/login"
        className="rounded-full bg-[#1ed760] px-8 py-3 text-lg font-bold text-black shadow-lg transition-transform hover:scale-105"
      >
        Log in with Spotify
      </a>
      {error && <p className="rounded-lg bg-black/50 px-4 py-2 text-sm text-red-200">{error}</p>}
      <p className="max-w-sm text-xs text-white/50">
        Requires Spotify Premium. Fan project, not affiliated with Rockstar Games or Spotify.
      </p>
      <a href="/guide" className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
        Can&apos;t log in? Run your own copy in 5 minutes →
      </a>
    </main>
  );
}
