import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, exchangeCode, saveTokens } from "@/lib/spotify/server";

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
    await saveTokens(await exchangeCode(code));
  } catch (e) {
    console.error(e);
    home.searchParams.set("auth_error", "token_exchange_failed");
  }
  return NextResponse.redirect(home);
}
