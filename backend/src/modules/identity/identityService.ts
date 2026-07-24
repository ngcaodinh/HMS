import { AppError } from '../../core/http/AppError';
import { assertCanManageTargetRoles, assertSupportReference } from './identityPolicy';
import type {
  AuditPort,
  BcryptPort,
  DepartmentDirectoryPort,
  IdentityRepository,
  JwtPort,
  Principal,
  PublicStaffUser,
  RoleCode,
  StaffUserRecord,
} from './identityTypes';

const toDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const sanitizeUser = (user: StaffUserRecord): PublicStaffUser => {
  const { password: _password, ...safeUser } = user;

  return safeUser;
};

type IdentityServiceDependencies = {
  auditPort: AuditPort;
  bcrypt: BcryptPort;
  clock: () => Date;
  departmentDirectory: DepartmentDirectoryPort;
  jwt: JwtPort;
  randomPassword: () => string;
  repository: IdentityRepository;
};

export class IdentityService {
  constructor(private readonly dependencies: IdentityServiceDependencies) {}

  async createSession(input: { password: string; requestId: string; username: string }) {
    const user = await this.dependencies.repository.findUserByUsername(input.username);
    const invalidCredentials = new AppError({
      code: 'INVALID_CREDENTIALS',
      message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      status: 401,
    });

    if (!user || !user.isActive) throw invalidCredentials;

    const isValidPassword = await this.dependencies.bcrypt.compare(input.password, user.password);

    if (!isValidPassword) throw invalidCredentials;

    await this.dependencies.repository.updateLastLogin(user.id, this.dependencies.clock());
    await this.dependencies.auditPort.record({
      action: 'auth.session.create',
      actorId: user.id,
      requestId: input.requestId,
      resource: 'session',
    });

    return {
      accessToken: this.dependencies.jwt.sign({
        authVersion: user.authVersion,
        userId: user.id,
      }),
      principal: sanitizeUser(user),
    };
  }

  async getCurrentPrincipal(actor: Principal) {
    return actor;
  }

