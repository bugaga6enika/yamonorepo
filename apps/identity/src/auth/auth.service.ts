import { Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service.js";

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateCredentials(login: string, password: string) {
    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      displayName: user.displayName
    };
  }
}
