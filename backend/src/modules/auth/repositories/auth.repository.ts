import { prisma } from '../../../core/db/prisma-client';

const userWithRoles = {
  permissions_permissions_userIdTousers: true,
} as const;

export function findUserByUsername(username: string) {
  return prisma.users.findUnique({ where: { username }, include: userWithRoles });
}

export function findUserById(userId: string) {
  return prisma.users.findUnique({ where: { id: userId }, include: userWithRoles });
}

export function touchLastLogin(userId: string) {
  return prisma.users.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export type UserWithRoles = NonNullable<Awaited<ReturnType<typeof findUserByUsername>>>;

export function roleCodesOf(user: UserWithRoles): string[] {
  return user.permissions_permissions_userIdTousers.map((p) => p.roleCode);
}
