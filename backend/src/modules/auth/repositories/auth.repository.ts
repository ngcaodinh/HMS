import { prisma } from '../../../core/db/prisma-client';

const userWithRoles = {
  permissions: true,
} as const;

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username }, include: userWithRoles });
}

export function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: userWithRoles });
}

export function touchLastLogin(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export type UserWithRoles = NonNullable<Awaited<ReturnType<typeof findUserByUsername>>>;

export function roleCodesOf(user: UserWithRoles): string[] {
  return user.permissions.map((p) => p.roleCode);
}
