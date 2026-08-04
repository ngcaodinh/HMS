import { randomUUID } from 'node:crypto';

import { AppError } from '../../../core/errors/app-error';
import { prisma } from '../../../core/db/prisma-client';
import type { VitalSignsInput } from '../types/medical-record.types';

/** Canonical write for vital signs (Gate G3) — `medical_records.vitalSigns` is only a snapshot. */
/** Ghi log và cập nhật snapshot sinh hiệu cùng transaction cho các luồng không có assessment. */
export function createVitalSignLogAndSnapshot(
  recordId: string,
  recordedBy: string,
  input: VitalSignsInput,
) {
  return prisma.$transaction(async (tx) => {
    // Khóa cùng điều kiện trạng thái trước khi ghi log để request đang bay không ghi thêm
    // dữ liệu sau khi hồ sơ đã đóng.
    const recordUpdate = await tx.medicalRecord.updateMany({
      where: { id: recordId, deletedAt: null, status: { not: 'closed' } },
      data: {
        vitalSigns: {
          pulse: input.pulse,
          temperatureC: input.temperatureC ?? null,
          bloodPressureSystolic: input.bloodPressureSystolic,
          bloodPressureDiastolic: input.bloodPressureDiastolic,
          respiratoryRate: input.respiratoryRate ?? null,
          spo2: input.spo2,
          weightKg: input.weightKg ?? null,
        },
        vitalConfirmedBy: recordedBy,
        vitalConfirmedAt: new Date(),
      },
    });
    if (recordUpdate.count !== 1) {
      throw AppError.badRequest(
        'RECORD_ALREADY_CLOSED',
        'Hồ sơ khám đã đóng hoặc không còn tồn tại.',
      );
    }

    const log = await tx.vitalSignLog.create({
      data: {
        id: randomUUID(),
        recordId,
        recordedBy,
        pulse: input.pulse,
        temperatureC: input.temperatureC,
        bloodPressureSystolic: input.bloodPressureSystolic,
        bloodPressureDiastolic: input.bloodPressureDiastolic,
        respiratoryRate: input.respiratoryRate,
        spo2: input.spo2,
        weightKg: input.weightKg,
        treatmentOrderId: input.treatmentOrderId,
        measuredAt: input.measuredAt ? new Date(input.measuredAt) : undefined,
        note: input.note,
      },
    });
    return log;
  });
}
