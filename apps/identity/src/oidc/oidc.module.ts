import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import { OidcInteractionController } from "./oidc-interaction.controller.js";
import { OidcService } from "./oidc.service.js";

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [OidcInteractionController],
  providers: [OidcService],
  exports: [OidcService]
})
export class OidcModule {}
