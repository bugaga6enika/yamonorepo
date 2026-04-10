import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearCookie,
  decodeIdTokenClaims,
  encodeSessionCookie,
  getDiscoveryDocument,
  getClientConfig,
  parsePkceTransactionCookie
} from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription ?? "")}`, url)
    );
  }

  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get("oidc_pkce")?.value;

  if (!code || !state || !pkceCookie) {
    return NextResponse.redirect(new URL("/?error=missing_callback_state", url));
  }

  const transaction = parsePkceTransactionCookie(pkceCookie);

  if (!transaction || transaction.state !== state) {
    return NextResponse.redirect(new URL("/?error=invalid_pkce_state", url));
  }

  const client = getClientConfig();
  const discovery = await getDiscoveryDocument();

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: client.redirectUri,
      code,
      code_verifier: transaction.codeVerifier
    }).toString(),
    cache: "no-store"
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    return NextResponse.redirect(new URL(`/?error=token_exchange_failed&details=${encodeURIComponent(details)}`, url));
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
  };

  const claims = decodeIdTokenClaims(tokens.id_token);

  const response = NextResponse.redirect(new URL("/", url));
  response.cookies.set({
    name: "app_session",
    value: encodeSessionCookie({
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      user: {
        sub: claims.sub,
        email: claims.email,
        name: claims.name,
        preferred_username: claims.preferred_username
      }
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: tokens.expires_in
  });
  response.cookies.set(clearCookie("oidc_pkce"));

  return response;
}
