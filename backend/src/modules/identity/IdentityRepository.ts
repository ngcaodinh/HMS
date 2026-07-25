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

/**
 * Chuyển Prisma model sang domain record để service không phụ thuộc shape DB.
 */
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

/**
 * Repository Prisma cho Identity, gom toàn bộ truy vấn User/Permission/RBAC.
 */
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

  /**
   * Truy vấn danh sách nhân viên theo phân trang, từ khóa và phạm vi role được phép nhìn thấy.
   * Nhận filter đã chuẩn hóa từ service, trả items và totalItems cùng một điều kiện where trong transaction.
   */
  async listStaffUsers(input: {
    departmentId?: string;
    excludedRoleCodes?: RoleCode[];
    isActive?: boolean;
    page: number;
    pageSize: number;
    q?: string;
  }) {
    const filters: Prisma.UserWhereInput[] = [];

    if (input.q) {
      filters.push({
        OR: [
          { username: { contains: input.q } },
          { fullName: { contains: input.q } },
          { phoneNumber: { contains: input.q } },
        ],
      });
    }

    if (input.departmentId) {
      filters.push({
        departmentId: input.departmentId,
      });
    }

    if (input.isActive !== undefined) {
      filters.push({
        isActive: input.isActive,
      });
    }

    if (input.excludedRoleCodes?.length) {
      filters.push({
        permissions: {
          none: {
            roleCode: {
              in: input.excludedRoleCodes,
            },
          },
        },
      });
    }

    const where: Prisma.UserWhereInput = filters.length ? { AND: filters } : {};

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

  /**
   * Cập nhật hồ sơ user và thay toàn bộ role trong cùng transaction Prisma.
   * Nhận dữ liệu update, actor gán quyền và role mới; trả user sau cập nhật để service phát response an toàn.
   */
  async updateStaffUserWithRoles(input: {
    assignedBy: string;
    data: Prisma.UserUpdateInput;
    roleCodes: RoleCode[];
    userId: string;
  }) {
    const user = await this.client.$transaction(async (transaction) => {
      await transaction.user.update({
        data: input.data,
        where: {
          id: input.userId,
        },
      });

      await transaction.permission.deleteMany({
        where: {
          userId: input.userId,
        },
      });

      await Promise.all(
        input.roleCodes.map((roleCode) =>
          transaction.permission.create({
            data: {
              assignedBy: input.assignedBy,
              id: randomUUID(),
              roleCode,
              userId: input.userId,
            },
          }),
        ),
      );

      return transaction.user.findUnique({
        include: {
          permissions: true,
        },
        where: {
          id: input.userId,
        },
      });
    });

    return user ? mapUser(user) : null;
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
