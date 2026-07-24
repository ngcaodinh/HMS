import { AppError } from '../../../core/errors/app-error';
import type { Principal } from '../../auth/types/auth.types';
import { findMedicalRecordById, findWorklist } from '../repositories/medical-record.repository';
import { ICD10_CODING_SYSTEM, ICD10_EFFECTIVE_FROM, searchIcd10 } from '../constants/icd10-catalog';
import type { RecordStatus } from '../types/medical-record.types';

/**
 * @route GET /api/v1/medical-records/worklist
 * @desc Doctor's own assigned encounters for today/a given status.
 * @access doctor
 */
export async function listDoctorWorklist(
  doctorId: string,
  query: { status?: RecordStatus; date?: string; page: number; pageSize: number },
) {
  const [records, totalItems] = await findWorklist({ doctorId, ...query });

  return {
    data: records.map((record) => ({
      recordId: record.id,
      recordCode: record.recordCode,
      patient: {
        patientId: record.patients.id,
        fullName: record.patients.fullName,
        dateOfBirth: record.patients.dateOfBirth,
        gender: record.patients.gender,
      },
      chiefComplaint: record.chiefComplaint,
      status: record.status,
    })),
    pagination: { page: query.page, pageSize: query.pageSize, totalItems },
  };
}

/**
 * @route GET /api/v1/medical-records/:recordId
 * @desc Role-projected record detail — only the `doctor` viewType is implemented so far;
 * `lab`/`pharmacy` viewTypes are added alongside their respective modules (Phase 2/3).
 * @access doctor (assigned only)
 * @throws {AppError} 404 MEDICAL_RECORD_NOT_FOUND, 403 FORBIDDEN_ACCESS
 */
export async function getMedicalRecordDetail(recordId: string, principal: Principal) {
  const record = await findMedicalRecordById(recordId);
  if (!record) {
    throw AppError.notFound('MEDICAL_RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ khám.');
  }

  if (!principal.roleCodes.includes('doctor') || record.doctorId !== principal.userId) {
    throw AppError.forbidden('FORBIDDEN_ACCESS', 'Bạn không có quyền xem hồ sơ khám này.');
  }

  return {
    viewType: 'doctor' as const,
    record: {
      recordId: record.id,
      status: record.status,
      version: record.version,
      patientId: record.patientId,
      doctorId: record.doctorId,
      isEmergency: record.isEmergency,
      chiefComplaint: record.chiefComplaint,
      // Extension beyond the literal allow-list table: the assigned doctor already has full
      // clinical authority over this patient, and allergy/BHYT are required by the Diagnosis/
      // Rx screens (Tailieu/doctor.html patient header + Tab 5A allergy check).
      patient: {
        patientId: record.patients.id,
        patientCode: record.patients.patientCode,
        fullName: record.patients.fullName,
        dateOfBirth: record.patients.dateOfBirth,
        gender: record.patients.gender,
        allergies: record.patients.allergies,
        healthInsuranceCode: record.patients.healthInsuranceCode,
      },
      clinicalAssessment: {
        heightCm: record.heightCm,
        weightKg: record.weightKg,
        historyOfPresentIllness: record.historyOfPresentIllness,
        pastMedicalHistory: record.pastMedicalHistory,
        familyHistory: record.familyHistory,
        skinLesionTypes: record.skinLesionTypes ? record.skinLesionTypes.split(',') : [],
        skinLesionDescription: record.skinLesionDescription,
        skinLesionLocation: record.skinLesionLocation,
        skinLesionDistribution: record.skinLesionDistribution,
        bodySurfaceAreaPercent: record.bodySurfaceAreaPercent,
        itchSeverity: record.itchSeverity,
      },
      latestVitalSigns: record.vitalSigns,
      labTests: record.lab_tests.map((test) => ({
        labTestId: test.id,
        status: test.status,
        testName: test.testName,
        isUrgent: test.isUrgent,
        resultTableKey: test.lab_test_types.resultTableKey,
      })),
      diagnosis: record.icd10
        ? {
            icd10: record.icd10,
            icdCodingSystem: record.icdCodingSystem,
            diagnosisText: record.diagnosisText,
            treatmentType: record.treatmentType,
            diagnosedAt: record.diagnosedAt,
            diagnosisSignedAt: record.diagnosisSignedAt,
          }
        : null,
    },
  };
}

/**
 * @route GET /api/v1/clinical-catalogs/icd-10
 * @desc Read-only ICD-10 catalog for diagnosis autocomplete/validation.
 * @access doctor
 */
export function getIcd10Catalog(keyword?: string) {
  return {
    data: searchIcd10(keyword).map((entry) => ({
      ...entry,
      codingSystem: ICD10_CODING_SYSTEM,
      effectiveFrom: ICD10_EFFECTIVE_FROM,
    })),
  };
}
