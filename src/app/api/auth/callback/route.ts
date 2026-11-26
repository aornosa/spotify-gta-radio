import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, exchangeCode, redirectUriFor, saveTokens } from "@/lib/spotify/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const home = new URL("/", req.nextUrl.origin);
  const store = await cookies();
  const expectedState = store.get(COOKIE.state)?.value;
  store.delete(COOKIE.state);

  const error = params.get("error");
  const code = params.get("code");
  if (error || !code || !expectedState || params.get("state") !== expectedState) {
    home.searchParams.set("auth_error", error ?? "invalid_state");
    return NextResponse.redirect(home);
  }

  try {
    const tokens = await exchangeCode(code, redirectUriFor(req.nextUrl.origin));
    // Development-mode Spotify apps only serve allowlisted users (max 5 per app). Anyone else
    // can complete the login, but every API call returns 403, so check once and explain.
    const me = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (me.status === 403) return NextResponse.redirect(new URL("/full", req.nextUrl.origin));
    await saveTokens(tokens);
  } catch (e) {
    console.error(e);
    home.searchParams.set("auth_error", "token_exchange_failed");
  }
  return NextResponse.redirect(home);
}
