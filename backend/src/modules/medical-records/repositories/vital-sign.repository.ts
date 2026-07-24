import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/db/prisma-client';
import type { VitalSignsInput } from '../types/medical-record.types';

/** Canonical write for vital signs (Gate G3) — `medical_records.vitalSigns` is only a snapshot. */
export function createVitalSignLog(recordId: string, recordedBy: string, input: VitalSignsInput) {
  return prisma.vital_sign_logs.create({
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
}
