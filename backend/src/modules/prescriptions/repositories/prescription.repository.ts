import { randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { AppError } from '../../../core/errors/app-error';
import { prisma } from '../../../core/db/prisma-client';
import { allocateFefoBatches } from '../domain/fefo-allocation';

export function findRecordForPrescription(recordId: string) {
  return prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: { patient: true },
  });
}

export function findActiveMedicinesByIds(medicineIds: string[]) {
  return prisma.medicine.findMany({ where: { id: { in: medicineIds }, isActive: true } });
}

export function findLatestPrescriptionForRecord(recordId: string) {
  return prisma.prescription.findFirst({
    where: { recordId, status: { not: 'cancelled' } },
    include: { prescriptionItems: true },
    orderBy: { roundNumber: 'desc' },
  });
}

export function findNextRoundNumber(recordId: string) {
  return prisma.prescription
    .findFirst({ where: { recordId }, orderBy: { roundNumber: 'desc' } })
    .then((last) => (last?.roundNumber ?? 0) + 1);
}

interface ItemToCreate {
  medicineId: string;
  medicineNameSnapshot: string;
  activeIngredientSnapshot: string | null;
  dosageSnapshot: string | null;
  quantity: number;
  days: number;
  dosePerUse: string;
  usesPerDay?: number;
  useTiming: string;
  dosageInstruction: string;
  longTermReason?: string;
  unitPrice: string;
  total: string;
}

export async function createDraftPrescription(
  recordId: string,
  prescribedBy: string,
  roundNumber: number,
  prescriptionType: 'C' | 'N' | 'H',
  expectedRecordVersion: number,
  items: ItemToCreate[],
  allergyOverrideReason: string | undefined,
) {
  return prisma.$transaction(async (tx) => {
    // Tăng version hồ sơ cùng transaction với draft để đổi treatmentType không thể
    // ghi đè một request kê đơn đang chạy đồng thời.
    const recordUpdate = await tx.medicalRecord.updateMany({
      where: {
        id: recordId,
        doctorId: prescribedBy,
        version: expectedRecordVersion,
        deletedAt: null,
        status: 'diagnosed',
        treatmentType: 'outpatient',
      },
      data: { version: { increment: 1 } },
    });
    if (recordUpdate.count !== 1) {
      throw AppError.conflict('VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác.');
    }

    const existingCount = await tx.prescription.count();
    const prescriptionCode = `RX-${new Date().getFullYear()}-${String(existingCount + 1).padStart(4, '0')}`;

    const prescription = await tx.prescription.create({
      data: {
        id: randomUUID(),
        recordId,
        prescriptionCode,
        prescribedBy,
        roundNumber,
        prescriptionType,
        status: 'draft',
        allergyOverrideReason,
        allergyOverrideBy: allergyOverrideReason ? prescribedBy : undefined,
        allergyOverrideAt: allergyOverrideReason ? new Date() : undefined,
      },
    });

    const createdItems = [];
    for (const item of items) {
      const created = await tx.prescriptionItem.create({
        data: { id: randomUUID(), prescriptionId: prescription.id, ...item },
      });
      createdItems.push(created);
    }

    return { prescription, items: createdItems };
  });
}

export function findPrescriptionById(prescriptionId: string) {
  return prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      prescriptionItems: true,
      medicalRecord: { include: { patient: true, doctor: true } },
    },
  });
}

export type PrescriptionWithDetails = NonNullable<Awaited<ReturnType<typeof findPrescriptionById>>>;

