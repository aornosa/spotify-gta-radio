import { NextResponse, type NextRequest } from "next/server";
import { clearTokens } from "@/lib/spotify/server";

export async function POST(req: NextRequest) {
  // Only accept logout from this site's own pages (blocks cross-site forms logging people out).
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return new NextResponse("Forbidden", { status: 403 });
  await clearTokens();
  return NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
}
