import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, connection, type NextRequest } from "next/server";
import { COOKIE, SCOPES, env, redirectUriFor } from "@/lib/spotify/server";

export async function GET(req: NextRequest) {
  await connection(); // per-request: never prerender (state must be unique)
  const { clientId } = env();
  const redirectUri = redirectUriFor(req.nextUrl.origin);
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
