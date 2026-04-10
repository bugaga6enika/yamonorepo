import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

type Session = {
  expiresAt: number;
  scope: string;
  tokenType: string;
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  user: {
    sub: string;
    email?: string;
    name?: string;
    preferred_username?: string;
  };
};

type OidcDiscoveryDocument = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

type PkceTransaction = {
  codeVerifier: string;
  nonce: string;
  state: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(value: string) {
  const secret = requireEnv("AUTH_SESSION_SECRET");
  return createHmac("sha256", secret).update(value).digest();
}

function encodeSignedPayload(payload: object) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(sign(encodedPayload));
  return `${encodedPayload}.${signature}`;
}

function decodeSignedPayload<T>(value: string): T | null {
  const [encodedPayload, encodedSignature] = value.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const actualSignature = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as T;
}

export function getClientConfig() {
  const appUrl = requireEnv("APP_URL");

  return {
    appUrl,
    clientId: requireEnv("OIDC_CLIENT_ID"),
    clientSecret: requireEnv("OIDC_CLIENT_SECRET"),
    redirectUri: `${appUrl}/api/auth/callback`
  };
}

export function getOidcEndpoints() {
  const issuer = requireEnv("OIDC_ISSUER_URL");
  return {
    issuer,
    authorization: `${issuer}/auth`,
    token: `${issuer}/token`
  };
}

let discoveryDocumentPromise: Promise<OidcDiscoveryDocument> | null = null;

export async function getDiscoveryDocument() {
  if (!discoveryDocumentPromise) {
    const { issuer } = getOidcEndpoints();
    discoveryDocumentPromise = fetch(`${issuer}/.well-known/openid-configuration`, {
      cache: "no-store"
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load discovery document: ${response.status}`);
      }

      return (await response.json()) as OidcDiscoveryDocument;
    });
  }

  return discoveryDocumentPromise;
}

export function createPkceTransactionCookie() {
  const codeVerifier = toBase64Url(randomBytes(48));
  const codeChallenge = toBase64Url(createHash("sha256").update(codeVerifier).digest());
  const state = toBase64Url(randomBytes(24));
  const nonce = toBase64Url(randomBytes(24));

  return {
    codeChallenge,
    nonce,
    state,
    cookieValue: encodeSignedPayload({
      codeVerifier,
      nonce,
      state
    })
  };
}

export function parsePkceTransactionCookie(value: string) {
  return decodeSignedPayload<PkceTransaction>(value);
}

export function encodeSessionCookie(session: Session) {
  return encodeSignedPayload(session);
}

export async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("app_session")?.value;

  if (!rawSession) {
    return null;
  }

  const session = decodeSignedPayload<Session>(rawSession);

  if (!session || session.expiresAt <= Date.now()) {
    return null;
  }

  return session;
}

export function parseSessionCookie(value?: string | null) {
  if (!value) {
    return null;
  }

  const session = decodeSignedPayload<Session>(value);

  if (!session) {
    return null;
  }

  return session;
}

export function isSessionExpired(session: Session, skewMs = 30_000) {
  return session.expiresAt <= Date.now() + skewMs;
}

export async function refreshSession(session: Session) {
  if (!session.refreshToken) {
    throw new Error("No refresh token available.");
  }

  const discovery = await getDiscoveryDocument();
  const client = getClientConfig();

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: session.refreshToken
    }).toString(),
    cache: "no-store"
  });

  if (!tokenResponse.ok) {
    throw new Error(`Refresh token exchange failed with ${tokenResponse.status}.`);
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type: string;
  };

  const idToken = tokens.id_token ?? session.idToken;
  const claims = decodeIdTokenClaims(idToken);

  return {
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope ?? session.scope,
    tokenType: tokens.token_type,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    idToken,
    user: {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      preferred_username: claims.preferred_username
    }
  } satisfies Session;
}

export function clearCookie(name: string) {
  return {
    name,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: 0
  };
}

export function decodeIdTokenClaims(idToken: string) {
  const [, payload] = idToken.split(".");

  if (!payload) {
    throw new Error("Invalid ID token.");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session["user"];
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge
  };
}
