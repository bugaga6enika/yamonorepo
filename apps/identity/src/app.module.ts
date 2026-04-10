import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { AppConfigService } from "./config/app-config.service.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { OidcModule } from "./oidc/oidc.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"]
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    OidcModule,
    HealthModule
  ],
  providers: [AppConfigService]
})
export class AppModule {}
