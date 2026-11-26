import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, SCOPES, env } from "@/lib/spotify/server";

export async function GET() {
  const { clientId, redirectUri } = env();
  const state = randomBytes(16).toString("hex");
  (await cookies()).set(COOKIE.state, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  }).toString();
  return NextResponse.redirect(url);
}