  async changePassword(input: {
    actor: Principal;
    currentPassword: string;
    newPassword: string;
    requestId: string;
  }) {
    const user = await this.dependencies.repository.findUserById(input.actor.id);

    if (!user) {
      throw new AppError({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    const isValidPassword = await this.dependencies.bcrypt.compare(
      input.currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new AppError({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Mật khẩu hiện tại không đúng',
        status: 400,
      });
    }

    const updated = await this.dependencies.repository.updatePassword({
      mustChangePassword: false,
      passwordHash: await this.dependencies.bcrypt.hash(input.newPassword),
      userId: user.id,
    });

    if (!updated) {
      throw new AppError({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    await this.dependencies.auditPort.record({
      action: 'auth.password.change',
      actorId: user.id,
      changedFields: ['password', 'authVersion', 'mustChangePassword'],
      requestId: input.requestId,
      resource: 'staff-user',
      resourceId: user.id,
    });

    return sanitizeUser(updated);
  }

  async assertAction(actor: Principal, actionCode: string) {
    const allowed = await this.dependencies.repository.userHasAction(actor.id, actionCode);

    if (allowed) return;

    await this.dependencies.auditPort.record({
      action: 'authorization.denied',
      actorId: actor.id,
      reference: actionCode,
      requestId: 'authorization',
      resource: 'rbac',
    });

    throw new AppError({
      code: 'FORBIDDEN',
      message: 'Không đủ quyền thực hiện thao tác',
      status: 403,
    });
  }

  async listStaffUsers(input: {
    actor: Principal;
    page: number;
    pageSize: number;
    q?: string;
    requestId: string;
  }) {
    await this.assertAction(input.actor, 'staff.read');

    const result = await this.dependencies.repository.listStaffUsers(input);
    const items = input.actor.roleCodes.includes('it_tech')
      ? result.items.filter((user) => user.roleCodes.every((roleCode) => !this.isPrivileged(roleCode)))
      : result.items;

    await this.dependencies.auditPort.record({
      action: 'staff.read',
      actorId: input.actor.id,
      requestId: input.requestId,
      resource: 'staff-user',
    });

    return {
      items: items.map(sanitizeUser),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: input.actor.roleCodes.includes('it_tech') ? items.length : result.totalItems,
      totalPages: Math.max(1, Math.ceil(result.totalItems / input.pageSize)),
    };
  }

  async createStaffAccount(input: {
    actor: Principal;
    input: {
      dateOfBirth: string;
      departmentId: string;
      fullName: string;
      gender: 'male' | 'female';
      identityCardNumber: string;
      phoneNumber: string;
      roleCodes: RoleCode[];
      supportRequestReference?: string;
      username: string;
    };
    requestId: string;
  }) {
    await this.assertAction(input.actor, 'staff.create');
    assertCanManageTargetRoles(input.actor, input.input.roleCodes);
    assertSupportReference(input.actor, input.input.supportRequestReference);
    await this.dependencies.departmentDirectory.assertDepartmentExists(input.input.departmentId);

    const temporaryPassword = this.dependencies.randomPassword();
    const user = await this.dependencies.repository.createStaffUser({
      assignedBy: input.actor.id,
      data: {
        dateOfBirth: toDateOnly(input.input.dateOfBirth),
        departmentId: input.input.departmentId,
        fullName: input.input.fullName,
        gender: input.input.gender,
        identityCardNumber: input.input.identityCardNumber,
        phoneNumber: input.input.phoneNumber,
        roleCodes: input.input.roleCodes,
        username: input.input.username,
      },
      passwordHash: await this.dependencies.bcrypt.hash(temporaryPassword),
    });

    await this.dependencies.auditPort.record({
      action: 'staff.create',
      actorId: input.actor.id,
      changedFields: [
        'username',
        'fullName',
        'gender',
        'dateOfBirth',
        'phoneNumber',
        'identityCardNumber',
        'departmentId',
        'roleCodes',
      ],
      reference: input.input.supportRequestReference,
      requestId: input.requestId,
      resource: 'staff-user',
      resourceId: user.id,
    });

    return {
      temporaryPassword,
      user: sanitizeUser(user),
    };
  }

  async updateStaffAccount(input: {
    actor: Principal;
    ifUnmodifiedSince?: string;
    input: {
      departmentId?: string;
      fullName?: string;
      isActive?: boolean;
      phoneNumber?: string;
      roleCodes?: RoleCode[];
      supportRequestReference?: string;
    };
    requestId: string;
    userId: string;
  }) {
    await this.assertAction(input.actor, 'staff.update');

    const target = await this.dependencies.repository.findUserById(input.userId);

    if (!target) {
      throw new AppError({
        code: 'STAFF_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    if (input.ifUnmodifiedSince !== target.updatedAt.toISOString()) {
      throw new AppError({
        code: 'STAFF_MODIFIED_SINCE_READ',
        message: 'Dữ liệu nhân viên đã thay đổi, vui lòng tải lại',
        status: 409,
      });
    }

    assertCanManageTargetRoles(input.actor, input.input.roleCodes ?? target.roleCodes);

    if (input.input.isActive !== undefined || input.input.roleCodes) {
      assertSupportReference(input.actor, input.input.supportRequestReference);
    }

    if (input.input.departmentId) {
      await this.dependencies.departmentDirectory.assertDepartmentExists(input.input.departmentId);
    }

    if (
      target.roleCodes.includes('admin') &&
      target.isActive &&
      input.input.isActive === false &&
      (await this.dependencies.repository.countActiveAdminsExcluding(target.id)) === 0
    ) {
      throw new AppError({
        code: 'LAST_ACTIVE_ADMIN',
        message: 'Không thể khóa tài khoản admin active cuối cùng',
        status: 422,
      });
    }

    const shouldRevokeTokens =
      input.input.isActive !== undefined || input.input.roleCodes !== undefined;
    const updated = await this.dependencies.repository.updateStaffUser({
      data: {
        departmentId: input.input.departmentId,
        fullName: input.input.fullName,
        isActive: input.input.isActive,
        phoneNumber: input.input.phoneNumber,
        ...(shouldRevokeTokens ? { authVersion: { increment: 1 } } : {}),
      },
      userId: target.id,
    });

    if (!updated) {
      throw new AppError({
        code: 'STAFF_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    if (input.input.roleCodes) {
      await this.dependencies.repository.replaceUserRoles({
        assignedBy: input.actor.id,
        roleCodes: input.input.roleCodes,
        userId: target.id,
      });
      updated.roleCodes = input.input.roleCodes;
    }

    await this.dependencies.auditPort.record({
      action: 'staff.update',
      actorId: input.actor.id,
      changedFields: Object.keys(input.input).filter((field) => field !== 'supportRequestReference'),
      reference: input.input.supportRequestReference,
      requestId: input.requestId,
      resource: 'staff-user',
      resourceId: target.id,
    });

    return sanitizeUser(updated);
  }

  async resetStaffPassword(input: {
    actor: Principal;
    reason: string;
    requestId: string;
    userId: string;
  }) {
    await this.assertAction(input.actor, 'staff.password.reset');

    const target = await this.dependencies.repository.findUserById(input.userId);

    if (!target) {
      throw new AppError({
        code: 'STAFF_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    assertCanManageTargetRoles(input.actor, target.roleCodes);

    const temporaryPassword = this.dependencies.randomPassword();
    const updated = await this.dependencies.repository.updatePassword({
      mustChangePassword: true,
      passwordHash: await this.dependencies.bcrypt.hash(temporaryPassword),
      userId: target.id,
    });

    if (!updated) {
      throw new AppError({
        code: 'STAFF_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
    }

    await this.dependencies.auditPort.record({
      action: 'staff.password.reset',
      actorId: input.actor.id,
      changedFields: ['password', 'mustChangePassword', 'authVersion'],
      reference: input.reason,
      requestId: input.requestId,
      resource: 'staff-user',
      resourceId: target.id,
    });

    return {
      temporaryPassword,
      user: sanitizeUser(updated),
    };
  }

  private isPrivileged(roleCode: RoleCode) {
    return roleCode === 'admin' || roleCode === 'it_tech' || roleCode === 'director';
  }
}
