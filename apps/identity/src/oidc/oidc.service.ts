import { Injectable } from "@nestjs/common";
import Provider, { type Configuration } from "oidc-provider";
import { AppConfigService } from "../config/app-config.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { UsersService } from "../users/users.service.js";
import { OidcAdapter } from "./oidc-adapter.js";

@Injectable()
export class OidcService {
  private readonly provider: Provider;

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {
    const accountUsersService = this.usersService;

    const oidcConfig: Configuration = {
      adapter: (modelName: string) => new OidcAdapter(modelName, this.prisma),
      clients: this.config.clients.map((client) => ({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        grant_types: ["authorization_code", "refresh_token", "client_credentials"],
        redirect_uris: client.redirectUris,
        response_types: ["code"],
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
        scope: "openid profile email offline_access"
      })),
      claims: {
        openid: ["sub"],
        email: ["email", "email_verified"],
        profile: ["name", "preferred_username"]
      },
      cookies: {
        keys: this.config.cookieKeys
      },
      features: {
        devInteractions: { enabled: false },
        introspection: { enabled: true },
        revocation: { enabled: true },
        clientCredentials: { enabled: true },
        resourceIndicators: { enabled: false },
        pkce: {
          required: () => true,
          methods: ["S256"]
        }
      },
      interactions: {
        url(_ctx: unknown, interaction: { uid: string }) {
          return `/interaction/${interaction.uid}`;
        }
      },
      findAccount: async (_ctx: unknown, sub: string) => {
        const user = await accountUsersService.findById(sub);

        if (!user) {
          return undefined;
        }

          return {
            accountId: user.id,
            async claims(_use: unknown, scope: string) {
              return {
                sub: user.id,
                email: scope.includes("email") ? user.email : undefined,
              email_verified: scope.includes("email") ? true : undefined,
              name: scope.includes("profile") ? user.displayName : undefined,
              preferred_username: scope.includes("profile") ? user.login : undefined
            };
          }
        };
      },
      ttl: {
        AccessToken: 60 * 60,
        AuthorizationCode: 10 * 60,
        ClientCredentials: 10 * 60,
        IdToken: 60 * 60,
        Interaction: 60 * 60,
        RefreshToken: 14 * 24 * 60 * 60,
        Session: 24 * 60 * 60
      }
    };

    this.provider = new Provider(this.config.issuerUrl, oidcConfig);
  }

  callback() {
    return this.provider.callback();
  }

  getProvider() {
    return this.provider;
  }
}
