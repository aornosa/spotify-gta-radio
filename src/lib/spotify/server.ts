import "server-only";
import { cookies } from "next/headers";

// The Web Playback SDK requires streaming + user-read-email + user-read-private.
export const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
].join(" ");

export const COOKIE = {
  access: "sp_access",
  refresh: "sp_refresh",
  expires: "sp_expires",
  scope: "sp_scope",
  state: "sp_oauth_state",
} as const;

export function env() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  return { clientId, clientSecret };
}

/**
 * OAuth redirect URI: SPOTIFY_REDIRECT_URI if set, otherwise this site's own callback URL.
 * Whatever it resolves to must be registered in the Spotify developer dashboard.
 */
export function redirectUriFor(origin: string) {
  return process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/auth/callback`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** True if a granted scope string covers everything the app currently asks for. */
export function hasAllScopes(granted: string | undefined) {
  if (!granted) return false;
  const have = new Set(granted.split(/\s+/));
  return SCOPES.split(" ").every((s) => have.has(s));
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = env();
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token error ${res.status}: ${await res.text()}`);
  return res.json();
}

export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
}

export function refreshAccessToken(refreshToken: string) {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

/** Secure cookies everywhere except a local http:// run (e.g. the start-windows.bat launcher). */
export const secureCookies =
  process.env.NODE_ENV === "production" && !process.env.SPOTIFY_REDIRECT_URI?.startsWith("http://");
const secure = secureCookies;
const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };

/** Persist tokens in httpOnly cookies. Must be called from a Route Handler. */
export async function saveTokens(t: TokenResponse) {
  const store = await cookies();
  const expiresAt = Date.now() + t.expires_in * 1000;
  store.set(COOKIE.access, t.access_token, { ...base, maxAge: t.expires_in });
  store.set(COOKIE.expires, String(expiresAt), { ...base, maxAge: t.expires_in });
  if (t.refresh_token) {
    store.set(COOKIE.refresh, t.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 365 });
  }
  if (t.scope) store.set(COOKIE.scope, t.scope, { ...base, maxAge: 60 * 60 * 24 * 365 });
  return { accessToken: t.access_token, expiresAt };
}

export async function clearTokens() {
  const store = await cookies();
  for (const name of Object.values(COOKIE)) store.delete(name);
}
