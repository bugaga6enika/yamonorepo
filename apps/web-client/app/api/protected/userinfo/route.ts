import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearCookie,
  encodeSessionCookie,
  getDiscoveryDocument,
  isSessionExpired,
  parseSessionCookie,
  refreshSession,
  sessionCookieOptions
} from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("app_session")?.value;
  const parsedSession = parseSessionCookie(rawSession);

  if (!parsedSession) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let session = parsedSession;

  try {
    if (isSessionExpired(session)) {
      session = await refreshSession(session);
    }

    const discovery = await getDiscoveryDocument();

    if (!discovery.userinfo_endpoint) {
      return NextResponse.json(
        { error: "userinfo_endpoint_not_available" },
        { status: 501 }
      );
    }

    const upstream = await fetch(discovery.userinfo_endpoint, {
      headers: {
        authorization: `Bearer ${session.accessToken}`
      },
      cache: "no-store"
    });

    if (!upstream.ok) {
      if ((upstream.status === 401 || upstream.status === 403) && session.refreshToken) {
        session = await refreshSession(session);

        const retried = await fetch(discovery.userinfo_endpoint, {
          headers: {
            authorization: `Bearer ${session.accessToken}`
          },
          cache: "no-store"
        });

        if (!retried.ok) {
          const failedResponse = NextResponse.json(
            { error: "upstream_userinfo_failed", status: retried.status },
            { status: 502 }
          );
          failedResponse.cookies.set(clearCookie("app_session"));
          return failedResponse;
        }

        const payload = await retried.json();
        const response = NextResponse.json({ session: session.user, userinfo: payload });
        response.cookies.set(
          "app_session",
          encodeSessionCookie(session),
          sessionCookieOptions(Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000)))
        );
        return response;
      }

      return NextResponse.json(
        { error: "upstream_userinfo_failed", status: upstream.status },
        { status: 502 }
      );
    }

    const payload = await upstream.json();
    const response = NextResponse.json({ session: session.user, userinfo: payload });

    if (session !== parsedSession) {
      response.cookies.set(
        "app_session",
        encodeSessionCookie(session),
        sessionCookieOptions(Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000)))
      );
    }

    return response;
  } catch {
    const response = NextResponse.json({ error: "session_refresh_failed" }, { status: 401 });
    response.cookies.set(clearCookie("app_session"));
    return response;
  }
}
