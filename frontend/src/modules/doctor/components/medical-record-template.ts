import type { MedicalRecordDetail } from '../types/medical-record.types';
import { calculateAge, formatDateTimeVN } from './shared';

type TemplateFieldValue = boolean | string;

function formatDateParts(value: string): string[] {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return [...day, ...month, ...year];
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** Định dạng ngày ký theo đúng câu chữ của vùng chữ ký trong mẫu bệnh án. */
function formatSignatureDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')} tháng ${String(date.getMonth() + 1).padStart(2, '0')} năm ${date.getFullYear()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Bổ sung hook cho ngày sinh và vùng ký khi mẫu cũ chưa có `data-ba`. */
function addTemplateDataHooks(template: string): string {
  const withBirthDateHooks = template.replace(
    /(<label>&nbsp;2\. Sinh ngày:<\/label>)([\s\S]*?)(<span class="digit-boxes" title="Tuổi">)/,
    (_match, label: string, dateFields: string, ageFields: string) => {
      let digitIndex = 0;
      const nextDateFields = dateFields.replace(
        /<span class="digit-box"><\/span>/g,
        () => `<span class="digit-box" data-ba="ngay${++digitIndex}"></span>`,
      );
      return label + nextDateFields + ageFields;
    },
  );

  const withTreatmentTypeHook = withBirthDateHooks.includes('data-ba="loaidieutri"')
    ? withBirthDateHooks
    : withBirthDateHooks.replace(
        '<p>Khoa: <span style="min-width:90px" data-ba="khoa"></span>Giường <span data-ba="giuong" style="border-bottom:1px dotted #000;min-width:40px;display:inline-block;"></span></p>',
        '<p>Khoa: <span style="min-width:90px" data-ba="khoa"></span>Giường <span data-ba="giuong" style="border-bottom:1px dotted #000;min-width:40px;display:inline-block;"></span></p>\n      <p>Loại điều trị: <span data-ba="loaidieutri" style="border-bottom:1px dotted #000;min-width:100px;display:inline-block;"></span></p>',
      );

  return withTreatmentTypeHook
    .replace(
      'Ngày......tháng.....năm........',
      'Ngày <span data-ba="ngayky"></span>',
    )
    .replace(
      'Ngày …. tháng ….. năm …….',
      'Ngày <span data-ba="ngayky"></span>',
    );
}

/** Chuẩn hóa dữ liệu hồ sơ và thông tin người ký thành các trường của mẫu HTML. */
function buildTemplateValues(
  record: MedicalRecordDetail,
): Record<string, TemplateFieldValue> {
  const { clinicalAssessment: assessment, latestVitalSigns: vitals, patient } = record;
  const diagnosis = record.diagnosis;
  const birthDate = formatDateParts(patient.dateOfBirth);
  const labNames = record.labTests.map((test) => test.testName).join(', ');
  const diagnosisText = diagnosis?.diagnosisText ?? '';
  const treatmentType =
    diagnosis?.treatmentType === 'inpatient'
      ? 'Nội trú'
      : diagnosis?.treatmentType === 'outpatient'
        ? 'Ngoại trú'
        : '';
  const isSigned = Boolean(diagnosis?.diagnosisSignedAt);
  const signerName = isSigned ? record.diagnosisSigner?.fullName ?? '' : '';

  const values = {
    soyte: '',
    benhvien: '',
    khoa: record.department?.name ?? '',
    giuong: record.bed?.number ?? '',
    loaidieutri: treatmentType,
    luutru: record.recordCode,
    mabn: patient.patientCode,
    hoten: patient.fullName.toUpperCase(),
    ngay1: birthDate[0],
    ngay2: birthDate[1],
    ngay3: birthDate[2],
    ngay4: birthDate[3],
    ngay5: birthDate[4],
    ngay6: birthDate[5],
    ngay7: birthDate[6],
    ngay8: birthDate[7],
    tuoi1: String(calculateAge(patient.dateOfBirth)).padStart(2, '0')[0],
    tuoi2: String(calculateAge(patient.dateOfBirth)).padStart(2, '0')[1],
    'chk-nam': patient.gender === 'male',
    'chk-nu': patient.gender === 'female',
    diachi: patient.address ?? '',
    bhyt: patient.healthInsuranceCode ?? '',
    'obj-bhyt': Boolean(patient.healthInsuranceCode),
    'obj-tp': false,
    nguoinha: patient.emergencyContact ?? '',
    nguoinha2: '',
    dienthoai: patient.emergencyPhoneNumber ?? '',
    vaovien: formatDateTimeVN(record.createdAt),
    'vao-cc': record.isEmergency,
    'vao-kkb': false,
    'vao-khoa': false,
    'cd-chinh': diagnosisText,
    'cd-chinh2': diagnosisText,
    'icd-chinh': diagnosis?.icd10 ?? '',
    lydo: record.chiefComplaint ?? '',
    ngaythu: '',
    benhly: assessment.historyOfPresentIllness ?? '',
    banthan: assessment.pastMedicalHistory ?? '',
    banthan2: patient.allergies ?? '',
    diung: patient.allergies ?? '',
    giadinh: assessment.familyHistory ?? '',
    mach: formatOptionalNumber(vitals?.pulse),
    nhiet: formatOptionalNumber(vitals?.temperatureC),
    hasys: formatOptionalNumber(vitals?.bloodPressureSystolic),
    hadia: formatOptionalNumber(vitals?.bloodPressureDiastolic),
    nhiptho: formatOptionalNumber(vitals?.respiratoryRate),
    cannang: formatOptionalNumber(vitals?.weightKg),
    trieuchung: record.chiefComplaint ?? '',
    thuongton: assessment.skinLesionDescription ?? '',
    cls: labNames,
    'so-xn': String(record.labTests.length),
    tomtat: diagnosis ? `${diagnosis.icd10} — ${diagnosisText}` : '',
    'p2-cd-chinh': diagnosisText,
    'p2-cd-chinh2': diagnosisText,
    'p2-cd-kem': '',
    'p2-phanbiet': '',
    tienluong: '',
    huongdt: '',
    'p3-dienbien': assessment.historyOfPresentIllness ?? '',
    'p3-cls': labNames,
    'p3-dieutri': '',
    'p3-tinhtrang': '',
    'p3-tieptheo': '',
    ngayky: formatSignatureDate(diagnosis?.diagnosisSignedAt ?? null),
    'bs-lambenhan': signerName,
    'bs-dieutri': signerName,
    dakyso: isSigned ? 'Đã ký' : '',
  };

  return values;
}

/**
 * Bind dữ liệu hồ sơ vào các điểm `data-ba` của mẫu bệnh án chuẩn.
 *
 * @param template HTML mẫu `doc/mẫu/benhan.html`.
 * @param record Hồ sơ bệnh án đang được bác sĩ xem.
 * @returns HTML đã điền dữ liệu, giữ nguyên bố cục và CSS của mẫu gốc.
 */
export function renderMedicalRecordTemplate(
  template: string,
  record: MedicalRecordDetail,
): string {
  const values = buildTemplateValues(record);
  const templateWithDataHooks = addTemplateDataHooks(template);

  return templateWithDataHooks.replace(
    /(<([a-z][\w:-]*)(?=[^>]*\sdata-ba="([^"]+)")[^>]*>)([\s\S]*?)(<\/\2>)/gi,
    (match, openingTag: string, _tagName: string, fieldName: string, innerHtml: string, closingTag: string) => {
      const value = values[fieldName];
      if (value === undefined) return match;

      if (typeof value === 'boolean') {
        const classMatch = openingTag.match(/class="([^"]*)"/i);
        if (!classMatch) return openingTag + innerHtml + closingTag;

        const classes = classMatch[1].split(/\s+/).filter(Boolean).filter((item) => item !== 'checked');
        if (value) classes.push('checked');
        const nextOpeningTag = openingTag.replace(
          classMatch[0],
          `class="${classes.join(' ')}"`,
        );
        return nextOpeningTag + innerHtml + closingTag;
      }

      return openingTag + escapeHtml(value) + closingTag;
    },
  );
}
