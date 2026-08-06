/** Hợp đồng dữ liệu hồ sơ khám mà màn hình bác sĩ đọc từ các API lâm sàng. */

/** Trạng thái vòng đời của hồ sơ khám; server quyết định chuyển trạng thái. */
export type RecordStatus = 'open' | 'waiting_results' | 'diagnosed' | 'closed';

/** Phân loại điều trị được chọn khi bác sĩ chẩn đoán hồ sơ. */
export type TreatmentType = 'outpatient' | 'inpatient';

/** Mức độ ngứa được ghi nhận trong đánh giá lâm sàng. */
export type ItchSeverity = 'none' | 'mild' | 'moderate' | 'severe';

/** Một mục trong worklist của bác sĩ, kèm trạng thái hồ sơ và cờ báo kết quả đã sẵn sàng. */
export interface WorklistItem {
  recordId: string;
  recordCode: string;
  patient: { patientId: string; fullName: string; dateOfBirth: string; gender: 'male' | 'female' };
  chiefComplaint: string | null;
  status: RecordStatus;
  hasReadyResults: boolean;
}

/** Danh tính và thông tin liên hệ được phép hiển thị trong hồ sơ đang khám. */
export interface RecordPatient {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  allergies: string | null;
  healthInsuranceCode: string | null;
  healthInsuranceExpiryDate: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhoneNumber: string | null;
}

/** Các dữ liệu đánh giá lâm sàng; chiều cao tính bằng cm, cân nặng bằng kg và BSA bằng %. */
export interface ClinicalAssessment {
  heightCm: string | null;
  weightKg: string | null;
  historyOfPresentIllness: string | null;
  pastMedicalHistory: string | null;
  familyHistory: string | null;
  skinLesionTypes: string[];
  skinLesionDescription: string | null;
  skinLesionLocation: string | null;
  skinLesionDistribution: string | null;
  bodySurfaceAreaPercent: string | null;
  itchSeverity: ItchSeverity | null;
}

/** Sinh hiệu mới nhất; nhiệt độ tính bằng °C, huyết áp bằng mmHg và SpO₂ bằng %. */
export interface LatestVitalSigns {
  pulse: number;
  temperatureC: number | null;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate: number | null;
  spo2: number;
  weightKg: number | null;
}

/** Tóm tắt một chỉ định xét nghiệm; status phản ánh ordered, in_progress hoặc resulted. */
export interface RecordLabTestSummary {
  labTestId: string;
  status: 'ordered' | 'in_progress' | 'resulted';
  testName: string;
  isUrgent: boolean;
  resultTableKey: string;
  specimenType: string | null;
}

/** Khóa bảng kết quả do backend quy ước để chọn đúng biểu mẫu xét nghiệm. */
export type ResultTableKey =
  'xn_cong_thuc_mau' | 'xn_nuoc_tieu' | 'xn_vi_sinh' | 'xn_mo_benh_hoc' | 'xn_hoa_sinh_mau';

/** Khoảng tham chiếu theo giới tính; bound và unit giữ nguyên định dạng wire của API. */
export interface ReferenceRange {
  fieldKey: string;
  code: string;
  label: string;
  unit: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  condition: 'all' | 'male' | 'female';
}

/** Metadata của tệp đính kèm kết quả; uploadedAt là thời điểm dạng ISO. */
export interface LabTestAttachment {
  attachmentId: string;
  fileType: 'pdf' | 'png' | 'jpeg' | 'xml';
  originalName: string;
  uploadedAt: string;
}

/** Chi tiết kết quả xét nghiệm, gồm trạng thái, chữ ký, dữ liệu cấu trúc và tệp đính kèm. */
export interface LabTestResultDetail {
  labTestId: string;
  recordId: string;
  testName: string;
  status: 'ordered' | 'in_progress' | 'resulted';
  resultTableKey: ResultTableKey;
  isUrgent: boolean;
  specimenType: string | null;
  reportCode: string | null;
  method: string | null;
  conclusion: string | null;
  resultedBy: string | null;
  resultedAt: string | null;
  signedBy: string | null;
  signedAt: string | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    healthInsuranceCode: string | null;
  };
  department: { name: string } | null;
  orderingDoctor: { fullName: string };
  diagnosis: { icd10: string; diagnosisText: string | null } | null;
  structuredResult: Record<string, unknown> | null;
  referenceRanges: ReferenceRange[];
  attachments: LabTestAttachment[];
}

/** Chẩn đoán đã ghi nhận; các mốc thời gian là chuỗi ngày/giờ do API trả về. */
export interface RecordDiagnosis {
  icd10: string;
  icdCodingSystem: string;
  diagnosisText: string;
  treatmentType: TreatmentType | null;
  diagnosedAt: string;
  diagnosisSignedAt: string;
}

/** Aggregate hồ sơ khám dùng cho workspace; version phục vụ kiểm soát cập nhật đồng thời và createdAt là ISO datetime. */
export interface MedicalRecordDetail {
  recordId: string;
  recordCode: string;
  status: RecordStatus;
  version: number;
  patientId: string;
  doctorId: string;
  doctor: { fullName: string } | null;
  department: { name: string } | null;
  bed: { number: string } | null;
  diagnosisSigner: { fullName: string } | null;
  isEmergency: boolean;
  chiefComplaint: string | null;
  createdAt: string;
  patient: RecordPatient;
  clinicalAssessment: ClinicalAssessment;
  latestVitalSigns: LatestVitalSigns | null;
  labTests: RecordLabTestSummary[];
  diagnosis: RecordDiagnosis | null;
}

/** Một mục tra cứu ICD-10 có hiệu lực từ ngày effectiveFrom dạng ISO date. */
export interface Icd10Entry {
  code: string;
  name: string;
  codingSystem: string;
  effectiveFrom: string;
}

/** Lựa chọn loại xét nghiệm; price giữ dạng chuỗi theo hợp đồng tiền tệ của API. */
export interface LabTestTypeOption {
  labTestTypeId: string;
  code: string;
  name: string;
  price: string;
  specimen: string | null;
}

/** Payload ghi sinh hiệu và đánh giá ban đầu; các trường số dùng cùng đơn vị với LatestVitalSigns. */
export interface VitalSignsFormInput {
  pulse: number;
  temperatureC?: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate?: number;
  spo2: number;
  weightKg?: number;
}

/** Payload chẩn đoán; expectedVersion bảo vệ hồ sơ khỏi ghi đè phiên bản mới hơn. */
export interface DiagnoseInput {
  expectedVersion: number;
  icd10: string;
  diagnosisText: string;
  treatmentType: TreatmentType;
}
