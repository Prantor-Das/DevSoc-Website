import type { UserRole } from "@prisma/client";
import { prisma } from "../libs/db.js";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  name: string;
  email: string;
  image?: string | null;
  role?: UserRole;
}) {
  return prisma.user.create({ data: { ...data, role: data.role ?? "USER" } });
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; image?: string | null }
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId } });
}