export async function signPrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  signedBy: string,
  allergyOverrideReason: string | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findFirst({
      where: { id: prescriptionId, version: expectedVersion, status: 'draft' },
      include: { prescriptionItems: true },
    });
    if (!prescription) return null;

    // Khóa logic hồ sơ trong cùng transaction với việc ký để không thể ký draft
    // sau khi một request đồng thời đã chuyển hồ sơ sang nội trú hoặc đóng hồ sơ.
    const recordGuard = await tx.medicalRecord.updateMany({
      where: {
        id: prescription.recordId,
        doctorId: signedBy,
        deletedAt: null,
        status: 'diagnosed',
        treatmentType: 'outpatient',
      },
      data: { version: { increment: 1 } },
    });
    if (recordGuard.count !== 1) {
      throw AppError.badRequest(
        'RECORD_NOT_OUTPATIENT',
        'Hồ sơ chưa chẩn đoán hướng ngoại trú hoặc đã đóng.',
      );
    }

    const inventoryItems = prescription.prescriptionItems.map((item) => {
      if (!item.medicineId) {
        throw AppError.badRequest(
          'INVALID_PRESCRIPTION',
          'Dòng đơn thuốc thiếu mã thuốc để trừ tồn FEFO.',
        );
      }
      return {
        medicineId: item.medicineId,
        prescriptionItemId: item.id,
        quantity: item.quantity,
      };
    });

    if (inventoryItems.length > 0) {
      const medicineIds = [...new Set(inventoryItems.map((item) => item.medicineId))];
      const batches = await tx.medicineBatch.findMany({
        where: {
          isActive: true,
          medicineId: { in: medicineIds },
          quantity: { gt: 0 },
        },
        orderBy: [{ expiryDate: 'asc' }, { batchNumber: 'asc' }],
      });

      const allocations = allocateFefoBatches({
        items: inventoryItems,
        batches: batches.map((batch) => ({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          medicineId: batch.medicineId,
          quantity: batch.quantity,
        })),
      });

      const batchById = new Map(batches.map((batch) => [batch.id, batch]));
      for (const allocation of allocations) {
        const batch = batchById.get(allocation.batchId);
        if (!batch) {
          throw AppError.conflict('INVENTORY_CHANGED', 'Lô thuốc đã thay đổi trong lúc ký đơn.');
        }

        const updateResult = await tx.medicineBatch.updateMany({
          where: { id: allocation.batchId, quantity: { gte: allocation.quantity } },
          data: { quantity: { decrement: allocation.quantity }, version: { increment: 1 } },
        });
        if (updateResult.count !== 1) {
          throw AppError.conflict('INVENTORY_CHANGED', 'Tồn kho đã thay đổi trong lúc ký đơn.');
        }

        const updatedBatch = await tx.medicineBatch.findUniqueOrThrow({
          where: { id: allocation.batchId },
        });
        await tx.stockMovement.create({
          data: {
            id: randomUUID(),
            warehouseId: batch.warehouseId,
            medicineId: allocation.medicineId,
            batchId: allocation.batchId,
            prescriptionId,
            prescriptionItemId: allocation.prescriptionItemId,
            quantityChange: -allocation.quantity,
            balanceAfter: updatedBatch.quantity,
            movementType: 'prescription_sign',
            actorUserId: signedBy,
            referenceType: 'prescription',
            referenceId: prescriptionId,
          },
        });
      }
    }

    const result = await tx.prescription.updateMany({
      where: { id: prescriptionId, version: expectedVersion, status: 'draft' },
      data: {
        status: 'active',
        isSigned: true,
        signedBy,
        signedAt: new Date(),
        signatureMethod: 'dev_e_confirmation',
        ...(allergyOverrideReason
          ? { allergyOverrideReason, allergyOverrideBy: signedBy, allergyOverrideAt: new Date() }
          : {}),
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) {
      throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');
    }

    return tx.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
  });
}

export async function cancelPrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  cancelledBy: string,
  cancelReason: string,
) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findFirst({
      where: { id: prescriptionId, version: expectedVersion, status: { not: 'cancelled' } },
    });
    if (!prescription) return null;
    if (prescription.dispensedAt) {
      throw AppError.conflict(
        'PRESCRIPTION_ALREADY_DISPENSED',
        'Đơn thuốc đã cấp phát, không thể hủy.',
      );
    }

    const signedMovements = await tx.stockMovement.findMany({
      where: { prescriptionId, movementType: 'prescription_sign', quantityChange: { lt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    for (const movement of signedMovements) {
      const restoredQuantity = Math.abs(movement.quantityChange);
      await tx.medicineBatch.update({
        where: { id: movement.batchId },
        data: { quantity: { increment: restoredQuantity }, version: { increment: 1 } },
      });
      const updatedBatch = await tx.medicineBatch.findUniqueOrThrow({
        where: { id: movement.batchId },
      });
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          warehouseId: movement.warehouseId,
          medicineId: movement.medicineId,
          batchId: movement.batchId,
          prescriptionId,
          prescriptionItemId: movement.prescriptionItemId,
          quantityChange: restoredQuantity,
          balanceAfter: updatedBatch.quantity,
          movementType: 'prescription_cancel',
          actorUserId: cancelledBy,
          referenceType: 'prescription',
          referenceId: prescriptionId,
        },
      });
    }

    const result = await tx.prescription.updateMany({
      where: { id: prescriptionId, version: expectedVersion, status: { not: 'cancelled' } },
      data: {
        status: 'cancelled',
        cancelledBy,
        cancelledAt: new Date(),
        cancelReason,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) {
      throw AppError.conflict('VERSION_CONFLICT', 'Đơn thuốc đã bị thay đổi bởi thao tác khác.');
    }
    return tx.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
  });
}

