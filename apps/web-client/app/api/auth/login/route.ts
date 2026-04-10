import { NextResponse } from "next/server";
import { createPkceTransactionCookie, getClientConfig, getOidcEndpoints } from "@/lib/auth";

export async function GET() {
  const client = getClientConfig();
  const endpoints = getOidcEndpoints();
  const { cookieValue, codeChallenge, nonce, state } = createPkceTransactionCookie();

  const authorizationUrl = new URL(endpoints.authorization);
  authorizationUrl.searchParams.set("client_id", client.clientId);
  authorizationUrl.searchParams.set("redirect_uri", client.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid profile email offline_access");
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set({
    name: "oidc_pkce",
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 10 * 60
  });

  return response;
}
