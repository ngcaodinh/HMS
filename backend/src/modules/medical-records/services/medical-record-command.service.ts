import { AppError } from '../../../core/errors/app-error';
import { recordAuditLog } from '../../audit/services/audit.service';
import { findIcd10ByCode } from '../constants/icd10-catalog';
import {
  createLabTestOrders,
  diagnoseRecord,
  findActiveLabTestType,
  findMedicalRecordById,
  snapshotVitalSigns,
  updateClinicalAssessment as updateClinicalAssessmentRepo,
} from '../repositories/medical-record.repository';
import { createVitalSignLog } from '../repositories/vital-sign.repository';
import type {
  ClinicalAssessmentInput,
  DiagnoseRecordInput,
  OrderLabTestsInput,
  VitalSignsInput,
} from '../types/medical-record.types';

async function loadAssignedOpenRecord(recordId: string, doctorId: string) {
  const record = await findMedicalRecordById(recordId);
  if (!record) throw AppError.notFound('MEDICAL_RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ khám.');
  if (record.doctorId !== doctorId) {
    throw AppError.forbidden('FORBIDDEN_ACCESS', 'Bạn không có quyền thao tác trên hồ sơ này.');
  }
  if (record.status === 'closed') {
    throw AppError.badRequest('RECORD_ALREADY_CLOSED', 'Hồ sơ khám đã đóng.');
  }
  return record;
}

/**
 * @route POST /api/v1/medical-records/:recordId/vital-signs
 * @desc Log one vitals measurement (canonical write, Gate G3) and refresh the latest snapshot.
 * @access doctor, nurse
 * @throws {AppError} 400 RECORD_ALREADY_CLOSED, 404 MEDICAL_RECORD_NOT_FOUND
 */
export async function recordVitalSigns(recordId: string, recordedBy: string, input: VitalSignsInput) {
  const record = await findMedicalRecordById(recordId);
  if (!record) throw AppError.notFound('MEDICAL_RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ khám.');
  if (record.status === 'closed') {
    throw AppError.badRequest('RECORD_ALREADY_CLOSED', 'Hồ sơ khám đã đóng.');
  }

  const log = await createVitalSignLog(recordId, recordedBy, input);
  await snapshotVitalSigns(
    recordId,
    {
      pulse: input.pulse,
      temperatureC: input.temperatureC ?? null,
      bloodPressureSystolic: input.bloodPressureSystolic,
      bloodPressureDiastolic: input.bloodPressureDiastolic,
      respiratoryRate: input.respiratoryRate ?? null,
      spo2: input.spo2,
      weightKg: input.weightKg ?? null,
    },
    recordedBy,
  );

  return {
    vitalSignId: log.id,
    recordId,
    measuredAt: log.measuredAt,
    recordedBy,
    latestSnapshotUpdated: true,
  };
}

/**
 * @route PATCH /api/v1/medical-records/:recordId/clinical-assessment
 * @desc Update complaint/dermatology assessment fields on a non-closed record.
 * @access doctor
 * @throws {AppError} 409 VERSION_CONFLICT, 403 FORBIDDEN_ACCESS, 400 RECORD_ALREADY_CLOSED
 */
export async function updateClinicalAssessment(
  recordId: string,
  doctorId: string,
  input: ClinicalAssessmentInput,
) {
  await loadAssignedOpenRecord(recordId, doctorId);

  const updated = await updateClinicalAssessmentRepo(recordId, input.expectedVersion, input);
  if (!updated) {
    throw AppError.conflict('VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác.');
  }

  const record = await findMedicalRecordById(recordId);
  return {
    recordId,
    status: record?.status,
    skinLesionTypes: record?.skinLesionTypes ? record.skinLesionTypes.split(',') : [],
    version: record?.version,
  };
}

/**
 * @route POST /api/v1/medical-records/:recordId/lab-tests
 * @desc Order 1..20 lab tests from the active catalog, snapshotting price/name server-side.
 * @access doctor
 * @throws {AppError} 400 LAB_TEST_TYPE_INACTIVE, 409 VERSION_CONFLICT, 400 RECORD_ALREADY_CLOSED
 */
export async function orderLabTests(recordId: string, doctorId: string, input: OrderLabTestsInput) {
  await loadAssignedOpenRecord(recordId, doctorId);

  const resolvedTypes = new Map<string, { testName: string; fee: string }>();
  for (const item of input.items) {
    const type = await findActiveLabTestType(item.labTestTypeId);
    if (!type) {
      throw AppError.badRequest('LAB_TEST_TYPE_INACTIVE', 'Loại xét nghiệm không tồn tại hoặc đã ngừng hoạt động.');
    }
    resolvedTypes.set(item.labTestTypeId, { testName: type.name, fee: type.price.toString() });
  }

  const result = await createLabTestOrders(
    recordId,
    input.expectedRecordVersion,
    doctorId,
    input.items,
    resolvedTypes,
  );
  if (!result) {
    throw AppError.conflict('VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác.');
  }

  return {
    recordId,
    recordStatus: result.record.status,
    recordVersion: result.record.version,
    labTests: result.createdTests.map((test) => ({
      labTestId: test.id,
      testName: test.testName,
      fee: test.fee.toString(),
      status: test.status,
      isUrgent: test.isUrgent,
    })),
  };
}

/**
 * @route POST /api/v1/medical-records/:recordId/diagnosis
 * @desc Validate ICD-10, electronically sign the diagnosis, and transition the record.
 * @access doctor (assigned only)
 * @throws {AppError} 400 INVALID_ICD_CODE, 400 RECORD_ALREADY_CLOSED, 403 FORBIDDEN_ACCESS, 409 VERSION_CONFLICT
 */
export async function diagnoseMedicalRecord(
  recordId: string,
  doctorId: string,
  input: DiagnoseRecordInput,
) {
  if (!findIcd10ByCode(input.icd10)) {
    throw AppError.badRequest('INVALID_ICD_CODE', 'Mã ICD-10 không hợp lệ.');
  }

  await loadAssignedOpenRecord(recordId, doctorId);

  const record = await diagnoseRecord(recordId, doctorId, input);
  if (!record) {
    throw AppError.conflict('VERSION_CONFLICT', 'Hồ sơ đã bị thay đổi bởi thao tác khác.');
  }

  await recordAuditLog({
    userId: doctorId,
    userRole: 'doctor',
    userName: doctorId,
    action: 'SIGN',
    resource: 'MedicalRecordDiagnosis',
    resourceId: recordId,
  });

  return {
    recordId,
    status: record.status,
    icd10: record.icd10,
    icdCodingSystem: record.icdCodingSystem,
    treatmentType: record.treatmentType,
    diagnosedAt: record.diagnosedAt,
    diagnosisSignedAt: record.diagnosisSignedAt,
    version: record.version,
  };
}