export async function markXmlExportedTx(
  prescriptionId: string,
  expectedVersion: number,
  xmlFilePath: string,
) {
  const result = await prisma.prescription.updateMany({
    where: { id: prescriptionId, version: expectedVersion, status: 'active' },
    data: {
      status: 'xml_exported',
      xmlExportedAt: new Date(),
      xmlFilePath,
      version: { increment: 1 },
    },
  });
  if (result.count !== 1) return null;
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}

const dispensableInclude = Prisma.validator<Prisma.PrescriptionInclude>()({
  prescriptionItems: true,
  stockMovements: {
    where: { movementType: 'prescription_sign' },
    include: {
      batch: true,
      warehouse: true,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  medicalRecord: {
    include: {
      patient: true,
      department: true,
      doctor: true,
    },
  },
});

export function findDispensablePrescriptions(filters: {
  keyword?: string;
  dispensed: boolean;
  page: number;
  pageSize: number;
  warehouseId?: string;
}) {
  const where: Prisma.PrescriptionWhereInput = {
    status: { in: ['active', 'xml_exported'] },
    dispensedAt: filters.dispensed ? { not: null } : null,
    ...(filters.warehouseId
      ? {
          stockMovements: {
            some: { movementType: 'prescription_sign', warehouseId: filters.warehouseId },
          },
        }
      : {}),
    ...(filters.keyword
      ? {
          OR: [
            { prescriptionCode: { contains: filters.keyword } },
            { medicalRecord: { patient: { fullName: { contains: filters.keyword } } } },
            { medicalRecord: { patient: { patientCode: { contains: filters.keyword } } } },
          ],
        }
      : {}),
  };

  return Promise.all([
    prisma.prescription.findMany({
      where,
      include: dispensableInclude,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.prescription.count({ where }),
  ]);
}

export type DispensablePrescription = Awaited<
  ReturnType<typeof findDispensablePrescriptions>
>[0][number];

export async function dispensePrescriptionTx(
  prescriptionId: string,
  expectedVersion: number,
  dispensedBy: string,
) {
  const result = await prisma.prescription.updateMany({
    where: {
      id: prescriptionId,
      version: expectedVersion,
      status: { in: ['active', 'xml_exported'] },
      dispensedAt: null,
    },
    data: { dispensedBy, dispensedAt: new Date(), version: { increment: 1 } },
  });
  if (result.count !== 1) return null;
  return prisma.prescription.findUniqueOrThrow({ where: { id: prescriptionId } });
}

/** Đọc kết quả command đã lưu để dispense không bị ghi nhận hai lần khi client retry cùng key. */
export function findIdempotencyResult<T>(key: string, route: string): Promise<T | null> {
  return prisma.idempotencyRequest.findUnique({ where: { key } }).then((cached) => {
    if (!cached) return null;
    if (cached.route !== route) {
      throw AppError.conflict(
        'IDEMPOTENCY_KEY_REUSED',
        'Idempotency-Key đã được dùng cho thao tác khác.',
      );
    }
    return cached.responseJson as T;
  });
}

/** Lưu envelope nghiệp vụ đã thành công để các lần retry cùng Idempotency-Key trả lại cùng kết quả. */
export function saveIdempotencyResult(input: {
  key: string;
  route: string;
  statusCode: number;
  responseJson: Prisma.InputJsonValue;
}) {
  return prisma.idempotencyRequest.create({
    data: {
      id: randomUUID(),
      key: input.key,
      route: input.route,
      statusCode: input.statusCode,
      responseJson: input.responseJson,
    },
  });
}
