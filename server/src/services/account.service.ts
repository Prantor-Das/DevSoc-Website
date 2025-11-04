import { prisma } from "../libs/db.js";

export async function createLocalAccount(userId: string, passwordHash: string) {
  return prisma.account.create({
    data: {
      userId,
      providerId: "credentials",
      accountId: userId,
      password: passwordHash,
    },
  });
}

export async function findCredentialsByEmail(email: string) {
  return prisma.account.findFirst({
    where: {
      providerId: "credentials",
      user: { email },
    },
    include: { user: true },
  });
}
