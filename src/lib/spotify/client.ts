"use client";

export class SpotifyError extends Error {
  constructor(public status: number, public reason: string | undefined, message: string) {
    super(message);
  }
}

export class NotAuthenticatedError extends Error {}

let cached: { accessToken: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export async function getAccessToken(force = false): Promise<string> {
  if (!force && cached && cached.expiresAt - Date.now() > 60_000) return cached.accessToken;
  inflight ??= (async () => {
    try {
      const res = await fetch(force ? "/api/auth/token?force=1" : "/api/auth/token", {
        cache: "no-store",
      });
      if (res.status === 401) {
        // Session gone or outdated (cookies were cleared server-side): back to the login screen.
        if (typeof window !== "undefined" && window.location.pathname === "/") {
          const last = Number(sessionStorage.getItem("gta-radio:reloaded-at") ?? 0);
          if (Date.now() - last > 30_000) {
            sessionStorage.setItem("gta-radio:reloaded-at", String(Date.now()));
            window.location.reload();
          }
        }
        throw new NotAuthenticatedError("Not logged in");
      }
      if (!res.ok) throw new Error(`Token endpoint failed: ${res.status}`);
      cached = await res.json();
      return cached!.accessToken;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Spotify Web API call with token injection, one refresh-and-retry on 401, and 429 backoff. */
export async function spotify<T = unknown>(
  path: string,
  init: RequestInit & { query?: Record<string, string | undefined> } = {},
): Promise<T | null> {
  const url = new URL(path.startsWith("http") ? path : `https://api.spotify.com/v1${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined) url.searchParams.set(k, v);

  let refreshed = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const token = await getAccessToken(refreshed && attempt > 0);
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (res.status === 401 && !refreshed) {
      refreshed = true;
      continue;
    }
    if (res.status === 429) {
      // Dev-mode quota is per developer account; retrying won't help until it resets.
      const peek = await res.clone().text();
      if (peek.includes("QUOTA_EXCEEDED")) {
        throw new SpotifyError(429, "QUOTA_EXCEEDED", "Spotify API quota for this app is used up");
      }
      await sleep(Math.min(10, Number(res.headers.get("Retry-After") ?? 1)) * 1000);
      continue;
    }
    if (res.status === 204 || res.status === 202) return null;
    const text = await res.text();
    const body = text ? safeJson(text) : null;
    if (!res.ok) {
      const err = (body as { error?: { message?: string; reason?: string } } | null)?.error;
      throw new SpotifyError(res.status, err?.reason, err?.message ?? (text || res.statusText));
    }
    return body as T;
  }
  throw new SpotifyError(429, "RATE_LIMITED", "Spotify rate limit — try again in a moment");
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Human-readable explanation for common playback failures. */
export function describeError(e: unknown): string {
  if (e instanceof NotAuthenticatedError) return "Your Spotify session expired. Log in again.";
  if (e instanceof SpotifyError) {
    if (e.reason === "QUOTA_EXCEEDED")
      return "This app has used up its Spotify API quota for now. Try again later.";
    if (e.reason === "PREMIUM_REQUIRED") return "Spotify Premium is required to control playback.";
    if (e.reason === "NO_ACTIVE_DEVICE" || e.status === 404)
      return "No active Spotify device. Open Spotify on a device, or switch to in-browser mode.";
    if (e.status === 403 && /registered|developer dashboard/i.test(e.message))
      return "This Spotify account isn't on the app's allowlist yet (Spotify developer dashboard → User Management).";
    return `Spotify error ${e.status}: ${e.message}`;
  }
  return e instanceof Error ? e.message : String(e);
}
