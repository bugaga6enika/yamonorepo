declare module "oidc-provider" {
  import type { RequestHandler } from "express";

  export type Configuration = Record<string, unknown>;

  export default class Provider {
    constructor(issuer: string, configuration: Configuration);
    callback(): RequestHandler;
    interactionDetails(request: unknown, response: unknown): Promise<{
      prompt: { name: string };
      params: Record<string, unknown>;
    }>;
    interactionFinished(
      request: unknown,
      response: unknown,
      result: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<void>;
  }
}
