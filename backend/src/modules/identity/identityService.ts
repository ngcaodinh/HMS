import { createHash } from 'node:crypto';

import { AppError } from '../../core/http/AppError';
import {
  assertCanManageTargetRoles,
  assertSupportReference,
  privilegedRoleCodes,
} from './identityPolicy';
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

/**
 * Chuyển ngày dạng YYYY-MM-DD từ API sang Date tại đầu ngày UTC để lưu đúng cột DATE.
 */
const toDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

/**
 * Băm dữ liệu kiểm toán nhạy cảm trước khi ghi log.
 * Nhận chuỗi thô từ input hợp lệ, trả về fingerprint SHA-256 không thể đọc lại nội dung gốc.
 */
const createAuditHash = (value: string) =>
  `sha256:${createHash('sha256').update(value.trim()).digest('hex')}`;

/**
 * Loại bỏ password hash trước khi dữ liệu người dùng rời khỏi service layer.
 */
const sanitizeUser = (user: StaffUserRecord): PublicStaffUser => {
  const { password, ...safeUser } = user;
  void password;

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

/**
 * Điều phối nghiệp vụ Identity/RBAC cho đăng nhập và vòng đời tài khoản nhân viên.
 */
export class IdentityService {
  constructor(private readonly dependencies: IdentityServiceDependencies) {}

  /**
   * Xác thực username/password, ghi nhận audit đăng nhập và phát JWT theo authVersion hiện tại.
   * Nhận thông tin đăng nhập đã validate ở controller, trả principal đã loại bỏ password hash.
   */
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

  /**
   * Trả principal đã được middleware xác thực để frontend dựng session hiện tại.
   * Không đọc DB và không phát sinh side effect.
   */
  getCurrentPrincipal(actor: Principal) {
    return Promise.resolve(actor);
  }

  /**
   * Đổi mật khẩu của chính actor và tăng authVersion để thu hồi token cũ.
   * Nhận mật khẩu mới và mật khẩu hiện tại khi không ở first-login flow, trả JWT mới cho phiên hiện tại.
   */
  async changePassword(input: {
    actor: Principal;
    currentPassword?: string;
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

    if (!input.currentPassword && !user.mustChangePassword) {
      throw new AppError({
        code: 'CURRENT_PASSWORD_REQUIRED',
        message: 'Cần nhập mật khẩu hiện tại để đổi mật khẩu',
        status: 400,
      });
    }

    if (input.currentPassword) {
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

    return {
      accessToken: this.dependencies.jwt.sign({
        authVersion: updated.authVersion,
        userId: updated.id,
      }),
      principal: sanitizeUser(updated),
    };
  }

  /**
   * Kiểm tra quyền hành động RBAC cho actor trước khi chạy nghiệp vụ nhạy cảm.
   * Nhận mã hành động ổn định, ghi audit khi bị từ chối và ném lỗi 403.
   */
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

  /**
   * Liệt kê tài khoản nhân viên theo quyền staff.read, filter truy vấn và phạm vi vai trò của actor.
   * Nhận phân trang/từ khóa/filter từ API, trả danh sách đã loại password hash và ghi audit đọc.
   */
  async listStaffUsers(input: {
    actor: Principal;
    departmentId?: string;
    isActive?: boolean;
    page: number;
    pageSize: number;
    q?: string;
    requestId: string;
  }) {
    await this.assertAction(input.actor, 'staff.read');

    const shouldHidePrivilegedStaff =
      input.actor.roleCodes.includes('it_tech') && !input.actor.roleCodes.includes('admin');
    const result = await this.dependencies.repository.listStaffUsers({
      departmentId: input.departmentId,
      excludedRoleCodes: shouldHidePrivilegedStaff ? [...privilegedRoleCodes] : undefined,
      isActive: input.isActive,
      page: input.page,
      pageSize: input.pageSize,
      q: input.q,
    });

    await this.dependencies.auditPort.record({
      action: 'staff.read',
      actorId: input.actor.id,
      requestId: input.requestId,
      resource: 'staff-user',
    });

    return {
      items: result.items.map(sanitizeUser),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: result.totalItems,
      totalPages: Math.max(1, Math.ceil(result.totalItems / input.pageSize)),
    };
  }

  /**
   * Tạo tài khoản nhân viên với role hợp lệ trong phạm vi RBAC của actor.
   * Nhận hồ sơ nhân viên đã validate, trả mật khẩu tạm thời một lần và ghi audit không chứa secret.
   */
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

  /**
   * Cập nhật tài khoản nhân viên với optimistic lock và các rule bảo vệ role đặc quyền.
   * Nhận header If-Unmodified-Since từ client, trả user đã cập nhật và tăng authVersion khi đổi role/trạng thái.
   */
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

    if (!input.ifUnmodifiedSince) {
      throw new AppError({
        code: 'IF_UNMODIFIED_SINCE_REQUIRED',
        message: 'Cần gửi If-Unmodified-Since để tránh ghi đè dữ liệu cũ',
        status: 428,
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
    const updateInput = {
      data: {
        departmentId: input.input.departmentId,
        fullName: input.input.fullName,
        isActive: input.input.isActive,
        phoneNumber: input.input.phoneNumber,
        ...(shouldRevokeTokens ? { authVersion: { increment: 1 } } : {}),
      },
      userId: target.id,
    };
    const updated = input.input.roleCodes
      ? await this.dependencies.repository.updateStaffUserWithRoles({
          ...updateInput,
          assignedBy: input.actor.id,
          roleCodes: input.input.roleCodes,
        })
      : await this.dependencies.repository.updateStaffUser(updateInput);

    if (!updated) {
      throw new AppError({
        code: 'STAFF_NOT_FOUND',
        message: 'Không tìm thấy nhân viên',
        status: 404,
      });
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

  /**
   * Reset mật khẩu nhân viên, bật mustChangePassword và thu hồi toàn bộ token hiện có.
   * Nhận lý do reset để kiểm toán, chỉ ghi hash của lý do và trả mật khẩu tạm thời một lần.
   */
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
      changedFields: ['password', 'mustChangePassword', 'authVersion', 'reasonHash'],
      reference: createAuditHash(input.reason),
      requestId: input.requestId,
      resource: 'staff-user',
      resourceId: target.id,
    });

    return {
      temporaryPassword,
      user: sanitizeUser(updated),
    };
  }
}
