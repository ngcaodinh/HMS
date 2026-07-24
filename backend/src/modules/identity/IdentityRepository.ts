import { randomUUID } from 'node:crypto';

import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  CreateStaffData,
  IdentityRepository,
  RoleCode,
  StaffUserRecord,
} from './identityTypes';

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    permissions: true;
  };
}>;

const mapUser = (user: UserWithRoles): StaffUserRecord => ({
  authVersion: user.authVersion,
  createdAt: user.createdAt,
  dateOfBirth: user.dateOfBirth,
  departmentId: user.departmentId,
  fullName: user.fullName,
  gender: user.gender as StaffUserRecord['gender'],
  id: user.id,
  identityCardNumber: user.identityCardNumber,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  mustChangePassword: user.mustChangePassword,
  password: user.password,
  phoneNumber: user.phoneNumber,
  roleCodes: user.permissions.map((permission) => permission.roleCode as RoleCode),
  updatedAt: user.updatedAt,
  username: user.username,
});

export class PrismaIdentityRepository implements IdentityRepository {
  constructor(private readonly client: PrismaClient) {}

  async countActiveAdminsExcluding(userId: string) {
    return this.client.user.count({
      where: {
        id: { not: userId },
        isActive: true,
        permissions: {
          some: {
            roleCode: 'admin',
          },
        },
      },
    });
  }

  async createStaffUser(input: {
    assignedBy: string;
    data: CreateStaffData;
    passwordHash: string;
  }) {
    const user = await this.client.user.create({
      data: {
        ...input.data,
        dateOfBirth: input.data.dateOfBirth,
        id: randomUUID(),
        password: input.passwordHash,
        permissions: {
          create: input.data.roleCodes.map((roleCode) => ({
            assignedBy: input.assignedBy,
            id: randomUUID(),
            roleCode,
          })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return mapUser(user);
  }

  async findRoleCodesForUser(userId: string) {
    const permissions = await this.client.permission.findMany({
      select: {
        roleCode: true,
      },
      where: {
        userId,
      },
    });

    return permissions.map((permission) => permission.roleCode as RoleCode);
  }

  async findUserById(userId: string) {
    const user = await this.client.user.findUnique({
      include: {
        permissions: true,
      },
      where: {
        id: userId,
      },
    });

    return user ? mapUser(user) : null;
  }

  async findUserByUsername(username: string) {
    const user = await this.client.user.findUnique({
      include: {
        permissions: true,
      },
      where: {
        username,
      },
    });

    return user ? mapUser(user) : null;
  }

  async listStaffUsers(input: { page: number; pageSize: number; q?: string }) {
    const where: Prisma.UserWhereInput = input.q
      ? {
          OR: [
            { username: { contains: input.q } },
            { fullName: { contains: input.q } },
            { phoneNumber: { contains: input.q } },
          ],
        }
      : {};

    const [items, totalItems] = await this.client.$transaction([
      this.client.user.findMany({
        include: {
          permissions: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.client.user.count({ where }),
    ]);

    return {
      items: items.map(mapUser),
      totalItems,
    };
  }

  async replaceUserRoles(input: { assignedBy: string; roleCodes: RoleCode[]; userId: string }) {
    await this.client.$transaction([
      this.client.permission.deleteMany({
        where: {
          userId: input.userId,
        },
      }),
      ...input.roleCodes.map((roleCode) =>
        this.client.permission.create({
          data: {
            assignedBy: input.assignedBy,
            id: randomUUID(),
            roleCode,
            userId: input.userId,
          },
        }),
      ),
    ]);
  }

  async updateLastLogin(userId: string, occurredAt: Date) {
    await this.client.user.update({
      data: {
        lastLoginAt: occurredAt,
      },
      where: {
        id: userId,
      },
    });
  }

  async updatePassword(input: {
    mustChangePassword: boolean;
    passwordHash: string;
    userId: string;
  }) {
    const user = await this.client.user.update({
      data: {
        authVersion: {
          increment: 1,
        },
        mustChangePassword: input.mustChangePassword,
        password: input.passwordHash,
      },
      include: {
        permissions: true,
      },
      where: {
        id: input.userId,
      },
    });

    return mapUser(user);
  }

  async updateStaffUser(input: {
    data: Prisma.UserUpdateInput;
    userId: string;
  }) {
    const user = await this.client.user.update({
      data: input.data,
      include: {
        permissions: true,
      },
      where: {
        id: input.userId,
      },
    });

    return mapUser(user);
  }

  async userHasAction(userId: string, actionCode: string) {
    const permission = await this.client.permission.findFirst({
      where: {
        role: {
          rolePermissions: {
            some: {
              actionCode,
            },
          },
        },
        userId,
      },
    });

    return Boolean(permission);
  }
}
