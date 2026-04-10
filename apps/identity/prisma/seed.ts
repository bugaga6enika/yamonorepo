import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const login = process.env.SEED_ADMIN_LOGIN ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-now";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const displayName = process.env.SEED_ADMIN_NAME ?? "Admin User";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { login },
    update: {
      email,
      displayName,
      passwordHash
    },
    create: {
      login,
      email,
      displayName,
      passwordHash
    }
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
