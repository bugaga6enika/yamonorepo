import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "../auth/auth.service.js";
import { OidcService } from "./oidc.service.js";

@Controller("interaction")
export class OidcInteractionController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly authService: AuthService
  ) {}

  @Get(":uid")
  async details(@Param("uid") uid: string, @Req() request: Request, @Res() response: Response) {
    const provider = this.oidcService.getProvider();
    const details = await provider.interactionDetails(request, response);

    if (details.prompt.name === "login") {
      response.type("html").send(this.loginPage(uid, details.params.client_id?.toString() ?? "unknown"));
      return;
    }

    response.type("html").send(this.consentPage(uid, details.params.scope?.toString() ?? "openid"));
  }

  @Post(":uid/login")
  async login(
    @Body("login") login: string,
    @Body("password") password: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    const provider = this.oidcService.getProvider();
    const user = await this.authService.validateCredentials(login, password);

    const result = {
      login: {
        accountId: user.id
      }
    };

    await provider.interactionFinished(request, response, result, {
      mergeWithLastSubmission: false
    });
  }

  @Post(":uid/confirm")
  async confirm(@Req() request: Request, @Res() response: Response) {
    const provider = this.oidcService.getProvider();

    await provider.interactionFinished(
      request,
      response,
      {
        consent: {}
      },
      {
        mergeWithLastSubmission: true
      }
    );
  }

  private loginPage(uid: string, clientId: string) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Identity Login</title>
    <style>
      body { font-family: sans-serif; background: #f4f1ea; color: #1f2937; display: grid; min-height: 100vh; place-items: center; margin: 0; }
      main { width: min(420px, calc(100vw - 32px)); background: white; padding: 32px; border-radius: 20px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4b5563; }
      label { display: block; margin: 0 0 8px; font-weight: 600; }
      input { width: 100%; box-sizing: border-box; padding: 12px 14px; margin: 0 0 16px; border-radius: 12px; border: 1px solid #d1d5db; }
      button { width: 100%; padding: 12px 16px; border: 0; border-radius: 999px; background: #1d4ed8; color: white; font-weight: 700; cursor: pointer; }
    </style>
  </head>
  <body>
    <main>
      <h1>Sign in</h1>
      <p>Continue to <strong>${clientId}</strong> using your local identity account.</p>
      <form method="post" action="/interaction/${uid}/login">
        <label for="login">Login</label>
        <input id="login" name="login" autocomplete="username" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Continue</button>
      </form>
    </main>
  </body>
</html>`;
  }

  private consentPage(uid: string, scope: string) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Consent</title>
    <style>
      body { font-family: sans-serif; background: #eef4ff; color: #1f2937; display: grid; min-height: 100vh; place-items: center; margin: 0; }
      main { width: min(460px, calc(100vw - 32px)); background: white; padding: 32px; border-radius: 20px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p { margin: 0 0 24px; color: #4b5563; }
      button { width: 100%; padding: 12px 16px; border: 0; border-radius: 999px; background: #0f766e; color: white; font-weight: 700; cursor: pointer; }
      code { display: block; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Approve access</h1>
      <p>The client is requesting the following scope:</p>
      <code>${scope}</code>
      <form method="post" action="/interaction/${uid}/confirm">
        <button type="submit">Allow</button>
      </form>
    </main>
  </body>
</html>`;
  }
}
