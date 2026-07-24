import type { Request, Response } from 'express';
import {
  PrismaClient,
  BedStatus,
  TreatmentOrderStatus,
  TreatmentType,
  MedicalRecordStatus,
} from '@prisma/client';
import type { ReleaseReason, DischargeCondition, Prisma } from '@prisma/client';
import { AppError } from '../../core/utils/AppError';
import { RealtimePublisher } from '../../ports/RealtimePublisher';
import { AuditPort } from '../../ports/AuditPort';
import { BillingSettlementPort } from '../../ports/BillingSettlementPort';
import { sendSuccess } from '../../core/http/response-envelope';
import { toVNISOString } from '../../core/utils/datetime';
import {
  assignBedSchema,
  changeBedAssignmentSchema,
  signDischargeSummarySchema,
  dischargePatientSchema,
  createOrderSchema,
  completeOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from './schemas/inpatient.schema';

const prisma = new PrismaClient();

export class InpatientController {
  // 1. GET /api/v1/inpatient/admission-board
  static async listInpatientAdmissionBoard(req: Request, res: Response) {
    const departmentId = req.query.departmentId as string | undefined;
    const includeMaintenance = req.query.includeMaintenance === 'true';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize as string, 10) || 20);

    const recordWhere: Prisma.MedicalRecordWhereInput = {
      treatmentType: TreatmentType.inpatient,
      status: MedicalRecordStatus.diagnosed,
      bedAssignments: {
        none: { releasedAt: null },
      },
    };

    if (departmentId) {
      recordWhere.departmentId = departmentId;
    }

    const waitingForBedRecords = await prisma.medicalRecord.findMany({
      where: recordWhere,
      include: { patient: true },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const bedWhere: Prisma.BedWhereInput = {};
    if (departmentId) {
      bedWhere.room = { departmentId };
    }
    if (!includeMaintenance) {
      bedWhere.status = { not: BedStatus.maintenance };
    }

    const beds = await prisma.bed.findMany({
      where: bedWhere,
      orderBy: [{ roomId: 'asc' }, { number: 'asc' }],
    });

    return sendSuccess(res, {
      waitingForBedRecords: waitingForBedRecords.map((r) => ({
        recordId: r.id,
        patientId: r.patientId,
        treatmentType: r.treatmentType,
        status: r.status,
        version: r.version,
        recordCode: r.recordCode,
        patientName: r.patient.fullName,
        diagnosis: r.diagnosisText,
        age: new Date().getFullYear() - (r.patient.dateOfBirth?.getFullYear() || 0),
        gender: r.patient.gender === 'male' ? 'Nam' : 'Nữ',
      })),
      beds: beds.map((b) => ({
        bedId: b.id,
        roomId: b.roomId,
        number: b.number,
        status: b.status,
        dailyRate: b.dailyRate,
      })),
    });
  }

  // 2. POST /api/v1/medical-records/:recordId/bed-assignments
  static async assignBed(req: Request, res: Response) {
    const recordId = req.params.recordId || (req.body as { recordId?: string }).recordId || '';
    const body = assignBedSchema.parse(req.body);
    const assignedBy = req.user?.id || 'usr-nurse-01';

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.findUnique({ where: { id: recordId } });
      if (!record) throw new AppError(404, 'RECORD_NOT_FOUND', 'Hồ sơ bệnh án không tồn tại');

      if (record.version !== body.expectedRecordVersion) {
        throw new AppError(409, 'VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác');
      }

      if (record.treatmentType !== TreatmentType.inpatient) {
        throw new AppError(400, 'INVALID_TREATMENT_TYPE', 'Chỉ được xếp giường cho bệnh nhân nội trú');
      }

      const bed = await tx.bed.findUnique({ where: { id: body.bedId } });
      if (!bed) throw new AppError(404, 'BED_NOT_FOUND', 'Giường không tồn tại');
      if (bed.status !== BedStatus.available) {
        throw new AppError(400, 'BED_UNAVAILABLE', 'Giường đã có người hoặc đang bảo trì');
      }

      const existingAssignment = await tx.bedAssignment.findFirst({
        where: { recordId, releasedAt: null },
      });
      if (existingAssignment) {
        throw new AppError(409, 'BED_ASSIGNMENT_CONFLICT', 'Bệnh nhân đã được xếp giường');
      }

      const newAssignment = await tx.bedAssignment.create({
        data: {
          recordId,
          bedId: body.bedId,
          assignedBy,
          dailyRateSnapshot: bed.dailyRate,
          note: body.note,
        },
      });

      await tx.bed.update({
        where: { id: body.bedId },
        data: { status: BedStatus.occupied, patientId: record.patientId, assignedAt: new Date() },
      });

      const updatedRecord = await tx.medicalRecord.update({
        where: { id: recordId },
        data: { bedId: body.bedId, version: { increment: 1 } },
      });

      return { newAssignment, updatedRecord };
    });

    AuditPort.logActivity('BED_ASSIGNED', assignedBy, result.newAssignment.id, { recordId, bedId: body.bedId });
    RealtimePublisher.publishEvent('inpatient', 'bed_assigned', { recordId, bedId: body.bedId });

    return sendSuccess(
      res,
      {
        bedAssignmentId: result.newAssignment.id,
        recordId,
        bedId: body.bedId,
        assignedAt: toVNISOString(result.newAssignment.assignedAt),
        dailyRateSnapshot: result.newAssignment.dailyRateSnapshot,
        bedStatus: 'occupied',
        recordVersion: result.updatedRecord.version,
      },
      201
    );
  }

  // 3. POST /api/v1/medical-records/:recordId/bed-assignment-changes
  static async changeBedAssignment(req: Request, res: Response) {
    const recordId = req.params.recordId || (req.body as { recordId?: string }).recordId || '';
    const body = changeBedAssignmentSchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const result = await prisma.$transaction(async (tx) => {
      const activeAssignment = await tx.bedAssignment.findFirst({
        where: { recordId, releasedAt: null },
        include: { record: true },
      });

      if (!activeAssignment) {
        throw new AppError(400, 'OPEN_BED_ASSIGNMENT_NOT_FOUND', 'Không tìm thấy xếp giường đang hoạt động');
      }

      if (activeAssignment.record.version !== body.expectedRecordVersion) {
        throw new AppError(409, 'VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác');
      }

      if (body.action === 'transfer' && !body.targetBedId) {
        throw new AppError(400, 'TARGET_BED_REQUIRED', 'Cần chọn giường đích khi chuyển giường');
      }

      let targetBed = null;
      if (body.targetBedId) {
        if (activeAssignment.bedId === body.targetBedId) {
          throw new AppError(400, 'SAME_BED', 'Giường mới trùng với giường hiện tại');
        }

        targetBed = await tx.bed.findUnique({ where: { id: body.targetBedId } });
        if (!targetBed) {
          throw new AppError(404, 'BED_NOT_FOUND', 'Giường đích không tồn tại');
        }
        if (targetBed.status !== BedStatus.available) {
          throw new AppError(400, 'BED_UNAVAILABLE', 'Giường đích không khả dụng');
        }
      }

      const releaseReason: ReleaseReason = body.action === 'transfer' ? 'transfer' : 'correction';

      const previousAssignment = await tx.bedAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          releasedAt: new Date(),
          releasedBy: userId,
          releaseReason,
          note: body.reason,
        },
      });

      await tx.bed.update({
        where: { id: activeAssignment.bedId },
        data: { status: BedStatus.available, patientId: null, assignedAt: null },
      });

      let nextAssignment = null;
      if (body.targetBedId && targetBed) {
        nextAssignment = await tx.bedAssignment.create({
          data: {
            recordId,
            bedId: body.targetBedId,
            assignedBy: userId,
            dailyRateSnapshot: targetBed.dailyRate,
            note: body.note,
          },
        });

        await tx.bed.update({
          where: { id: body.targetBedId },
          data: {
            status: BedStatus.occupied,
            patientId: activeAssignment.record.patientId,
            assignedAt: new Date(),
          },
        });
      }

      const updatedRecord = await tx.medicalRecord.update({
        where: { id: recordId },
        data: {
          bedId: body.targetBedId || null,
          version: { increment: 1 },
        },
      });

      return { previousAssignment, nextAssignment, updatedRecord };
    });

    AuditPort.logActivity('BED_ASSIGNMENT_CHANGED', userId, result.previousAssignment.id, {
      recordId,
      newBedId: body.targetBedId,
      action: body.action,
    });
    RealtimePublisher.publishEvent('inpatient', 'bed_changed', { recordId, bedId: body.targetBedId });

    return sendSuccess(
      res,
      {
        recordId,
        previousAssignment: {
          bedAssignmentId: result.previousAssignment.id,
          releaseReason: result.previousAssignment.releaseReason,
          releasedAt: toVNISOString(result.previousAssignment.releasedAt),
        },
        nextAssignment: result.nextAssignment
          ? {
              bedAssignmentId: result.nextAssignment.id,
              bedId: result.nextAssignment.bedId,
              assignedAt: toVNISOString(result.nextAssignment.assignedAt),
            }
          : null,
        recordVersion: result.updatedRecord.version,
      },
      201
    );
  }

  // 4. POST /api/v1/medical-records/:recordId/discharge-summaries
  static async signDischargeSummary(req: Request, res: Response) {
    const recordId = req.params.recordId || (req.body as { recordId?: string }).recordId || '';
    const body = signDischargeSummarySchema.parse(req.body);
    const doctorUserId = req.user?.id || 'usr-doc-01';

    const record = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new AppError(404, 'RECORD_NOT_FOUND', 'Hồ sơ bệnh án không tồn tại');
    }
    if (record.treatmentType !== TreatmentType.inpatient) {
      throw new AppError(400, 'RECORD_NOT_INPATIENT', 'Chỉ ký giấy ra viện cho bệnh nhân nội trú');
    }

    const summary = await prisma.dischargeSummary.upsert({
      where: { recordId },
      create: {
        recordId,
        signedBy: doctorUserId,
        dischargeDiagnosis: body.dischargeDiagnosis,
        treatmentSummary: body.treatmentSummary,
        dischargeCondition: body.dischargeCondition as DischargeCondition,
        icd10: body.icd10,
        doctorAdvice: body.doctorAdvice,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        signedAt: new Date(),
      },
      update: {
        signedBy: doctorUserId,
        dischargeDiagnosis: body.dischargeDiagnosis,
        treatmentSummary: body.treatmentSummary,
        dischargeCondition: body.dischargeCondition as DischargeCondition,
        icd10: body.icd10,
        doctorAdvice: body.doctorAdvice,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        signedAt: new Date(),
      },
    });

    AuditPort.logActivity('DISCHARGE_SUMMARY_SIGNED', doctorUserId, summary.id, { recordId });
    RealtimePublisher.publishEvent('inpatient', 'discharge_summary_signed', { recordId });

    return sendSuccess(
      res,
      {
        dischargeSummaryId: summary.id,
        recordId: summary.recordId,
        dischargeDiagnosis: summary.dischargeDiagnosis,
        treatmentSummary: summary.treatmentSummary,
        dischargeCondition: summary.dischargeCondition,
        icd10: summary.icd10,
        doctorAdvice: summary.doctorAdvice,
        followUpDate: toVNISOString(summary.followUpDate),
        signedAt: toVNISOString(summary.signedAt),
      },
      201
    );
  }

  // 5. POST /api/v1/medical-records/:recordId/discharges
  static async processDischarge(req: Request, res: Response) {
    const recordId = req.params.recordId || (req.body as { recordId?: string }).recordId || '';
    const body = dischargePatientSchema.parse(req.body);
    const releasedBy = req.user?.id || 'usr-nurse-01';

    const record = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new AppError(404, 'RECORD_NOT_FOUND', 'Hồ sơ bệnh án không tồn tại');
    }
    if (record.version !== body.expectedRecordVersion) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác');
    }

    const assignment = await prisma.bedAssignment.findFirst({
      where: { recordId, releasedAt: null },
    });
    if (!assignment) {
      throw new AppError(409, 'BED_RELEASE_CONFLICT', 'Không tìm thấy giường đang nằm để giải phóng');
    }

    const summary = await prisma.dischargeSummary.findUnique({
      where: { recordId },
    });
    if (!summary || !summary.signedAt) {
      throw new AppError(
        400,
        'DISCHARGE_SUMMARY_REQUIRED',
        'Cần có giấy ra viện đã ký trước khi làm thủ tục xuất viện'
      );
    }

    const canFinalize = await BillingSettlementPort.canFinalizeRecord(recordId);
    if (!canFinalize) {
      throw new AppError(400, 'UNPAID_INVOICE', 'Chưa thanh toán viện phí, không thể xuất viện');
    }

    const result = await prisma.$transaction(async (tx) => {
      const releasedAssignment = await tx.bedAssignment.update({
        where: { id: assignment.id },
        data: {
          releasedAt: new Date(),
          releasedBy,
          releaseReason: 'discharge',
        },
      });

      await tx.bed.update({
        where: { id: assignment.bedId },
        data: { status: BedStatus.available, patientId: null, assignedAt: null },
      });

      const updatedRecord = await tx.medicalRecord.update({
        where: { id: recordId },
        data: {
          status: MedicalRecordStatus.closed,
          bedId: null,
          closedAt: new Date(),
          closedBy: releasedBy,
          closeSignatureMethod: 'dev_e_confirmation',
          version: { increment: 1 },
        },
      });

      return { releasedAssignment, updatedRecord };
    });

    AuditPort.logActivity('PATIENT_DISCHARGED', releasedBy, result.releasedAssignment.id, { recordId });
    RealtimePublisher.publishEvent('inpatient', 'patient_discharged', { assignmentId: assignment.id, recordId });

    return sendSuccess(res, {
      recordId,
      recordStatus: 'closed',
      closedAt: toVNISOString(result.updatedRecord.closedAt),
      bedAssignment: {
        bedAssignmentId: result.releasedAssignment.id,
        releasedAt: toVNISOString(result.releasedAssignment.releasedAt),
        releaseReason: 'discharge',
      },
      bed: {
        bedId: assignment.bedId,
        status: 'available',
      },
    });
  }

  // 6. GET /api/v1/treatment-orders
  static async listOrders(req: Request, res: Response) {
    const recordId = req.query.recordId as string | undefined;
    const bedId = req.query.bedId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const status = req.query.status as TreatmentOrderStatus | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize as string, 10) || 20);

    let effectiveDepartmentId = departmentId;
    if (!recordId && !bedId && !effectiveDepartmentId) {
      effectiveDepartmentId = req.user?.departmentId;
    }
    if (!recordId && !bedId && !effectiveDepartmentId) {
      throw new AppError(400, 'ORDER_SCOPE_REQUIRED', 'Cần ít nhất một trong recordId, bedId hoặc departmentId');
    }

    const where: Prisma.TreatmentOrderWhereInput = {};
    if (recordId) where.recordId = recordId;
    if (status) where.status = status;
    if (bedId || effectiveDepartmentId) {
      where.record = {
        ...(bedId ? { bedId } : {}),
        ...(effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {}),
      };
    }

    const orders = await prisma.treatmentOrder.findMany({
      where,
      include: {
        record: {
          include: {
            patient: true,
            bed: { include: { room: true } },
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = orders.map((o) => ({
      treatmentOrderId: o.id,
      recordId: o.recordId,
      orderType: o.orderType,
      content: o.content,
      note: o.note || null,
      status: o.status,
      orderedBy: o.orderedBy,
      orderedAt: toVNISOString(o.orderedAt),
      executedBy: o.executedBy,
      executedAt: toVNISOString(o.executedAt),
      cancelledBy: o.cancelledBy,
      cancelledAt: toVNISOString(o.cancelledAt),
      cancelReason: o.cancelReason || null,
      patientName: o.record.patient.fullName,
      roomLabel: o.record.bed ? `${o.record.bed.room.name}-${o.record.bed.number}` : 'No Bed',
    }));

    return sendSuccess(res, items);
  }

  // 7. POST /api/v1/medical-records/:recordId/treatment-orders
  static async createOrder(req: Request, res: Response) {
    const recordId = req.params.recordId || '';
    const body = createOrderSchema.parse(req.body);
    const orderedBy = req.user?.id || 'usr-doc-01';

    const record = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new AppError(404, 'RECORD_NOT_FOUND', 'Hồ sơ bệnh án không tồn tại');
    }
    if (record.treatmentType !== TreatmentType.inpatient) {
      throw new AppError(400, 'RECORD_NOT_INPATIENT', 'Hồ sơ không phải điều trị nội trú');
    }
    if (record.status === MedicalRecordStatus.closed) {
      throw new AppError(400, 'RECORD_ALREADY_CLOSED', 'Hồ sơ bệnh án đã đóng');
    }

    const order = await prisma.treatmentOrder.create({
      data: {
        recordId,
        orderType: body.orderType,
        content: body.content,
        note: body.note,
        orderedBy,
        status: TreatmentOrderStatus.active,
      },
    });

    AuditPort.logActivity('ORDER_CREATED', orderedBy, order.id, { recordId, orderType: body.orderType });
    RealtimePublisher.publishEvent('inpatient', 'order_created', { orderId: order.id });

    return sendSuccess(
      res,
      {
        treatmentOrderId: order.id,
        recordId,
        orderType: order.orderType,
        status: 'active',
        orderedAt: toVNISOString(order.orderedAt),
      },
      201
    );
  }

  // 8. POST /api/v1/treatment-orders/:treatmentOrderId/complete
  static async completeTreatmentOrder(req: Request, res: Response) {
    const treatmentOrderId = req.params.treatmentOrderId || req.params.id || '';
    const body = completeOrderSchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const order = await prisma.treatmentOrder.findUnique({ where: { id: treatmentOrderId } });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Y lệnh không tồn tại');
    }
    if (order.status !== TreatmentOrderStatus.active) {
      throw new AppError(
        409,
        'INVALID_TREATMENT_ORDER_TRANSITION',
        'Chỉ có thể hoàn thành y lệnh đang ở trạng thái active'
      );
    }

    const executedAt = body.executedAt ? new Date(body.executedAt) : new Date();

    const updated = await prisma.treatmentOrder.update({
      where: { id: treatmentOrderId },
      data: {
        status: TreatmentOrderStatus.done,
        executedBy: userId,
        executedAt,
        note: body.note || order.note,
      },
    });

    AuditPort.logActivity('ORDER_COMPLETED', userId, updated.id, { treatmentOrderId });
    RealtimePublisher.publishEvent('inpatient', 'order_completed', { orderId: updated.id });

    return sendSuccess(res, {
      treatmentOrderId: updated.id,
      status: 'done',
      executedBy: userId,
      executedAt: toVNISOString(updated.executedAt),
    });
  }

  // 9. PUT /api/v1/treatment-orders/:id/status
  static async updateOrderStatus(req: Request, res: Response) {
    const { id } = req.params;
    const body = updateOrderStatusSchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const order = await prisma.treatmentOrder.findUnique({ where: { id } });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Y lệnh không tồn tại');
    if (order.status !== TreatmentOrderStatus.active) {
      throw new AppError(400, 'ORDER_LOCKED', 'Chỉ có thể cập nhật y lệnh đang active');
    }

    const updated = await prisma.treatmentOrder.update({
      where: { id },
      data: {
        status: body.status as TreatmentOrderStatus,
        ...(body.status === TreatmentOrderStatus.done
          ? {
              executedBy: userId,
              executedAt: new Date(),
            }
          : {
              cancelledBy: userId,
              cancelledAt: new Date(),
              cancelReason: body.cancelReason,
            }),
      },
    });

    AuditPort.logActivity('ORDER_STATUS_UPDATED', userId, updated.id, { status: body.status });
    RealtimePublisher.publishEvent('inpatient', 'order_updated', { orderId: updated.id, status: body.status });

    return sendSuccess(res, updated);
  }

  // 10. POST /api/v1/treatment-orders/:treatmentOrderId/cancel
  static async cancelTreatmentOrder(req: Request, res: Response) {
    const treatmentOrderId = req.params.treatmentOrderId || req.params.id || '';
    const body = cancelOrderSchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const order = await prisma.treatmentOrder.findUnique({ where: { id: treatmentOrderId } });
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Y lệnh không tồn tại');
    }

    if (order.status === TreatmentOrderStatus.done || order.status === TreatmentOrderStatus.cancelled) {
      throw new AppError(
        409,
        'INVALID_TREATMENT_ORDER_TRANSITION',
        'Không thể hủy y lệnh đã hoàn thành hoặc đã hủy'
      );
    }

    const updated = await prisma.treatmentOrder.update({
      where: { id: treatmentOrderId },
      data: {
        status: TreatmentOrderStatus.cancelled,
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancelReason: body.cancelReason,
      },
    });

    AuditPort.logActivity('ORDER_CANCELLED', userId, updated.id, { cancelReason: body.cancelReason });
    RealtimePublisher.publishEvent('inpatient', 'order_cancelled', { orderId: updated.id });

    return sendSuccess(res, {
      treatmentOrderId: updated.id,
      status: 'cancelled',
      cancelledAt: toVNISOString(updated.cancelledAt),
    });
  }
}
