import type { Request, Response } from 'express';

import { BaseController } from '../../core/http/base-controller';
import {
  changePasswordSchema,
  createSessionSchema,
  createStaffSchema,
  listStaffSchema,
  resetPasswordSchema,
  updateStaffSchema,
} from './identity-schemas';
import { requirePrincipal } from './identity-middleware';
import type { AuthenticatedRequest } from './identity-types';
import type { IdentityService } from './identity-service';

/**
 * Controller chuyển HTTP input thành lệnh service và chuẩn hóa response envelope.
 */
export class IdentityController extends BaseController {
  constructor(private readonly service: IdentityService) {
    super();
  }

  /**
   * Xử lý đăng nhập nhân viên từ body đã validate bằng schema.
   */
  async createSession(req: Request, res: Response) {
    try {
      const input = createSessionSchema.parse(req.body);
      const requestId = res.locals.requestId as string;
      const result = await this.service.createSession({
        ...input,
        requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Trả thông tin principal hiện tại từ request đã được authenticate.
   */
  async getCurrentPrincipal(req: AuthenticatedRequest, res: Response) {
    try {
      this.handleSuccess(res, await this.service.getCurrentPrincipal(requirePrincipal(req)));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Đổi mật khẩu bằng currentPassword để tránh chiếm phiên trái phép.
   */
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const input = changePasswordSchema.parse(req.body);
      const requestId = res.locals.requestId as string;
      const result = await this.service.changePassword({
        actor: requirePrincipal(req),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Liệt kê tài khoản nhân viên theo query phân trang và từ khóa tìm kiếm.
   */
  async listStaffUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const input = listStaffSchema.parse(req.query);
      const requestId = res.locals.requestId as string;
      const result = await this.service.listStaffUsers({
        actor: requirePrincipal(req),
        departmentId: input.departmentId,
        isActive: input.isActive,
        page: input.page,
        pageSize: input.pageSize,
        q: input.q,
        roleCode: input.roleCode,
        requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Tạo tài khoản nhân viên; response không cache vì chứa mật khẩu tạm thời.
   */
  async createStaffAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const input = createStaffSchema.parse(req.body);
      const requestId = res.locals.requestId as string;
      const result = await this.service.createStaffAccount({
        actor: requirePrincipal(req),
        input,
        requestId,
      });

      res.setHeader('Cache-Control', 'no-store');
      this.handleSuccess(res, result, 201);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Cập nhật tài khoản nhân viên với header If-Unmodified-Since từ client.
   */
  async updateStaffAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const input = updateStaffSchema.parse(req.body);
      const requestId = res.locals.requestId as string;
      const result = await this.service.updateStaffAccount({
        actor: requirePrincipal(req),
        ifUnmodifiedSince: req.header('if-unmodified-since') ?? undefined,
        input,
        requestId,
        userId: req.params.userId ?? '',
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Reset mật khẩu; response không cache vì chứa secret chỉ hiển thị một lần.
   */
  async resetStaffPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const input = resetPasswordSchema.parse(req.body);
      const requestId = res.locals.requestId as string;
      const result = await this.service.resetStaffPassword({
        actor: requirePrincipal(req),
        reason: input.reason,
        requestId,
        userId: req.params.userId ?? '',
      });

      res.setHeader('Cache-Control', 'no-store');
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
