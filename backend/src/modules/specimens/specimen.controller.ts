import type { Request, Response } from 'express';
import { SpecimenStatus, type Prisma } from '@prisma/client';
import { AppError } from '../../core/errors/app-error';
import { prisma } from '../../core/prisma/prisma';
import { AuditPort } from '../../ports/audit-port';
import { RealtimePublisher } from '../../ports/realtime-publisher';
import { sendSuccess } from '../../core/http/response-envelope';
import { createSpecimenSchema, handoffSpecimenSchema } from './schemas/specimen.schema';

export class SpecimenController {
  // GET /api/v1/specimens
  static async listSpecimens(req: Request, res: Response) {
    const statusQuery = req.query.status as string | undefined;

    const where: Prisma.SpecimenCollectionWhereInput = {};
    if (statusQuery && Object.values(SpecimenStatus).includes(statusQuery as SpecimenStatus)) {
      where.status = statusQuery as SpecimenStatus;
    }

    const specimens = await prisma.specimenCollection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, specimens);
  }

  // POST /api/v1/specimens
  static async createSpecimen(req: Request, res: Response) {
    const body = createSpecimenSchema.parse(req.body);

    const specimen = await prisma.specimenCollection.create({
      data: {
        recordId: body.recordId,
        patientCode: body.patientCode,
        patientName: body.patientName,
        departmentName: body.departmentName,
        specimenCode: body.specimenCode,
        specimenType: body.specimenType,
        orderDescription: body.orderDescription,
        priority: body.priority ?? false,
        status: SpecimenStatus.pending,
      },
    });

    AuditPort.logActivity('SPECIMEN_CREATED', req.user?.id || 'unknown', specimen.id, {
      specimenCode: specimen.specimenCode,
    });
    RealtimePublisher.publishEvent('specimen', 'created', specimen);

    return sendSuccess(res, specimen, 201);
  }

  // POST /api/v1/specimens/:id/collect
  static async collectSpecimen(req: Request, res: Response) {
    const { id } = req.params;

    const specimen = await prisma.specimenCollection.findUnique({
      where: { id },
    });

    if (!specimen) {
      throw new AppError(404, 'SPECIMEN_NOT_FOUND', 'Không tìm thấy mẫu bệnh phẩm');
    }

    if (specimen.status !== SpecimenStatus.pending) {
      throw new AppError(
        400,
        'SPECIMEN_ALREADY_COLLECTED',
        'Mẫu bệnh phẩm đã được lấy hoặc đã bàn giao',
      );
    }

    const updated = await prisma.specimenCollection.update({
      where: { id },
      data: {
        status: SpecimenStatus.collected,
        collectedBy: req.user?.id || 'usr-nurse-01',
        collectedAt: new Date(),
      },
    });

    AuditPort.logActivity('SPECIMEN_COLLECTED', req.user?.id || 'unknown', updated.id, {
      status: updated.status,
    });
    RealtimePublisher.publishEvent('specimen', 'collected', updated);

    return sendSuccess(res, updated);
  }

  // POST /api/v1/specimens/:id/print-barcode
  static async printBarcode(req: Request, res: Response) {
    const { id } = req.params;

    const specimen = await prisma.specimenCollection.findUnique({
      where: { id },
    });

    if (!specimen) {
      throw new AppError(404, 'SPECIMEN_NOT_FOUND', 'Không tìm thấy mẫu bệnh phẩm');
    }

    const updated = await prisma.specimenCollection.update({
      where: { id },
      data: {
        barcodePrinted: true,
      },
    });

    AuditPort.logActivity('SPECIMEN_BARCODE_PRINTED', req.user?.id || 'unknown', updated.id, {
      barcodePrinted: true,
    });
    RealtimePublisher.publishEvent('specimen', 'barcode_printed', updated);

    return sendSuccess(res, updated);
  }

  // POST /api/v1/specimens/:id/handoff
  static async handoffSpecimen(req: Request, res: Response) {
    const { id } = req.params;

    const specimen = await prisma.specimenCollection.findUnique({
      where: { id },
    });

    if (!specimen) {
      throw new AppError(404, 'SPECIMEN_NOT_FOUND', 'Không tìm thấy mẫu bệnh phẩm');
    }

    if (specimen.status !== SpecimenStatus.collected) {
      throw new AppError(400, 'SPECIMEN_NOT_COLLECTED', 'Mẫu bệnh phẩm chưa được lấy thành công');
    }

    const body = handoffSpecimenSchema.parse(req.body);

    const updated = await prisma.specimenCollection.update({
      where: { id },
      data: {
        status: SpecimenStatus.handed_over,
        handedOverBy: req.user?.id || 'usr-nurse-01',
        handedOverAt: new Date(),
        labReceiverName: body.labReceiverName || 'Phòng Lab Central',
      },
    });

    AuditPort.logActivity('SPECIMEN_HANDED_OVER', req.user?.id || 'unknown', updated.id, {
      status: updated.status,
      labReceiverName: updated.labReceiverName,
    });
    RealtimePublisher.publishEvent('specimen', 'handed_over', updated);

    return sendSuccess(res, updated);
  }
}
