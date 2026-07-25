import crypto from 'crypto';
import {
  PrismaClient,
  DepartmentType,
  RoomType,
  BedStatus,
  MedicalRecordStatus,
  TreatmentType,
  Gender,
  TreatmentOrderStatus,
  SpecimenStatus,
  medical_records_icdCodingSystem,
  medical_records_diagnosisSignatureMethod
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const lastNames = ['NGUYỄN', 'TRẦN', 'LÊ', 'PHẠM', 'HOÀNG', 'HUỲNH', 'VŨ', 'VÕ', 'ĐẶNG', 'BÙI', 'ĐỖ', 'HỒ', 'NGÔ', 'DƯƠNG', 'LÝ'];
const middleNames = ['VĂN', 'THỊ', 'ĐỨC', 'MINH', 'THANH', 'ANH', 'HỮU', 'NGỌC', 'ĐÌNH', 'XUÂN'];
const firstNames = ['AN', 'BÌNH', 'CƯỜNG', 'DŨNG', 'GIANG', 'HẢI', 'HƯƠNG', 'KHANH', 'LAM', 'NAM', 'OANH', 'PHÚC', 'QUÂN', 'SƠN', 'TÂM', 'UYÊN', 'VINH', 'YẾN', 'LONG', 'HÀ'];

const diagnoses = [
  { icd10: 'L23.9', text: 'Viêm da tiếp xúc dị ứng mạn tính' },
  { icd10: 'L40.0', text: 'Vảy nến thể mảng - Đợt bùng phát' },
  { icd10: 'T78.4', text: 'Phản ứng dị ứng nghiêm trọng' },
  { icd10: 'L30.9', text: 'Viêm da cơ địa ổn định' },
  { icd10: 'L50.0', text: 'Mề đay cấp tính' },
  { icd10: 'L10.0', text: 'Pemphigus vulgaris' },
  { icd10: 'B02.9', text: 'Zona thần kinh vùng ngực' },
  { icd10: 'L20.8', text: 'Viêm da dị ứng thể chàm' },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pad(num: number, size: number): string {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

async function main() {
  console.log('Start seeding 100 Patients & Medical Records for Lane 6...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS vital_sign_logs (
      id VARCHAR(36) PRIMARY KEY,
      recordId VARCHAR(36) NOT NULL,
      treatmentOrderId VARCHAR(36) NULL,
      measuredAt DATETIME(3) NOT NULL,
      pulse INT NOT NULL,
      temperatureC DECIMAL(4,1) NULL,
      bloodPressureSystolic INT NOT NULL,
      bloodPressureDiastolic INT NOT NULL,
      respiratoryRate INT NULL,
      spo2 INT NOT NULL,
      weightKg DECIMAL(5,1) NULL,
      note VARCHAR(500) NULL,
      recordedBy VARCHAR(36) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await prisma.$executeRaw`DELETE FROM vital_sign_logs`;
  } catch {}
  await prisma.treatmentOrder.deleteMany();
  await prisma.dischargeSummary.deleteMany();
  await prisma.bedAssignment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();

  // 1. Department
  const dept = await prisma.department.create({
    data: {
      id: 'dept-inpatient-01',
      code: 'DL',
      name: 'Khoa Da Liễu',
      type: DepartmentType.clinical,
    },
  });

  // 2. Roles
  const doctorRole = await prisma.role.create({
    data: {
      code: 'doctor',
      name: 'Bác sĩ',
      description: 'Bác sĩ điều trị',
    },
  });

  const nurseRole = await prisma.role.create({
    data: {
      code: 'nurse',
      name: 'Điều dưỡng',
      description: 'Điều dưỡng chăm sóc',
    },
  });

  // 3. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const doctor = await prisma.user.create({
    data: {
      id: 'usr-doc-01',
      username: 'doctor.lane6',
      password: passwordHash,
      fullName: 'BS. Trần Văn Khoa',
      gender: Gender.male,
      dateOfBirth: new Date('1980-01-01'),
      phoneNumber: '0901234567',
      identityCardNumber: '001080123456',
      departmentId: dept.id,
    },
  });

  const nurse = await prisma.user.create({
    data: {
      id: 'usr-nurse-01',
      username: 'nurse.lane6',
      password: passwordHash,
      fullName: 'ĐD. Nguyễn Thị Mai',
      gender: Gender.female,
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '0907654321',
      identityCardNumber: '001090123456',
      departmentId: dept.id,
    },
  });

  // 4. Rooms & Beds (10 rooms, 4 beds each = 40 beds)
  const createdBeds: any[] = [];
  for (let r = 101; r <= 110; r++) {
    const room = await prisma.room.create({
      data: {
        code: `${r}`,
        name: `Phòng ${r}`,
        departmentId: dept.id,
        roomType: RoomType.inpatient,
      },
    });

    const letters = ['A', 'B', 'C', 'D'];
    for (const l of letters) {
      const bed = await prisma.bed.create({
        data: {
          roomId: room.id,
          number: `${r}-${l}`,
          dailyRate: 150000,
          status: BedStatus.available,
        },
      });
      createdBeds.push(bed);
    }
  }

  // 5. Generate 100 Patients & Medical Records
  // Reserve beds 101-D and 102-C for the 2 unidentified emergency patients seeded below (step 5b) —
  // excluded from the round-robin so they don't get taken by a random named patient.
  const emergencyBedNumbers = ['101-D', '102-C'];
  const reservedBeds = createdBeds.filter((b) => emergencyBedNumbers.includes(b.number));
  const generalBeds = createdBeds.filter((b) => !emergencyBedNumbers.includes(b.number));
  let availableBedIdx = 0;

  for (let i = 1; i <= 100; i++) {
    const lastName = getRandomItem(lastNames);
    const middleName = getRandomItem(middleNames);
    const firstName = getRandomItem(firstNames);
    const fullName = `${lastName} ${middleName} ${firstName}`;
    const gender = middleName === 'THỊ' ? Gender.female : Gender.male;
    const birthYear = 1950 + Math.floor(Math.random() * 50);
    const patientCode = `BN2607${pad(i, 4)}`;
    const recordCode = `BA2607${pad(i, 4)}`;
    const hasAllergyRisk = i > 30 && i % 6 === 0;

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        fullName,
        gender,
        dateOfBirth: new Date(`${birthYear}-05-15`),
        phoneNumber: `098${pad(i, 7)}`,
        identityCardNumber: `001${pad(birthYear % 100, 2)}${pad(i, 7)}`,
        privacyNoticeAccepted: true,
        privacyNoticeAcceptedAt: new Date(),
        allergies: hasAllergyRisk ? 'Dị ứng Penicillin, Amoxicillin' : null,
      },
    });

    const diag = getRandomItem(diagnoses);

    // First ~30 records wait for beds (bedId = null).
    // Next 35 records get beds assigned.
    // Next 5 records are marked for discharge.
    const shouldAssignBed = i > 30 && availableBedIdx < generalBeds.length;
    const isDischargeTarget = i > 30 && i <= 35;

    const record = await prisma.medicalRecord.create({
      data: {
        recordCode,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: dept.id,
        status: MedicalRecordStatus.diagnosed,
        icd10: diag.icd10,
        icdCodingSystem: medical_records_icdCodingSystem.TT06_2026,
        diagnosisText: diag.text,
        diagnosedBy: doctor.id,
        diagnosedAt: new Date(),
        diagnosisSignedBy: doctor.id,
        diagnosisSignedAt: new Date(),
        diagnosisSignatureMethod: medical_records_diagnosisSignatureMethod.dev_e_confirmation,
        treatmentType: TreatmentType.inpatient,
      },
    });

    if (shouldAssignBed) {
      const targetBed = generalBeds[availableBedIdx];
      availableBedIdx++;

      await prisma.bedAssignment.create({
        data: {
          recordId: record.id,
          bedId: targetBed.id,
          assignedBy: nurse.id,
          assignedAt: new Date(),
          dailyRateSnapshot: targetBed.dailyRate,
          note: isDischargeTarget ? 'Chờ hoàn tất thủ tục xuất viện' : 'Bệnh nhân ổn định',
        },
      });

      await prisma.bed.update({
        where: { id: targetBed.id },
        data: {
          status: BedStatus.occupied,
          patientId: patient.id,
          assignedAt: new Date(),
        },
      });

      await prisma.medicalRecord.update({
        where: { id: record.id },
        data: { bedId: targetBed.id },
      });

      // Create sample Treatment Order
      const orderTypeCycle: Array<'medication' | 'monitoring' | 'care' | 'diet' | 'procedure'> = [
        'medication',
        'monitoring',
        'care',
        'diet',
        'procedure',
      ];
      const orderType = hasAllergyRisk ? 'medication' : orderTypeCycle[i % orderTypeCycle.length]!;
      const orderContentByType: Record<string, string> = {
        medication: 'Corticoid thoa ngoài da 2 lần/ngày (Sáng - Tối)',
        monitoring: 'Theo dõi mạch, huyết áp mỗi 4 giờ',
        care: 'Thay băng vết thương, vệ sinh vùng tổn thương',
        diet: 'Chế độ ăn nhạt, hạn chế đạm động vật',
        procedure: 'Chuẩn bị bệnh nhân cho thủ thuật sinh thiết da',
      };
      const shiftHours = [7, 11, 15, 19, 23];
      const orderedAtDate = new Date();
      orderedAtDate.setHours(shiftHours[i % shiftHours.length]!, 0, 0, 0);

      await prisma.treatmentOrder.create({
        data: {
          recordId: record.id,
          orderType,
          content: orderContentByType[orderType]!,
          note: hasAllergyRisk
            ? 'Bệnh nhân có tiền sử dị ứng - kiểm tra kỹ trước khi dùng thuốc'
            : 'Theo dõi phản ứng trên da',
          status: isDischargeTarget ? TreatmentOrderStatus.done : TreatmentOrderStatus.active,
          orderedBy: doctor.id,
          orderedAt: orderedAtDate,
          ...(isDischargeTarget
            ? {
                executedBy: nurse.id,
                executedAt: new Date(),
              }
            : {}),
        },
      });

      // Seed signed discharge summary for discharge targets
      if (isDischargeTarget) {
        await prisma.dischargeSummary.create({
          data: {
            recordId: record.id,
            dischargeDiagnosis: `${diag.text} - Đã ổn định`,
            icd10: diag.icd10,
            treatmentSummary: 'Điều trị nội trú 7 ngày, tình trạng tổn thương da giảm 90%.',
            dischargeCondition: 'improved',
            doctorAdvice: 'Tiếp tục dưỡng ẩm, tái khám sau 2 tuần.',
            signedBy: doctor.id,
            signedAt: new Date(),
          },
        });
      }
    }
  }

  // 5b. Seed 2 unidentified emergency patients (Lane 6 "Chuẩn hóa cấp cứu") on the reserved beds.
  console.log('Seeding unidentified emergency patients...');
  const emergencyCases = [
    {
      code: 'EMG01',
      fullName: 'Vô danh Nam - Cấp cứu',
      gender: Gender.male,
      bed: reservedBeds[0],
      admittedHoursAgo: 3,
      emergencyReason:
        'Phản ứng dị ứng nghiêm trọng, khó thở, nổi mề đay toàn thân. Bypass thủ tục hành chính khẩn cấp.',
    },
    {
      code: 'EMG02',
      fullName: 'Vô danh Nữ - Cấp cứu',
      gender: Gender.female,
      bed: reservedBeds[1],
      admittedHoursAgo: 20,
      emergencyReason: 'Tai nạn giao thông, chấn thương đầu, bất tỉnh khi nhập viện. Không có giấy tờ tùy thân.',
    },
  ];

  for (const c of emergencyCases) {
    if (!c.bed) continue;
    const admittedAt = new Date(Date.now() - c.admittedHoursAgo * 60 * 60 * 1000);

    const emergencyPatient = await prisma.patient.create({
      data: {
        patientCode: `BN2607-${c.code}`,
        fullName: c.fullName,
        gender: c.gender,
        isEmergencyBypass: true,
        emergencyReason: c.emergencyReason,
        privacyNoticeAccepted: false,
      },
    });

    const emergencyRecord = await prisma.medicalRecord.create({
      data: {
        recordCode: `BA2607-${c.code}`,
        patientId: emergencyPatient.id,
        doctorId: doctor.id,
        departmentId: dept.id,
        status: MedicalRecordStatus.diagnosed,
        isEmergency: true,
        emergencyReason: c.emergencyReason,
        icd10: 'Z04.9',
        icdCodingSystem: medical_records_icdCodingSystem.TT06_2026,
        diagnosisText: 'Chưa xác định danh tính - Đang cấp cứu, chờ chuẩn hóa hồ sơ',
        diagnosedBy: doctor.id,
        diagnosedAt: admittedAt,
        diagnosisSignedBy: doctor.id,
        diagnosisSignedAt: admittedAt,
        diagnosisSignatureMethod: medical_records_diagnosisSignatureMethod.dev_e_confirmation,
        treatmentType: TreatmentType.inpatient,
        bedId: c.bed.id,
        createdAt: admittedAt,
      },
    });

    await prisma.bedAssignment.create({
      data: {
        recordId: emergencyRecord.id,
        bedId: c.bed.id,
        assignedBy: nurse.id,
        assignedAt: admittedAt,
        dailyRateSnapshot: c.bed.dailyRate,
        note: 'Bệnh nhân vô danh cấp cứu - chờ chuẩn hóa danh tính',
      },
    });

    await prisma.bed.update({
      where: { id: c.bed.id },
      data: { status: BedStatus.occupied, patientId: emergencyPatient.id, assignedAt: admittedAt },
    });
  }

  // 6. Seed queue_tickets for today using raw SQL
  console.log('Seeding queue_tickets for today...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS queue_tickets (
      id VARCHAR(36) PRIMARY KEY,
      number INT NOT NULL,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'waiting',
      calledAt DATETIME(3) NULL,
      servedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await prisma.$executeRaw`DELETE FROM queue_tickets WHERE date = CURDATE()`;

  for (let n = 1; n <= 10; n++) {
    const tId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO queue_tickets (id, number, date, status, calledAt, servedAt, createdAt)
      VALUES (${tId}, ${n}, CURDATE(), 'waiting', NULL, NULL, NOW() - INTERVAL 30 MINUTE)
    `;
  }

  // 7. Seed SpecimenCollections
  console.log('Seeding SpecimenCollections...');
  await prisma.specimenCollection.deleteMany();

  const sampleRecords = await prisma.medicalRecord.findMany({
    take: 10,
    include: { patient: true, department: true },
  });

  if (sampleRecords.length > 0) {
    const specimensToCreate = [
      // 8 pending (2 priority)
      { idx: 0, code: 'DL-2607-001', type: 'Máu toàn phần (EDTA)', desc: 'Chỉ định: Công thức máu', status: SpecimenStatus.pending, priority: true },
      { idx: 0, code: 'DL-2607-002', type: 'Sinh thiết da (GAP)', desc: 'Chỉ định: Mổ sinh thiết chẩn đoán', status: SpecimenStatus.pending, priority: false },
      { idx: 1, code: 'DL-2607-003', type: 'Huyết thanh (Clot Activator)', desc: 'Chỉ định: Sinh hóa máu toàn bộ', status: SpecimenStatus.pending, priority: false },
      { idx: 2, code: 'DL-2607-004', type: 'Máu toàn phần (EDTA)', desc: 'Chỉ định: Định nhóm máu ABO/Rh', status: SpecimenStatus.pending, priority: false },
      { idx: 3, code: 'DL-2607-005', type: 'Vảy da dán kính', desc: 'Chỉ định: Soi tươi nấm da', status: SpecimenStatus.pending, priority: false },
      { idx: 4, code: 'DL-2607-006', type: 'Nước tiểu 10 thông số', desc: 'Chỉ định: Phân tích nước tiểu', status: SpecimenStatus.pending, priority: false },
      { idx: 5, code: 'DL-2607-007', type: 'Máu toàn phần (EDTA)', desc: 'Chỉ định: Công thức máu cấp cứu', status: SpecimenStatus.pending, priority: true },
      { idx: 6, code: 'DL-2607-008', type: 'Dịch mủ vết thương', desc: 'Chỉ định: Nhuộm soi trực tiếp', status: SpecimenStatus.pending, priority: false },

      // 6 collected
      { idx: 1, code: 'DL-2607-009', type: 'Dịch phết thương tổn', desc: 'Chỉ định: Nuôi cấy vi khuẩn & KSĐ', status: SpecimenStatus.collected, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date() },
      { idx: 2, code: 'DL-2607-010', type: 'Huyết thanh (Clot Activator)', desc: 'Chỉ định: Xét nghiệm IgE toàn phần', status: SpecimenStatus.collected, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date() },
      { idx: 5, code: 'DL-2607-011', type: 'Máu toàn phần (EDTA)', desc: 'Chỉ định: Đông máu cơ bản (PT/APTT)', status: SpecimenStatus.collected, priority: true, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date() },
      { idx: 6, code: 'DL-2607-012', type: 'Sinh thiết da (GAP)', desc: 'Chỉ định: Miễn dịch huỳnh quang', status: SpecimenStatus.collected, priority: false, barcodePrinted: false, collectedBy: nurse.id, collectedAt: new Date() },
      { idx: 7, code: 'DL-2607-013', type: 'Nước tiểu 24h', desc: 'Chỉ định: Định lượng Đạm niệu 24h', status: SpecimenStatus.collected, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date() },
      { idx: 8, code: 'DL-2607-014', type: 'Huyết thanh (Clot Activator)', desc: 'Chỉ định: Xét nghiệm chức năng gan', status: SpecimenStatus.collected, priority: false, barcodePrinted: false, collectedBy: nurse.id, collectedAt: new Date() },

      // 6 handed_over
      { idx: 7, code: 'DL-2607-015', type: 'Huyết thanh (Clot Activator)', desc: 'Chỉ định: Xét nghiệm Giang mai (VDRL)', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Nguyễn Văn Lab' },
      { idx: 8, code: 'DL-2607-016', type: 'Nước tiểu 24h', desc: 'Chỉ định: Cấy nước tiểu tìm vi khuẩn', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Nguyễn Văn Lab' },
      { idx: 9, code: 'DL-2607-017', type: 'Máu toàn phần (EDTA)', desc: 'Chỉ định: Điện di Huyết hồng tố', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Trần Thị Nghiệm' },
      { idx: 9, code: 'DL-2607-018', type: 'Dịch phết thương tổn', desc: 'Chỉ định: Nuôi cấy nấm', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Trần Thị Nghiệm' },
      { idx: 0, code: 'DL-2607-019', type: 'Huyết thanh (Clot Activator)', desc: 'Chỉ định: Xét nghiệm HIV', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Nguyễn Văn Lab' },
      { idx: 1, code: 'DL-2607-020', type: 'Sinh thiết da (GAP)', desc: 'Chỉ định: Giải phẫu bệnh lý', status: SpecimenStatus.handed_over, priority: false, barcodePrinted: true, collectedBy: nurse.id, collectedAt: new Date(), handedOverBy: nurse.id, handedOverAt: new Date(), labReceiverName: 'KTV. Trần Thị Nghiệm' },
    ];

    for (const spec of specimensToCreate) {
      const rec = sampleRecords[spec.idx % sampleRecords.length];
      if (!rec) continue;
      await prisma.specimenCollection.create({
        data: {
          recordId: rec.id,
          patientCode: rec.patient.patientCode,
          patientName: rec.patient.fullName,
          departmentName: rec.department?.name || 'Khoa Da Liễu',
          specimenCode: spec.code,
          specimenType: spec.type,
          orderDescription: spec.desc,
          priority: spec.priority,
          status: spec.status,
          barcodePrinted: spec.barcodePrinted ?? false,
          collectedBy: spec.collectedBy,
          collectedAt: spec.collectedAt,
          handedOverBy: spec.handedOverBy,
          handedOverAt: spec.handedOverAt,
          labReceiverName: spec.labReceiverName,
        },
      });
    }
  }

  console.log(`Successfully seeded 100 Patients, 100 Medical Records, ${createdBeds.length} Beds, 10 Queue Tickets, and 20 Specimen Collections for Lane 6.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
