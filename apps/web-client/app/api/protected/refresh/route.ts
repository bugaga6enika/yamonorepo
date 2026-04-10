import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearCookie,
  encodeSessionCookie,
  parseSessionCookie,
  refreshSession,
  sessionCookieOptions
} from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("app_session")?.value;
  const session = parseSessionCookie(rawSession);
  const redirectUrl = new URL("/profile", request.url);

  if (!session) {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(clearCookie("app_session"));
    return response;
  }

  try {
    const refreshed = await refreshSession(session);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(
      "app_session",
      encodeSessionCookie(refreshed),
      sessionCookieOptions(Math.max(1, Math.floor((refreshed.expiresAt - Date.now()) / 1000)))
    );

    return response;
  } catch {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(clearCookie("app_session"));
    return response;
  }
}
