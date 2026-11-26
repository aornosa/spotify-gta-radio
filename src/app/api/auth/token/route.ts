import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, clearTokens, refreshAccessToken, saveTokens } from "@/lib/spotify/server";

/**
 * Returns a valid access token for the browser (Web Playback SDK + Web API), refreshing
 * if needed. `?force=1` refreshes even if the current token looks valid (after a 401).
 */
export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.has("force");
  const store = await cookies();
  const access = store.get(COOKIE.access)?.value;
  const expiresAt = Number(store.get(COOKIE.expires)?.value ?? 0);
  const refresh = store.get(COOKIE.refresh)?.value;

  if (!force && access && expiresAt - Date.now() > 60_000) {
    return NextResponse.json({ accessToken: access, expiresAt });
  }
  if (!refresh) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  try {
    return NextResponse.json(await saveTokens(await refreshAccessToken(refresh)));
  } catch (e) {
    console.error(e);
    await clearTokens();
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
  }
}
