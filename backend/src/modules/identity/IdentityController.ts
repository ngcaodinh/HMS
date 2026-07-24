import type { Request, Response } from 'express';

import { BaseController } from '../../core/http/BaseController';
import {
  changePasswordSchema,
  createSessionSchema,
  createStaffSchema,
  listStaffSchema,
  resetPasswordSchema,
  updateStaffSchema,
} from './identitySchemas';
import { requirePrincipal } from './identityMiddleware';
import type { AuthenticatedRequest } from './identityTypes';
import { IdentityService } from './identityService';

export class IdentityController extends BaseController {
  constructor(private readonly service: IdentityService) {
    super();
  }

  async createSession(req: Request, res: Response) {
    try {
      const input = createSessionSchema.parse(req.body);
      const result = await this.service.createSession({
        ...input,
        requestId: res.locals.requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getCurrentPrincipal(req: AuthenticatedRequest, res: Response) {
    try {
      this.handleSuccess(res, await this.service.getCurrentPrincipal(requirePrincipal(req)));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const input = changePasswordSchema.parse(req.body);
      const result = await this.service.changePassword({
        actor: requirePrincipal(req),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        requestId: res.locals.requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async listStaffUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const input = listStaffSchema.parse(req.query);
      const result = await this.service.listStaffUsers({
        actor: requirePrincipal(req),
        page: input.page,
        pageSize: input.pageSize,
        q: input.q,
        requestId: res.locals.requestId,
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createStaffAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const input = createStaffSchema.parse(req.body);
      const result = await this.service.createStaffAccount({
        actor: requirePrincipal(req),
        input,
        requestId: res.locals.requestId,
      });

      res.setHeader('Cache-Control', 'no-store');
      this.handleSuccess(res, result, 201);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateStaffAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const input = updateStaffSchema.parse(req.body);
      const result = await this.service.updateStaffAccount({
        actor: requirePrincipal(req),
        ifUnmodifiedSince: req.header('if-unmodified-since') ?? undefined,
        input,
        requestId: res.locals.requestId,
        userId: req.params.userId ?? '',
      });

      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async resetStaffPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const input = resetPasswordSchema.parse(req.body);
      const result = await this.service.resetStaffPassword({
        actor: requirePrincipal(req),
        reason: input.reason,
        requestId: res.locals.requestId,
        userId: req.params.userId ?? '',
      });

      res.setHeader('Cache-Control', 'no-store');
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
