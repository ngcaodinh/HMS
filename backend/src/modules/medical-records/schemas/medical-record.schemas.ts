import { z } from 'zod';

export const worklistQuerySchema = z.object({
  status: z.enum(['open', 'waiting_results', 'diagnosed', 'closed']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const recordIdParamsSchema = z.object({
  recordId: z.string().min(1),
});

export const icd10QuerySchema = z.object({
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keyword: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const recordVitalSignsSchema = z.object({
  pulse: z.number().int().min(1).max(300),
  temperatureC: z.number().min(25).max(45).optional(),
  bloodPressureSystolic: z.number().int().min(1).max(300),
  bloodPressureDiastolic: z.number().int().min(1).max(200),
  respiratoryRate: z.number().int().optional(),
  spo2: z.number().min(0).max(100),
  weightKg: z.number().positive().optional(),
  treatmentOrderId: z.string().optional(),
  measuredAt: z.string().datetime({ offset: true }).optional(),
  note: z.string().max(500).optional(),
});

export const updateClinicalAssessmentSchema = z.object({
  expectedVersion: z.number().int().positive(),
  chiefComplaint: z.string().max(500).optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  skinLesionTypes: z.array(z.string()).optional(),
  skinLesionDescription: z.string().optional(),
  skinLesionLocation: z.string().max(500).optional(),
  skinLesionDistribution: z
    .enum(['localized', 'scattered', 'generalized', 'symmetric', 'dermatomal', 'flexural'])
    .optional(),
  bodySurfaceAreaPercent: z.number().min(0).max(100).optional(),
  itchSeverity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
  notes: z.string().optional(),
});

export const orderLabTestsSchema = z.object({
  expectedRecordVersion: z.number().int().positive(),
  items: z
    .array(
      z.object({
        labTestTypeId: z.string().min(1),
        isUrgent: z.boolean().optional(),
        specimenType: z.string().max(100).optional(),
        method: z.string().max(255).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const diagnoseRecordSchema = z.object({
  expectedVersion: z.number().int().positive(),
  icd10: z.string().min(1).max(10),
  diagnosisText: z.string().min(1).max(1000),
  treatmentType: z.enum(['outpatient', 'inpatient']),
  signatureConfirmation: z.literal(true),
  signatureMethod: z.literal('dev_e_confirmation'),
});
