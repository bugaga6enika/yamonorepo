import { Injectable } from "@nestjs/common";

type OidcClientConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: "client_secret_post" | "none";
};

@Injectable()
export class AppConfigService {
  readonly port = Number(process.env.PORT ?? 3001);
  readonly databaseUrl = this.require("DATABASE_URL");
  readonly issuerUrl = this.require("OIDC_ISSUER_URL");
  readonly cookieKeys = this.require("OIDC_COOKIE_KEYS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  readonly clients: OidcClientConfig[] = [
    {
      clientId: this.require("OIDC_CLIENT_WEB_ID"),
      clientSecret: this.require("OIDC_CLIENT_WEB_SECRET"),
      redirectUris: [this.require("OIDC_CLIENT_WEB_REDIRECT_URI")],
      tokenEndpointAuthMethod: "client_secret_post"
    },
    {
      clientId: this.require("OIDC_CLIENT_SWAGGER_ID"),
      clientSecret: this.require("OIDC_CLIENT_SWAGGER_SECRET"),
      redirectUris: [this.require("OIDC_CLIENT_SWAGGER_REDIRECT_URI")],
      tokenEndpointAuthMethod: "client_secret_post"
    }
  ];

  constructor() {
    if (this.cookieKeys.length < 2) {
      throw new Error("OIDC_COOKIE_KEYS must provide at least two comma-separated secrets.");
    }
  }

  private require(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  }
}
