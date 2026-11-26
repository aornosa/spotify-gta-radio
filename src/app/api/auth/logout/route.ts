import { NextResponse, type NextRequest } from "next/server";
import { clearTokens } from "@/lib/spotify/server";

export async function POST(req: NextRequest) {
  await clearTokens();
  return NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
}
