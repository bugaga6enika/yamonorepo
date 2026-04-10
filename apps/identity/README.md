# Identity Server

This workspace adds a NestJS-based identity server to the Turborepo.

## Features

- local login with `login` + `password`
- OAuth 2.0 authorization code, refresh token, and client credentials flows
- OpenID Connect ID token support through `oidc-provider`
- PostgreSQL persistence with Prisma

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and pgAdmin:

```sh
docker compose up -d
```

pgAdmin will be available at `http://localhost:5050` using the `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` values from `.env`.

Use these connection settings inside pgAdmin when registering the server:

- Host: `postgres`
- Port: `5432`
- Database: `identity`
- Username: `postgres`
- Password: `postgres`

3. Install dependencies from the monorepo root:

```sh
npm install
```

4. Generate Prisma client and apply the first migration:

```sh
npm run prisma:generate --workspace=@repo/identity
npm run prisma:migrate --workspace=@repo/identity -- --name init
```

5. Seed the first user:

```sh
npm run prisma:seed --workspace=@repo/identity
```

6. Start the identity server:

```sh
npm run dev --workspace=@repo/identity
```

## Useful endpoints

- `GET /health`
- `POST /auth/login`
- `GET /oidc/.well-known/openid-configuration`
- `GET /oidc/auth`
- `POST /oidc/token`

## Example authorization request

```txt
http://localhost:3001/oidc/auth?client_id=web-client&redirect_uri=http://localhost:3000/api/auth/callback&response_type=code&scope=openid%20profile%20email&code_challenge=replace-me&code_challenge_method=S256
```
