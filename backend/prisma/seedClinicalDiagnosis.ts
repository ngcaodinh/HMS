import { randomUUID } from 'node:crypto';
import {
  PrismaClient,
  Gender,
  MedicalRecordStatus,
  TreatmentType,
  QueueTicketStatus,
  BloodType,
  medical_records_icdCodingSystem,
  medical_records_skinLesionDistribution,
  medical_records_itchSeverity,
} from '@prisma/client';

const prisma = new PrismaClient();

const sampleClinicalCases = [
  // CASE 1: Chờ khám - Viêm dạ dày HP(+) / Đau thượng vị
  {
    patientCode: 'BN20260701',
    recordCode: 'BA20260701',
    fullName: 'NGUYỄN VĂN KHANG',
    gender: Gender.male,
    birthYear: 1982, // 44 tuổi
    phone: '0912345881',
    cmnd: '001082098701',
    address: '124 Hoàng Hoa Thám, Ba Đình, Hà Nội',
    bloodType: BloodType.O_PLUS,
    allergies: 'Không ghi nhận',
    insuranceCode: 'DN4010123450001',
    chiefComplaint: 'Đau quặn vùng thượng vị, ợ chua, buồn nôn sau khi ăn đồ mỡ spicy',
    historyOfPresentIllness:
      'Bệnh nhân khởi phát đau quặn từng cơn vùng trên rốn cách đây 5 ngày, đau tăng khi đói và sau khi ăn cay nóng. Có cảm giác ợ chua, ợ hơi nóng rát sau xương ức, đắng miệng vào buổi sáng. Đã tự mua thuốc đau dạ dày phosphalugel uống nhưng chỉ đỡ tạm thời.',
    pastMedicalHistory: 'Tiền sử Viêm dạ dày 2 năm trước, hay thức khuya làm việc, uống cà phê 2 ly/ngày.',
    familyHistory: 'Bố đẻ mắc Viêm loét dạ dày tá tràng.',
    vitalSigns: {
      pulse: 78,
      bloodPressureSystolic: 125,
      bloodPressureDiastolic: 80,
      temperatureC: 37.0,
      respiratoryRate: 18,
      spo2: 99,
      weightKg: 68.5,
    },
    heightCm: 170,
    weightKg: 68.5,
    status: MedicalRecordStatus.open,
    queueStatus: QueueTicketStatus.waiting,
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 2: Chờ khám (Được gọi vào) - Tăng huyết áp độ II / Đau đầu chẩm
  {
    patientCode: 'BN20260702',
    recordCode: 'BA20260702',
    fullName: 'TRẦN THỊ BÍCH',
    gender: Gender.female,
    birthYear: 1968, // 58 tuổi
    phone: '0983112232',
    cmnd: '001168098702',
    address: '45 Trần Phú, Hà Đông, Hà Nội',
    bloodType: BloodType.A_PLUS,
    allergies: 'Dị ứng Penicillin (nổi mề đay)',
    insuranceCode: 'HT2010123450002',
    chiefComplaint: 'Đau mỏi vùng vai gáy lan lên chẩm, hoa mắt chóng mặt khi đứng dậy',
    historyOfPresentIllness:
      '2 tuần nay bệnh nhân thường xuyên bị đau tức nặng vùng chẩm buổi sáng, có cảm giác choáng váng nhẹ khi thay đổi tư thế đột ngột, mệt mỏi khó ngủ. Tự đo huyết áp tại nhà thấy dao động từ 150/90 mmHg đến 160/95 mmHg.',
    pastMedicalHistory: 'Phát hiện Tăng huyết áp 4 năm, đang uống Amlodipine 5mg/ngày nhưng hay quên thuốc.',
    familyHistory: 'Mẹ đẻ bị Đột quỵ do Tăng huyết áp.',
    vitalSigns: {
      pulse: 88,
      bloodPressureSystolic: 158,
      bloodPressureDiastolic: 96,
      temperatureC: 36.8,
      respiratoryRate: 20,
      spo2: 97,
      weightKg: 64.0,
    },
    heightCm: 155,
    weightKg: 64.0,
    status: MedicalRecordStatus.open,
    queueStatus: QueueTicketStatus.called,
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 3: Chờ khám - Viêm da tiếp xúc dị ứng / Nổi mề đay cấp
  {
    patientCode: 'BN20260703',
    recordCode: 'BA20260703',
    fullName: 'PHẠM THỊ DUYÊN',
    gender: Gender.female,
    birthYear: 1994, // 32 tuổi
    phone: '0905123453',
    cmnd: '001194098703',
    address: '88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    bloodType: BloodType.B_PLUS,
    allergies: 'Dị ứng hải sản (tôm, cua), Dị ứng bụi nhà',
    insuranceCode: 'DN4010123450003',
    chiefComplaint: 'Nổi sẩn đỏ ngứa dữ dội toàn thân sau khi ăn tôm biển',
    historyOfPresentIllness:
      'Tối qua sau khi ăn tiệc hải sản 2 giờ, bệnh nhân xuất hiện các mảng ban đỏ rải rác ở 2 cẳng tay, ngực và lưng, ngứa ngáy nhiều về đêm gây mất ngủ. Đã dùng thuốc gãi trầy xước nhẹ vùng da bị tổn thương.',
    pastMedicalHistory: 'Cơ địa dị ứng thời tiết và hải sản.',
    familyHistory: 'Chị gái bị Viêm da cơ địa.',
    skinLesionTypes: ['Mảng đỏ', 'Sẩn mề đay'],
    skinLesionDescription: 'Nhiều sẩn mề đay màu hồng gờ cao trên mặt da, giới hạn rõ, rải rác cẳng tay và ngực.',
    skinLesionLocation: 'Cẳng tay 2 bên, ngực, lưng',
    skinLesionDistribution: medical_records_skinLesionDistribution.scattered,
    bodySurfaceAreaPercent: 15,
    itchSeverity: medical_records_itchSeverity.severe,
    vitalSigns: {
      pulse: 76,
      bloodPressureSystolic: 112,
      bloodPressureDiastolic: 72,
      temperatureC: 37.1,
      respiratoryRate: 18,
      spo2: 99,
      weightKg: 52.0,
    },
    heightCm: 160,
    weightKg: 52.0,
    status: MedicalRecordStatus.open,
    queueStatus: QueueTicketStatus.waiting,
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 4: Chờ kết quả cận lâm sàng - Nghi ngờ Đái tháo đường tuýp 2 / Tăng lipid máu
  {
    patientCode: 'BN20260704',
    recordCode: 'BA20260704',
    fullName: 'ĐẶNG MINH KHANH',
    gender: Gender.male,
    birthYear: 1978, // 48 tuổi
    phone: '0918223344',
    cmnd: '001078098704',
    address: '15 Lê Văn Lương, Cầu Giấy, Hà Nội',
    bloodType: BloodType.O_PLUS,
    allergies: 'Không ghi nhận',
    insuranceCode: 'DN4010123450004',
    chiefComplaint: 'Khát nước nhiều, sụt 4kg trong 1 tháng, tiểu đêm 4-5 lần',
    historyOfPresentIllness:
      'Bệnh nhân gầy sút cân nhanh trong vòng 1 tháng dù ăn uống tốt. Thường xuyên thấy khô miệng, khát nước, uống 3-4 lít nước/ngày. Đi tiểu nhiều lần cả ngày lẫn đêm, nước tiểu trong. Mắt có biểu hiện mờ nhẹ khi nhìn xa.',
    pastMedicalHistory: 'Thừa cân BMI 27.8, Tăng huyết áp nhẹ 135/85.',
    familyHistory: 'Bố đẻ mắc Đái tháo đường tuýp 2.',
    vitalSigns: {
      pulse: 80,
      bloodPressureSystolic: 135,
      bloodPressureDiastolic: 85,
      temperatureC: 36.9,
      respiratoryRate: 18,
      spo2: 98,
      weightKg: 82.0,
    },
    heightCm: 172,
    weightKg: 82.0,
    status: MedicalRecordStatus.waiting_results,
    queueStatus: QueueTicketStatus.served,
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 5: Chờ kết quả cận lâm sàng - Đợt cấp COPD / Khó thở hô hấp
  {
    patientCode: 'BN20260705',
    recordCode: 'BA20260705',
    fullName: 'HOÀNG VĂN GIANG',
    gender: Gender.male,
    birthYear: 1961, // 65 tuổi
    phone: '0945112235',
    cmnd: '001061098705',
    address: '67 Giải Phóng, Hai Bà Trưng, Hà Nội',
    bloodType: BloodType.AB_PLUS,
    allergies: 'Không',
    insuranceCode: 'HT2010123450005',
    chiefComplaint: 'Khó thở thì thở ra, ho khạc đờm màu vàng đục, mệt mỏi',
    historyOfPresentIllness:
      'Bệnh nhân có tiền sử Bệnh phổi tắc nghẽn mạn tính (COPD) 6 năm, tiền sử hút thuốc lá 30 năm. 3 ngày nay khi thời tiết chuyển lạnh, xuất hiện khó thở tăng dần cả khi nghỉ ngơi, ho nhiều đờm đục, rên rít ở hai phổi.',
    pastMedicalHistory: 'COPD độ II theo GOLD, Tiền sử Lao phổi đã điều trị khỏi cách đây 15 năm.',
    familyHistory: 'Không có gì đặc biệt.',
    vitalSigns: {
      pulse: 98,
      bloodPressureSystolic: 140,
      bloodPressureDiastolic: 88,
      temperatureC: 37.5,
      respiratoryRate: 25,
      spo2: 92,
      weightKg: 58.0,
    },
    heightCm: 165,
    weightKg: 58.0,
    status: MedicalRecordStatus.waiting_results,
    queueStatus: QueueTicketStatus.served,
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 6: Đã chẩn đoán - Viêm da tiếp xúc dị ứng cấp tính (ICD: L23.9)
  {
    patientCode: 'BN20260706',
    recordCode: 'BA20260706',
    fullName: 'NGUYỄN VĂN AN (DA LIỄU)',
    gender: Gender.male,
    birthYear: 1988,
    phone: '0912345676',
    cmnd: '001088098706',
    address: '12 Chùa Bộc, Đống Đa, Hà Nội',
    bloodType: BloodType.O_PLUS,
    allergies: 'Dị ứng Penicillin',
    insuranceCode: 'DN4010123450006',
    chiefComplaint: 'Nổi mẩn đỏ tiếp xúc hóa chất tẩy rửa, ngứa rát rải rác 2 bàn tay',
    historyOfPresentIllness:
      'Bệnh nhân tiếp xúc trực tiếp dung dịch tẩy rửa sinh hoạt 2 ngày trước, sau đó da 2 cẳng tay nổi mảng đỏ nốt mụn nước nhỏ liti, ngứa dữ dội.',
    pastMedicalHistory: 'Cơ địa dị ứng hóa chất.',
    familyHistory: 'Không',
    skinLesionTypes: ['Mụn nước', 'Mảng đỏ'],
    skinLesionDescription: 'Ban đỏ giới hạn rõ vùng cổ tay và mu bàn tay 2 bên.',
    skinLesionLocation: 'Hai cẳng tay và mu bàn tay',
    skinLesionDistribution: medical_records_skinLesionDistribution.localized,
    bodySurfaceAreaPercent: 5,
    itchSeverity: medical_records_itchSeverity.moderate,
    vitalSigns: {
      pulse: 75,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      temperatureC: 36.7,
      respiratoryRate: 18,
      spo2: 99,
      weightKg: 65.0,
    },
    heightCm: 168,
    weightKg: 65.0,
    status: MedicalRecordStatus.diagnosed,
    icd10: 'L23.9',
    diagnosisText: 'Viêm da tiếp xúc dị ứng cấp tính do hóa chất tẩy rửa',
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 7: Đã chẩn đoán - Vảy nến thể mảng mạn tính (ICD: L40.9)
  {
    patientCode: 'BN20260707',
    recordCode: 'BA20260707',
    fullName: 'LÊ HOÀNG CƯỜNG (VẢY NẾN)',
    gender: Gender.male,
    birthYear: 1985,
    phone: '0934567897',
    cmnd: '001085098707',
    address: '234 Kim Mã, Ba Đình, Hà Nội',
    bloodType: BloodType.A_MINUS,
    allergies: 'Dị ứng Aspirin',
    insuranceCode: 'DN4010123450007',
    chiefComplaint: 'Vảy nến mảng bám dầy ở khuỷu tay và đầu gối, bong tróc vảy trắng',
    historyOfPresentIllness:
      'Bệnh nhân bị vảy nến 3 năm nay. Đợt này stress do công việc khiến các mảng vảy đỏ dày lên, tróc vảy nhiều đợt như nến, kèm ngứa gãi trầy xước.',
    pastMedicalHistory: 'Vảy nến thể mảng mạn tính.',
    familyHistory: 'Chú ruột bị Vảy nến.',
    skinLesionTypes: ['Mảng vảy trắng', 'Nền da đỏ'],
    skinLesionDescription: 'Mảng tổn thương màu đỏ thẫm phủ vảy trắng ánh bạc, nghiệm pháp Auspitz dương tính.',
    skinLesionLocation: 'Khuỷu tay 2 bên, đầu gối 2 bên, vùng thắt lưng',
    skinLesionDistribution: medical_records_skinLesionDistribution.symmetric,
    bodySurfaceAreaPercent: 12,
    itchSeverity: medical_records_itchSeverity.mild,
    vitalSigns: {
      pulse: 78,
      bloodPressureSystolic: 124,
      bloodPressureDiastolic: 78,
      temperatureC: 36.8,
      respiratoryRate: 16,
      spo2: 98,
      weightKg: 72.0,
    },
    heightCm: 172,
    weightKg: 72.0,
    status: MedicalRecordStatus.diagnosed,
    icd10: 'L40.9',
    diagnosisText: 'Vảy nến, không đặc hiệu - Đợt bùng phát mạn tính',
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 8: Đã chẩn đoán - Hen chủ yếu dị ứng (ICD: J45.0)
  {
    patientCode: 'BN20260708',
    recordCode: 'BA20260708',
    fullName: 'VŨ THỊ HƯƠNG (HEN PHẾ QUẢN)',
    gender: Gender.female,
    birthYear: 2001,
    phone: '0967890128',
    cmnd: '001101098708',
    address: '56 Phạm Ngọc Thạch, Đống Đa, Hà Nội',
    bloodType: BloodType.O_PLUS,
    allergies: 'Phấn hoa, Lông chó mèo',
    insuranceCode: 'DN4010123450008',
    chiefComplaint: 'Cơn khó thở rên rít về đêm, ho hắt hơi khi thay đổi thời tiết',
    historyOfPresentIllness:
      'Bệnh nhân có tiền sử hen phế quản từ nhỏ. 2 ngày nay khi tiếp xúc với chó mèo xuất hiện cơn khó thở khò khè thì thở ra, phải ngồi dậy để thở.',
    pastMedicalHistory: 'Hen phế quản dị ứng, Viêm mũi dị ứng mạn tính.',
    familyHistory: 'Mẹ đẻ bị Hen phế quản.',
    vitalSigns: {
      pulse: 92,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 74,
      temperatureC: 37.0,
      respiratoryRate: 22,
      spo2: 96,
      weightKg: 48.0,
    },
    heightCm: 158,
    weightKg: 48.0,
    status: MedicalRecordStatus.diagnosed,
    icd10: 'J45.0',
    diagnosisText: 'Hen chủ yếu dị ứng - Đợt cấp mức độ nhẹ đến trung bình',
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 9: Đã chẩn đoán - Viêm da cơ địa (ICD: L20.9)
  {
    patientCode: 'BN20260709',
    recordCode: 'BA20260709',
    fullName: 'BÙI QUỐC NAM (CHÀM KHÔ)',
    gender: Gender.male,
    birthYear: 1990,
    phone: '0989012349',
    cmnd: '001090098709',
    address: '99 Ngô Quyền, Hoàn Kiếm, Hà Nội',
    bloodType: BloodType.AB_MINUS,
    allergies: 'Không',
    insuranceCode: 'DN4010123450009',
    chiefComplaint: 'Chàm khô 2 bàn tay, bong tróc da nứt nẻ chảy máu',
    historyOfPresentIllness:
      'Da 2 bàn tay bị khô ráp, ngứa rát kéo dài 6 tháng nay, nặng lên vào mùa khô. Gần đây xuất hiện các vết nứt nẻ rớm máu ở kẽ ngón tay.',
    pastMedicalHistory: 'Viêm da cơ địa từ tuổi thiếu niên.',
    familyHistory: 'Không',
    skinLesionTypes: ['Khô da', 'Vết nứt nẻ'],
    skinLesionDescription: 'Dày da, lichen hóa vùng nếp gấp cổ tay và các kẽ ngón tay 2 bên.',
    skinLesionLocation: 'Bàn tay và ngón tay 2 bên',
    skinLesionDistribution: medical_records_skinLesionDistribution.flexural,
    bodySurfaceAreaPercent: 4,
    itchSeverity: medical_records_itchSeverity.moderate,
    vitalSigns: {
      pulse: 74,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 78,
      temperatureC: 36.6,
      respiratoryRate: 17,
      spo2: 99,
      weightKg: 70.0,
    },
    heightCm: 174,
    weightKg: 70.0,
    status: MedicalRecordStatus.diagnosed,
    icd10: 'L20.9',
    diagnosisText: 'Viêm da cơ địa, không đặc hiệu (thể chàm khô bàn tay)',
    treatmentType: TreatmentType.outpatient,
  },

  // CASE 10: Ca Nội Trú Cấp Cứu / Đã chẩn đoán - Phản ứng dị ứng nghiêm trọng (ICD: T78.4)
  {
    patientCode: 'BN20260710',
    recordCode: 'BA20260710',
    fullName: 'TRỊNH VĂN HÙNG (NỘI TRÚ CẤP CỨU)',
    gender: Gender.male,
    birthYear: 1999,
    phone: '0936998810',
    cmnd: '001099098710',
    address: '18 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    bloodType: BloodType.O_MINUS,
    allergies: 'Dị ứng thuốc kháng sinh đường uống',
    insuranceCode: 'DN4010123450010',
    chiefComplaint: 'Nổi ban đỏ toàn thân, sưng môi mắt, khó thở nhẹ sau uống thuốc',
    historyOfPresentIllness:
      'Sau khi uống 1 viên thuốc kháng sinh tự mua tại nhà thuốc 45 phút, bệnh nhân xuất hiện phù quấn vùng mi mắt và môi, ban đỏ nổi rộn toàn thân, cảm giác tức ngực khó thở nhẹ. Được gia đình đưa ngay vào cấp cứu.',
    pastMedicalHistory: 'Chưa từng ghi nhận dị ứng thuốc trước đây.',
    familyHistory: 'Không',
    isEmergency: true,
    emergencyReason: 'Phản ứng dị ứng thuốc cấp tính nghi ngờ tiền phản vệ',
    skinLesionTypes: ['Ban đỏ toàn thân', 'Phù mề đay'],
    skinLesionDescription: 'Ban đỏ sẩn mề đay lan tỏa toàn thân, phù nhẹ mi mắt 2 bên.',
    skinLesionLocation: 'Toàn thân, mặt, cổ, thân mình',
    skinLesionDistribution: medical_records_skinLesionDistribution.generalized,
    bodySurfaceAreaPercent: 45,
    itchSeverity: medical_records_itchSeverity.severe,
    vitalSigns: {
      pulse: 105,
      bloodPressureSystolic: 100,
      bloodPressureDiastolic: 65,
      temperatureC: 37.4,
      respiratoryRate: 24,
      spo2: 95,
      weightKg: 62.0,
    },
    heightCm: 169,
    weightKg: 62.0,
    status: MedicalRecordStatus.diagnosed,
    icd10: 'T78.4',
    diagnosisText: 'Phản ứng dị ứng nghiêm trọng do thuốc - Nhập viện nội trú theo dõi sát sinh hiệu',
    treatmentType: TreatmentType.inpatient,
  },
];

export async function seedClinicalDiagnosisData() {
  console.log('🩺 Starting Clinical Diagnosis Data Seeder...');

  // 1. Get doctors in system
  const doctors = await prisma.user.findMany({
    where: {
      OR: [
        { username: 'doctor' },
        { username: 'doctor.lane6' },
        { username: 'doctor.integration' },
        { permissions: { some: { role: { code: 'doctor' } } } },
      ],
    },
    include: { department: true },
  });

  if (doctors.length === 0) {
    console.error('❌ No doctor accounts found in database. Please run npm run seed:identity first!');
    return;
  }

  const primaryDoctor = doctors[0]!;
  console.log(`👨‍⚕️ Found ${doctors.length} doctor account(s). Primary doctor: ${primaryDoctor.username} (${primaryDoctor.fullName})`);

  // Find max queue ticket number to avoid unique constraint error
  const lastTicket = await prisma.queueTicket.findFirst({
    orderBy: { number: 'desc' },
  });
  let nextQueueNumber = (lastTicket?.number ?? 0) + 10;

  let countCreated = 0;

  for (let i = 0; i < sampleClinicalCases.length; i++) {
    const c = sampleClinicalCases[i]!;

    // Assign doctor round-robin
    const assignedDoctor = doctors[i % doctors.length]!;

    // Check if patient exists by CMND or patientCode
    let patient = await prisma.patient.findFirst({
      where: {
        OR: [{ patientCode: c.patientCode }, { identityCardNumber: c.cmnd }],
      },
    });

    if (patient) {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName: c.fullName,
          gender: c.gender,
          phoneNumber: c.phone,
          address: c.address,
          allergies: c.allergies,
          healthInsuranceCode: c.insuranceCode,
        },
      });
    } else {
      patient = await prisma.patient.create({
        data: {
          id: randomUUID(),
          patientCode: c.patientCode,
          fullName: c.fullName,
          gender: c.gender,
          dateOfBirth: new Date(`${c.birthYear}-05-20`),
          phoneNumber: c.phone,
          identityCardNumber: c.cmnd,
          address: c.address,
          province: 'Hà Nội',
          ward: 'Phường Hàng Bông',
          bloodType: c.bloodType,
          allergies: c.allergies,
          healthInsuranceCode: c.insuranceCode,
          healthInsuranceExpiryDate: new Date('2027-12-31'),
          emergencyContact: 'Người thân bệnh nhân',
          emergencyPhoneNumber: c.phone,
          privacyNoticeAccepted: true,
          privacyNoticeAcceptedAt: new Date(),
        },
      });
    }

    // Upsert Medical Record
    const medicalRecord = await prisma.medicalRecord.upsert({
      where: { recordCode: c.recordCode },
      create: {
        id: randomUUID(),
        recordCode: c.recordCode,
        patientId: patient.id,
        doctorId: assignedDoctor.id,
        departmentId: assignedDoctor.departmentId,
        status: c.status,
        treatmentType: c.treatmentType,
        isEmergency: c.isEmergency ?? false,
        emergencyReason: c.emergencyReason ?? null,
        chiefComplaint: c.chiefComplaint,
        historyOfPresentIllness: c.historyOfPresentIllness,
        pastMedicalHistory: c.pastMedicalHistory,
        familyHistory: c.familyHistory,
        skinLesionTypes: c.skinLesionTypes ? c.skinLesionTypes.join(', ') : null,
        skinLesionDescription: c.skinLesionDescription ?? null,
        skinLesionLocation: c.skinLesionLocation ?? null,
        skinLesionDistribution: c.skinLesionDistribution ?? null,
        bodySurfaceAreaPercent: c.bodySurfaceAreaPercent ?? null,
        itchSeverity: c.itchSeverity ?? null,
        heightCm: c.heightCm,
        weightKg: c.weightKg,
        vitalSigns: c.vitalSigns,
        vitalConfirmedBy: assignedDoctor.id,
        vitalConfirmedAt: new Date(),
        icd10: c.icd10 ?? null,
        icdCodingSystem: c.icd10 ? medical_records_icdCodingSystem.TT06_2026 : null,
        diagnosisText: c.diagnosisText ?? null,
        diagnosedBy: c.icd10 ? assignedDoctor.id : null,
        diagnosedAt: c.icd10 ? new Date() : null,
      },
      update: {
        status: c.status,
        treatmentType: c.treatmentType,
        doctorId: assignedDoctor.id,
        departmentId: assignedDoctor.departmentId,
        chiefComplaint: c.chiefComplaint,
        historyOfPresentIllness: c.historyOfPresentIllness,
        pastMedicalHistory: c.pastMedicalHistory,
        familyHistory: c.familyHistory,
        vitalSigns: c.vitalSigns,
        heightCm: c.heightCm,
        weightKg: c.weightKg,
        icd10: c.icd10 ?? null,
        diagnosisText: c.diagnosisText ?? null,
        diagnosedBy: c.icd10 ? assignedDoctor.id : null,
      },
    });

    // Create Queue Ticket if applicable
    if (c.queueStatus) {
      const existingTicket = await prisma.queueTicket.findUnique({
        where: { recordId: medicalRecord.id },
      });

      if (existingTicket) {
        await prisma.queueTicket.update({
          where: { id: existingTicket.id },
          data: { status: c.queueStatus },
        });
      } else {
        const ticketNum = nextQueueNumber++;
        await prisma.queueTicket.create({
          data: {
            id: randomUUID(),
            number: ticketNum,
            date: new Date(),
            status: c.queueStatus,
            recordId: medicalRecord.id,
            calledAt: c.queueStatus === QueueTicketStatus.called ? new Date() : null,
            servedAt: c.queueStatus === QueueTicketStatus.served ? new Date() : null,
          },
        });
      }
    }

    // Create VitalSignLog
    await prisma.vitalSignLog.create({
      data: {
        id: randomUUID(),
        recordId: medicalRecord.id,
        pulse: c.vitalSigns.pulse,
        temperatureC: c.vitalSigns.temperatureC,
        bloodPressureSystolic: c.vitalSigns.bloodPressureSystolic,
        bloodPressureDiastolic: c.vitalSigns.bloodPressureDiastolic,
        respiratoryRate: c.vitalSigns.respiratoryRate,
        spo2: c.vitalSigns.spo2,
        weightKg: c.vitalSigns.weightKg,
        note: 'Sinh hiệu tiếp nhận ban đầu tại quầy',
        recordedBy: assignedDoctor.id,
        measuredAt: new Date(),
      },
    });

    countCreated++;
    console.log(
      `  [${i + 1}/${sampleClinicalCases.length}] ${c.recordCode} | BN: ${c.fullName} (${c.gender}) | Trạng thái: ${c.status} | Bác sĩ: ${assignedDoctor.username}`
    );
  }

  console.log(`\n✅ SUCCESSFULLY SEEDED ${countCreated} REALISTIC CLINICAL DIAGNOSIS TEST CASES!`);
}

if (require.main === module) {
  seedClinicalDiagnosisData()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('❌ Error seeding clinical diagnosis data:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
