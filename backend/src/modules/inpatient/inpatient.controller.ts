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
import crypto from 'crypto';
import {
  assignBedSchema,
  changeBedAssignmentSchema,
  signDischargeSummarySchema,
  dischargePatientSchema,
  createOrderSchema,
  completeOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  recordVitalSignsSchema,
  standardizeEmergencyIdentitySchema,
} from './schemas/inpatient.schema';

const prisma = new PrismaClient();

/**
 * Chuẩn hóa tên khoa để ghép các bản ghi danh mục cũ/mới cùng chuyên khoa.
 */
const normalizeDepartmentName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Trả về phạm vi khoa tương đương, chỉ mở rộng trong cùng loại khoa và cùng tên đã chuẩn hóa.
 */
const resolveEquivalentDepartmentIds = async (departmentId?: string) => {
  if (!departmentId) return [];

  const department = await prisma.department.findUnique({
    select: {
      id: true,
      name: true,
      type: true,
    },
    where: {
      id: departmentId,
    },
  });

  if (!department) return [departmentId];

  const normalizedName = normalizeDepartmentName(department.name);
  if (!normalizedName) return [department.id];

  const equivalentDepartments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
      type: department.type,
    },
  });

  const equivalentIds = equivalentDepartments
    .filter((item) => normalizeDepartmentName(item.name) === normalizedName)
    .map((item) => item.id);

  return Array.from(new Set([department.id, ...equivalentIds]));
};

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
    const departmentScopeIds = await resolveEquivalentDepartmentIds(effectiveDepartmentId);

    const where: Prisma.TreatmentOrderWhereInput = {};
    if (recordId) where.recordId = recordId;
    if (status) where.status = status;
    if (bedId || departmentScopeIds.length > 0) {
      where.record = {
        ...(bedId ? { bedId } : {}),
        ...(departmentScopeIds.length > 0 ? { departmentId: { in: departmentScopeIds } } : {}),
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
      hasAllergyWarning: o.orderType === 'medication' && !!o.record.patient.allergies?.trim(),
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

  // 11. GET /api/v1/inpatient/vitals-queue
  static async listVitalsQueue(req: Request, res: Response) {
    const departmentId = (req.query.departmentId as string | undefined) || req.user?.departmentId;
    const departmentScopeIds = await resolveEquivalentDepartmentIds(departmentId);

    // Clinical worklist - medical_records where vitalConfirmedAt IS NULL
    const worklistRecords = await prisma.medicalRecord.findMany({
      where: {
        vitalConfirmedAt: null,
        status: { not: MedicalRecordStatus.closed },
        ...(departmentScopeIds.length > 0 ? { departmentId: { in: departmentScopeIds } } : {}),
      },
      include: { patient: true },
      orderBy: { createdAt: 'asc' },
    });

    const worklist = worklistRecords.map((r) => {
      const vs = r.vitalSigns as Record<string, unknown> | null;
      const allergies = typeof vs?.allergies === 'string' ? vs.allergies : null;
      return {
        recordId: r.id,
        recordCode: r.recordCode,
        patientName: r.patient.fullName,
        age: new Date().getFullYear() - (r.patient.dateOfBirth?.getFullYear() || 0),
        gender: r.patient.gender === 'male' ? 'Nam' : 'Nữ',
        diagnosis: r.diagnosisText || null,
        allergies,
        version: r.version,
        createdAt: toVNISOString(r.createdAt),
      };
    });

    // Ticket queue today - raw SQL on queue_tickets
    const tickets = await prisma.$queryRaw<
      Array<{ id: string; number: number; status: string; calledAt: Date | null }>
    >`
      SELECT id, number, status, calledAt FROM queue_tickets
      WHERE date = CURDATE() AND status IN ('waiting', 'called')
      ORDER BY number ASC
    `;

    const currentCalledRaw = tickets.find((t) => t.status === 'called') || null;
    const currentCalled = currentCalledRaw
      ? {
          id: currentCalledRaw.id,
          number: currentCalledRaw.number,
          calledAt: toVNISOString(currentCalledRaw.calledAt),
        }
      : null;

    const waitingTickets = tickets.filter((t) => t.status === 'waiting');
    const waitingCount = waitingTickets.length;
    const waitingNumbers = waitingTickets.map((t) => t.number);

    // Stats calculations from medical_records measured today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const measuredTodayRecords = await prisma.medicalRecord.findMany({
      where: {
        vitalConfirmedAt: { gte: todayStart },
        ...(departmentScopeIds.length > 0 ? { departmentId: { in: departmentScopeIds } } : {}),
      },
      select: {
        createdAt: true,
        vitalConfirmedAt: true,
        vitalSigns: true,
      },
    });

    const measuredYesterdayCount = await prisma.medicalRecord.count({
      where: {
        vitalConfirmedAt: { gte: yesterdayStart, lt: todayStart },
        ...(departmentScopeIds.length > 0 ? { departmentId: { in: departmentScopeIds } } : {}),
      },
    });

    const measuredTodayCount = measuredTodayRecords.length;
    const measuredTodayDelta = measuredTodayCount - measuredYesterdayCount;

    let allergyAlertTodayCount = 0;
    let totalMinutes = 0;

    for (const r of measuredTodayRecords) {
      const vs = r.vitalSigns as Record<string, unknown> | null;
      const allergiesStr = typeof vs?.allergies === 'string' ? vs.allergies : '';
      if (allergiesStr.trim().length > 0) {
        allergyAlertTodayCount++;
      }
      if (r.vitalConfirmedAt && r.createdAt) {
        const diffMs = r.vitalConfirmedAt.getTime() - r.createdAt.getTime();
        totalMinutes += diffMs / (1000 * 60);
      }
    }

    const avgMinutesPerPatient =
      measuredTodayCount > 0 ? Math.round(totalMinutes / measuredTodayCount) : 0;

    return sendSuccess(res, {
      worklist,
      ticketQueue: {
        currentCalled,
        waitingCount,
        waitingNumbers,
      },
      stats: {
        measuredTodayCount,
        measuredTodayDelta,
        waitingCount: worklist.length,
        allergyAlertTodayCount,
        avgMinutesPerPatient,
      },
    });
  }

  // 12. POST /api/v1/inpatient/queue-tickets/call-next
  static async callNextQueueTicket(req: Request, res: Response) {
    const userId = req.user?.id || 'usr-nurse-01';

    const result = await prisma.$transaction(async (tx) => {
      const [next] = await tx.$queryRaw<Array<{ id: string; number: number }>>`
        SELECT id, number FROM queue_tickets
        WHERE date = CURDATE() AND status = 'waiting'
        ORDER BY number ASC
        LIMIT 1
        FOR UPDATE
      `;
      if (!next) {
        throw new AppError(404, 'NO_WAITING_TICKET', 'Không còn số nào đang chờ gọi');
      }

      const affected = await tx.$executeRaw`
        UPDATE queue_tickets SET status = 'called', calledAt = NOW(3)
        WHERE id = ${next.id} AND status = 'waiting'
      `;
      if (affected === 0) {
        throw new AppError(409, 'TICKET_ALREADY_CALLED', 'Số này vừa được điều dưỡng khác gọi');
      }

      const [ticket] = await tx.$queryRaw<Array<{ id: string; number: number; calledAt: Date }>>`
        SELECT id, number, calledAt FROM queue_tickets WHERE id = ${next.id}
      `;
      if (!ticket) {
        throw new AppError(404, 'TICKET_NOT_FOUND', 'Không tìm thấy thông tin số thứ tự');
      }
      return ticket;
    });

    AuditPort.logActivity('QUEUE_TICKET_CALLED', userId, result.id, { number: result.number });
    RealtimePublisher.publishEvent('inpatient', 'queue_ticket_called', { ticketId: result.id, number: result.number });

    return sendSuccess(res, { ticketId: result.id, number: result.number, calledAt: toVNISOString(result.calledAt) });
  }

  // 13. POST /api/v1/inpatient/queue-tickets/:id/recall
  static async recallQueueTicket(req: Request, res: Response) {
    const id = req.params.id || '';
    const userId = req.user?.id || 'usr-nurse-01';

    const affected = await prisma.$executeRaw`
      UPDATE queue_tickets SET calledAt = NOW(3) WHERE id = ${id} AND status = 'called'
    `;
    if (affected === 0) {
      throw new AppError(409, 'TICKET_NOT_CALLED', 'Số này không ở trạng thái đang gọi, không thể gọi lại');
    }

    const [ticket] = await prisma.$queryRaw<Array<{ id: string; number: number; calledAt: Date }>>`
      SELECT id, number, calledAt FROM queue_tickets WHERE id = ${id}
    `;

    if (!ticket) {
      throw new AppError(404, 'TICKET_NOT_FOUND', 'Không tìm thấy thông tin số thứ tự');
    }

    AuditPort.logActivity('QUEUE_TICKET_RECALLED', userId, id, { number: ticket.number });
    RealtimePublisher.publishEvent('inpatient', 'queue_ticket_recalled', { ticketId: id, number: ticket.number });

    return sendSuccess(res, { ticketId: ticket.id, number: ticket.number, calledAt: toVNISOString(ticket.calledAt) });
  }

  // 14. POST /api/v1/medical-records/:recordId/vital-signs
  static async recordVitalSigns(req: Request, res: Response) {
    const recordId = req.params.recordId || '';
    const body = recordVitalSignsSchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.findUnique({ where: { id: recordId } });
      if (!record) throw new AppError(404, 'RECORD_NOT_FOUND', 'Hồ sơ bệnh án không tồn tại');
      if (record.version !== body.expectedRecordVersion) {
        throw new AppError(409, 'VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác');
      }
      if (record.vitalConfirmedAt) {
        throw new AppError(409, 'VITALS_ALREADY_RECORDED', 'Hồ sơ này đã được đo sinh hiệu');
      }

      const [ticket] = await tx.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT id, status FROM queue_tickets WHERE id = ${body.ticketId}
      `;
      if (!ticket || ticket.status !== 'called') {
        throw new AppError(409, 'TICKET_NOT_CALLED', 'Số thứ tự không ở trạng thái đang gọi, không thể lưu kết quả');
      }

      const logId = crypto.randomUUID();
      await tx.$executeRaw`
        INSERT INTO vital_sign_logs
          (id, recordId, treatmentOrderId, measuredAt, pulse, temperatureC, bloodPressureSystolic, bloodPressureDiastolic, respiratoryRate, spo2, weightKg, note, recordedBy, createdAt)
        VALUES
          (${logId}, ${recordId}, NULL, NOW(3), ${body.pulse}, ${body.temperatureC ?? null}, ${body.bloodPressureSystolic}, ${body.bloodPressureDiastolic}, ${body.respiratoryRate ?? null}, ${body.spo2}, ${body.weightKg ?? null}, NULL, ${userId}, NOW(3))
      `;

      const updatedRecord = await tx.medicalRecord.update({
        where: { id: recordId },
        data: {
          heightCm: body.heightCm ?? null,
          vitalSigns: {
            spo2: body.spo2,
            pulse: body.pulse,
            weightKg: body.weightKg ?? null,
            allergies: body.allergies || '',
            temperatureC: body.temperatureC ?? null,
            respiratoryRate: body.respiratoryRate ?? null,
            bloodPressureSystolic: body.bloodPressureSystolic,
            bloodPressureDiastolic: body.bloodPressureDiastolic,
          },
          vitalConfirmedBy: userId,
          vitalConfirmedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.$executeRaw`UPDATE queue_tickets SET status = 'served', servedAt = NOW(3) WHERE id = ${body.ticketId}`;

      return updatedRecord;
    });

    AuditPort.logActivity('VITAL_SIGNS_RECORDED', userId, recordId, { recordId, ticketId: body.ticketId });
    RealtimePublisher.publishEvent('inpatient', 'vital_signs_recorded', { recordId, ticketId: body.ticketId });

    return sendSuccess(
      res,
      {
        recordId,
        ticketId: body.ticketId,
        recordVersion: result.version,
        vitalConfirmedAt: toVNISOString(result.vitalConfirmedAt),
      },
      201
    );
  }

  // 15. GET /api/v1/inpatient/emergency-unidentified-patients
  static async listUnidentifiedEmergencyPatients(req: Request, res: Response) {
    const patients = await prisma.patient.findMany({
      where: { isEmergencyBypass: true },
      include: {
        medicalRecords: {
          where: { status: { not: MedicalRecordStatus.closed } },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: {
            bedAssignments: {
              where: { releasedAt: null },
              take: 1,
              include: { bed: { include: { room: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = patients.map((p, index) => {
      const record = p.medicalRecords[0] || null;
      const assignment = record?.bedAssignments[0] || null;

      return {
        patientId: p.id,
        sttNumber: index + 1,
        tempName: p.fullName,
        gender: p.gender,
        bedLabel: assignment?.bed.number || null,
        roomLabel: assignment?.bed.room.name || null,
        admittedAt: toVNISOString(record?.createdAt || p.createdAt),
        emergencyReason: p.emergencyReason,
      };
    });

    return sendSuccess(res, items);
  }

  // 16. POST /api/v1/patients/:patientId/emergency-identity
  static async standardizeEmergencyIdentity(req: Request, res: Response) {
    const patientId = req.params.patientId || '';
    const body = standardizeEmergencyIdentitySchema.parse(req.body);
    const userId = req.user?.id || 'usr-nurse-01';

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'Bệnh nhân không tồn tại');
    }
    if (!patient.isEmergencyBypass) {
      throw new AppError(
        400,
        'PATIENT_NOT_EMERGENCY_BYPASS',
        'Bệnh nhân này không ở trạng thái chờ chuẩn hóa danh tính cấp cứu'
      );
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        phoneNumber: body.phoneNumber,
        identityCardNumber: body.identityCardNumber,
        address: body.address,
        healthInsuranceCode: body.healthInsuranceCode,
        guardianFullName: body.guardianFullName,
        isEmergencyBypass: false,
        privacyNoticeAccepted: true,
        privacyNoticeAcceptedAt: new Date(),
      },
    });

    AuditPort.logActivity('EMERGENCY_IDENTITY_STANDARDIZED', userId, patientId, {
      patientId,
      fullName: body.fullName,
    });
    RealtimePublisher.publishEvent('inpatient', 'emergency_identity_standardized', { patientId });

    return sendSuccess(res, {
      patientId: updated.id,
      fullName: updated.fullName,
      dateOfBirth: toVNISOString(updated.dateOfBirth),
      gender: updated.gender,
      phoneNumber: updated.phoneNumber,
      identityCardNumber: updated.identityCardNumber,
      isEmergencyBypass: updated.isEmergencyBypass,
    });
  }
}
