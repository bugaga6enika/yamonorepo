import { PrismaService } from "../database/prisma.service.js";

type Payload = Record<string, unknown>;

function toExpiryInSeconds(expiresAt: Date) {
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

export class OidcAdapter {
  constructor(
    private readonly modelName: string,
    private readonly prisma: PrismaService
  ) {}

  async upsert(id: string, payload: Payload, expiresIn: number) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.prisma.oidcAdapterEntity.upsert({
      where: { id },
      update: {
        payload: payload as never,
        expiresAt,
        grantId: this.optionalString(payload.grantId),
        uid: this.optionalString(payload.uid),
        userCode: this.optionalString(payload.userCode)
      },
      create: {
        id,
        model: this.modelName,
        payload: payload as never,
        expiresAt,
        grantId: this.optionalString(payload.grantId),
        uid: this.optionalString(payload.uid),
        userCode: this.optionalString(payload.userCode)
      }
    });
  }

  async find(id: string) {
    const entity = await this.prisma.oidcAdapterEntity.findFirst({
      where: {
        id,
        model: this.modelName
      }
    });

    if (!entity || entity.expiresAt.getTime() <= Date.now()) {
      return undefined;
    }

    return {
      ...((entity.payload as Payload) ?? {}),
      ...(entity.consumedAt ? { consumed: Math.floor(entity.consumedAt.getTime() / 1000) } : {}),
      ...(entity.expiresAt ? { exp: Math.floor(entity.expiresAt.getTime() / 1000) } : {})
    };
  }

  async findByUid(uid: string) {
    return this.findBy("uid", uid);
  }

  async findByUserCode(userCode: string) {
    return this.findBy("userCode", userCode);
  }

  async destroy(id: string) {
    await this.prisma.oidcAdapterEntity.deleteMany({
      where: {
        id,
        model: this.modelName
      }
    });
  }

  async consume(id: string) {
    await this.prisma.oidcAdapterEntity.updateMany({
      where: {
        id,
        model: this.modelName
      },
      data: {
        consumedAt: new Date()
      }
    });
  }

  async revokeByGrantId(grantId: string) {
    await this.prisma.oidcAdapterEntity.deleteMany({
      where: {
        grantId
      }
    });
  }

  async findAndDelete(id: string) {
    const existing = await this.find(id);
    await this.destroy(id);
    return existing;
  }

  async findBySessionUid(uid: string) {
    return this.findByUid(uid);
  }

  private async findBy(field: "uid" | "userCode", value: string) {
    const entity = await this.prisma.oidcAdapterEntity.findFirst({
      where: {
        model: this.modelName,
        [field]: value
      }
    });

    if (!entity || entity.expiresAt.getTime() <= Date.now()) {
      return undefined;
    }

    return {
      ...((entity.payload as Payload) ?? {}),
      exp: Math.floor(entity.expiresAt.getTime() / 1000),
      ttl: toExpiryInSeconds(entity.expiresAt)
    };
  }

  private optionalString(value: unknown) {
    return typeof value === "string" ? value : null;
  }
}
