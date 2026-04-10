# Web Client

This Next.js app completes the OAuth 2.0 authorization code flow with PKCE against the monorepo identity server.

## Setup

1. Copy `.env.example` to `.env.local`
2. Start the identity server
3. Run:

```sh
npm install
npm run dev --workspace=@repo/web-client
```

## Flow

- `GET /api/auth/login` creates a PKCE verifier/challenge pair and redirects to the identity server
- `GET /api/auth/callback` exchanges the authorization code for tokens
- the app stores access token, refresh token, ID token, and decoded user claims in an HTTP-only signed cookie
- `GET /api/protected/userinfo` refreshes the session when necessary and calls the OIDC `userinfo` endpoint with the bearer access token
- `POST /api/protected/refresh` explicitly refreshes the session cookie and redirects back to `/profile`
- `GET /profile` renders that protected response in a frontend page instead of raw JSON
