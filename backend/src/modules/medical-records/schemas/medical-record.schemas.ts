import { z } from 'zod';

export const worklistQuerySchema = z.object({
  status: z.enum(['open', 'waiting_results', 'diagnosed', 'closed']).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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

export const recordVitalSignsSchema = z
  .object({
    pulse: z
      .number({ required_error: 'Vui lòng nhập mạch.', invalid_type_error: 'Mạch phải là số.' })
      .int('Mạch phải là số nguyên.')
      .min(1, 'Mạch phải lớn hơn 0.')
      .max(300, 'Mạch không được vượt quá 300 bpm.'),
    temperatureC: z
      .number({ invalid_type_error: 'Nhiệt độ phải là số.' })
      .min(25, 'Nhiệt độ phải từ 25°C trở lên.')
      .max(45, 'Nhiệt độ không được vượt quá 45°C.')
      .optional(),
    bloodPressureSystolic: z
      .number({
        required_error: 'Vui lòng nhập huyết áp tâm thu.',
        invalid_type_error: 'Huyết áp tâm thu phải là số.',
      })
      .int('Huyết áp tâm thu phải là số nguyên.')
      .min(1, 'Huyết áp tâm thu phải lớn hơn 0.')
      .max(300, 'Huyết áp tâm thu không được vượt quá 300 mmHg.'),
    bloodPressureDiastolic: z
      .number({
        required_error: 'Vui lòng nhập huyết áp tâm trương.',
        invalid_type_error: 'Huyết áp tâm trương phải là số.',
      })
      .int('Huyết áp tâm trương phải là số nguyên.')
      .min(1, 'Huyết áp tâm trương phải lớn hơn 0.')
      .max(200, 'Huyết áp tâm trương không được vượt quá 200 mmHg.'),
    respiratoryRate: z
      .number({ invalid_type_error: 'Nhịp thở phải là số.' })
      .int('Nhịp thở phải là số nguyên.')
      .optional(),
    spo2: z
      .number({ required_error: 'Vui lòng nhập SpO2.', invalid_type_error: 'SpO2 phải là số.' })
      .int('SpO2 phải là số nguyên.')
      .min(0, 'SpO2 không được nhỏ hơn 0%.')
      .max(100, 'SpO2 không được lớn hơn 100%.'),
    weightKg: z
      .number({ invalid_type_error: 'Cân nặng phải là số.' })
      .positive('Cân nặng phải lớn hơn 0kg.')
      .max(300, 'Cân nặng tối đa 300kg.')
      .optional(),
    treatmentOrderId: z.string().min(1, 'Mã y lệnh không được để trống.').optional(),
    measuredAt: z
      .string()
      .datetime({ offset: true, message: 'Thời điểm đo không hợp lệ.' })
      .optional(),
    note: z.string().max(500, 'Ghi chú không được vượt quá 500 ký tự.').optional(),
  })
  .refine((data) => data.bloodPressureSystolic > data.bloodPressureDiastolic, {
    message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
    path: ['bloodPressureSystolic'],
  });

export const updateClinicalAssessmentSchema = z.object({
  expectedVersion: z.number().int().positive('Phiên bản hồ sơ phải là số nguyên dương.'),
  chiefComplaint: z.string().max(500, 'Lý do khám bệnh không được vượt quá 500 ký tự.').optional(),
  heightCm: z
    .number()
    .positive('Chiều cao phải lớn hơn 0cm.')
    .max(250, 'Chiều cao tối đa 250cm.')
    .optional(),
  weightKg: z
    .number()
    .positive('Cân nặng phải lớn hơn 0kg.')
    .max(300, 'Cân nặng tối đa 300kg.')
    .optional(),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  skinLesionTypes: z
    .array(
      z.enum([
        'macule',
        'papule',
        'plaque',
        'vesicle',
        'bulla',
        'pustule',
        'nodule',
        'wheal',
        'scale',
        'crust',
        'erosion',
        'ulcer',
        'atrophy',
        'lichenification',
      ]),
    )
    .optional(),
  skinLesionDescription: z.string().optional(),
  skinLesionLocation: z
    .string()
    .max(500, 'Vị trí tổn thương không được vượt quá 500 ký tự.')
    .optional(),
  skinLesionDistribution: z
    .enum(['localized', 'scattered', 'generalized', 'symmetric', 'dermatomal', 'flexural'])
    .optional(),
  bodySurfaceAreaPercent: z
    .number()
    .min(0, 'Diện tích tổn thương không được nhỏ hơn 0%.')
    .max(100, 'Diện tích tổn thương không được lớn hơn 100%.')
    .optional(),
  itchSeverity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
  notes: z.string().optional(),
});

/** Payload transaction cho màn hình bác sĩ: sinh hiệu và khám lâm sàng phải cùng thành công. */
const doctorAssessmentSchema = updateClinicalAssessmentSchema.extend({
  // Lý do khám là thông tin bắt buộc trong payload atomic của màn hình bác sĩ.
  chiefComplaint: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do khám bệnh.')
    .max(500, 'Lý do khám bệnh không được vượt quá 500 ký tự.'),
});

export const recordVitalSignsWithAssessmentSchema =
  recordVitalSignsSchema.and(doctorAssessmentSchema);

export const orderLabTestsSchema = z.object({
  expectedRecordVersion: z.number().int().positive('Phiên bản hồ sơ phải là số nguyên dương.'),
  items: z
    .array(
      z.object({
        labTestTypeId: z.string().min(1, 'Vui lòng chọn loại xét nghiệm.'),
        isUrgent: z.boolean().optional(),
        specimenType: z.string().max(100, 'Loại mẫu không được vượt quá 100 ký tự.').optional(),
        method: z.string().max(255, 'Phương pháp không được vượt quá 255 ký tự.').optional(),
      }),
    )
    .min(1, 'Vui lòng chọn ít nhất 1 dịch vụ xét nghiệm.')
    .max(20, 'Chỉ được gửi tối đa 20 chỉ định trong một lần.'),
});

export const diagnoseRecordSchema = z.object({
  expectedVersion: z.number().int().positive('Phiên bản hồ sơ phải là số nguyên dương.'),
  icd10: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn mã ICD-10.')
    .max(10, 'Mã ICD-10 không được vượt quá 10 ký tự.'),
  diagnosisText: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập diễn giải chẩn đoán.')
    .max(1000, 'Diễn giải chẩn đoán không được vượt quá 1000 ký tự.'),
  treatmentType: z.enum(['outpatient', 'inpatient'], {
    required_error: 'Vui lòng chọn hướng điều trị Ngoại trú hoặc Nội trú.',
    invalid_type_error: 'Hướng điều trị không hợp lệ.',
  }),
  signatureConfirmation: z.literal(true),
  signatureMethod: z.literal('dev_e_confirmation'),
});
