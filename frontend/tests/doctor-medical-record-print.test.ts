import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { renderMedicalRecordTemplate } from '../src/modules/doctor/components/medical-record-template';
import type { MedicalRecordDetail } from '../src/modules/doctor/types/medical-record.types';

const record = {
  recordId: 'record-12345678',
  recordCode: 'BA-001',
  status: 'open',
  version: 1,
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  doctor: { fullName: 'BS. Nguyễn Văn B' },
  department: { name: 'Khoa Da liễu' },
  bed: null,
  diagnosisSigner: null,
  isEmergency: false,
  chiefComplaint: 'Ngứa da',
  createdAt: '2026-08-04T08:30:00.000Z',
  patient: {
    patientId: 'patient-1',
    patientCode: 'BN001',
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '1990-01-02',
    gender: 'male',
    allergies: null,
    healthInsuranceCode: null,
    healthInsuranceExpiryDate: null,
    address: 'Quận 1, TP. Hồ Chí Minh',
    emergencyContact: null,
    emergencyPhoneNumber: null,
  },
  clinicalAssessment: {
    heightCm: null,
    weightKg: null,
    historyOfPresentIllness: 'Khởi phát ba ngày trước.',
    pastMedicalHistory: null,
    familyHistory: null,
    skinLesionTypes: [],
    skinLesionDescription: 'Ban đỏ vùng tay.',
    skinLesionLocation: null,
    skinLesionDistribution: null,
    bodySurfaceAreaPercent: null,
    itchSeverity: null,
  },
  latestVitalSigns: {
    pulse: 80,
    temperatureC: 36.8,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    respiratoryRate: 18,
    spo2: 98,
    weightKg: 60,
  },
  labTests: [],
  diagnosis: null,
} as MedicalRecordDetail;

test('binds medical record data into the source print template without trial footer text', () => {
  const template = `
    <h1 data-ba="hoten"></h1>
    <span class="chk-box" data-ba="chk-nam"></span>
    <span data-ba="hasys"></span>/<span data-ba="hadia"></span>
  `;

  const html = renderMedicalRecordTemplate(template, record);

  assert.match(html, /NGUYỄN VĂN A/);
  assert.match(html, /class="chk-box checked"/);
  assert.match(html, />120<\/span>\/\s*<span[^>]*>80<\/span>/);
  assert.doesNotMatch(html, /Bản in thử nghiệm|Hệ thống quản lý bệnh viện điện tử HMS-VN/);
});

test('keeps the three-page structure of doc/mẫu/benhan.html', () => {
  const template = readFileSync(new URL('../../doc/mẫu/benhan.html', import.meta.url), 'utf8');
  const html = renderMedicalRecordTemplate(template, record);

  assert.match(html, /class="page"/);
  assert.match(html, /class="page2"/);
  assert.match(html, /class="page3"/);
  assert.match(html, /data-ba="ngay1"[^>]*>0<\/span>/);
  assert.match(html, /data-ba="khoa"[^>]*>Khoa Da liễu<\/span>/);
  assert.match(html, /data-ba="luutru"[^>]*>BA-001<\/span>/);
  assert.match(html, /data-ba="hasys"[^>]*>120<\/span>/);
  assert.match(html, /data-ba="hadia"[^>]*>80<\/span>/);
  assert.doesNotMatch(html, /Đã ký/);
});

test('shows signature date, signer name and signed status after the diagnosis is signed', () => {
  const signedRecord = {
    ...record,
    diagnosisSigner: { fullName: 'BS. Nguyễn Văn B' },
    diagnosis: {
      icd10: 'L30.9',
      icdCodingSystem: 'TT06_2026',
      diagnosisText: 'Viêm da',
      treatmentType: 'outpatient',
      diagnosedAt: '2026-08-04T08:30:00.000Z',
      diagnosisSignedAt: '2026-08-05T09:15:00.000Z',
    },
  } as MedicalRecordDetail;
  const template = readFileSync(new URL('../../doc/mẫu/benhan.html', import.meta.url), 'utf8');

  const html = renderMedicalRecordTemplate(template, signedRecord);

  assert.match(html, /05 tháng 08 năm 2026/);
  assert.match(html, /data-ba="bs-dieutri"[^>]*>BS\. Nguyễn Văn B<\/span>/);
  assert.match(html, /data-ba="dakyso"[^>]*>Đã ký<\/p>/);
});

test('writes the real treatment type explicitly and does not invent it for an undecided record', () => {
  const template = readFileSync(new URL('../../doc/mẫu/benhan.html', import.meta.url), 'utf8');
  const undecidedHtml = renderMedicalRecordTemplate(template, record);
  const inpatientRecord = {
    ...record,
    diagnosis: {
      icd10: 'L30.9',
      icdCodingSystem: 'TT06_2026',
      diagnosisText: 'Viêm da',
      treatmentType: 'inpatient',
      diagnosedAt: '2026-08-04T08:30:00.000Z',
      diagnosisSignedAt: '2026-08-05T09:15:00.000Z',
    },
  } as MedicalRecordDetail;
  const inpatientHtml = renderMedicalRecordTemplate(template, inpatientRecord);

  assert.doesNotMatch(undecidedHtml, /Loại điều trị:[\s\S]*?(Nội trú|Ngoại trú)/);
  assert.match(inpatientHtml, /Loại điều trị:[\s\S]*?Nội trú/);
  assert.doesNotMatch(inpatientHtml, /Giường[^\n]*>NT</);
});

test('does not fill unavailable administrative fields with guessed values', () => {
  const html = renderMedicalRecordTemplate(
    '<span data-ba="soyte"></span><span data-ba="benhvien"></span>' +
      '<span data-ba="khoa"></span><span data-ba="luutru"></span>' +
      '<span data-ba="p3-tinhtrang"></span>',
    { ...record, department: null, bed: null },
  );

  assert.match(html, /<span data-ba="soyte"><\/span>/);
  assert.match(html, /<span data-ba="benhvien"><\/span>/);
  assert.match(html, /<span data-ba="khoa"><\/span>/);
  assert.match(html, /<span data-ba="luutru">BA-001<\/span>/);
  assert.match(html, /<span data-ba="p3-tinhtrang"><\/span>/);
});

test('does not copy treatment type into unavailable treatment-plan fields', () => {
  const inpatientRecord = {
    ...record,
    diagnosis: {
      icd10: 'L30.9',
      icdCodingSystem: 'TT06_2026',
      diagnosisText: 'ViÃªm da',
      treatmentType: 'inpatient',
      diagnosedAt: '2026-08-04T08:30:00.000Z',
      diagnosisSignedAt: '2026-08-05T09:15:00.000Z',
    },
  } as MedicalRecordDetail;

  const html = renderMedicalRecordTemplate(
    '<span data-ba="huongdt"></span><span data-ba="p3-dieutri"></span>' +
      '<span data-ba="p3-tieptheo"></span>',
    inpatientRecord,
  );

  assert.match(html, /<span data-ba="huongdt"><\/span>/);
  assert.match(html, /<span data-ba="p3-dieutri"><\/span>/);
  assert.match(html, /<span data-ba="p3-tieptheo"><\/span>/);
});
