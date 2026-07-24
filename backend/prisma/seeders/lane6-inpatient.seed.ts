import { 
  PrismaClient, 
  DepartmentType, 
  RoomType, 
  BedStatus, 
  MedicalRecordStatus, 
  TreatmentType, 
  Gender,
  TreatmentOrderStatus,
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

  // Clean up existing data to allow re-seeding
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
      },
    });

    const diag = getRandomItem(diagnoses);

    // First ~30 records wait for beds (bedId = null).
    // Next 35 records get beds assigned.
    // Next 5 records are marked for discharge.
    const shouldAssignBed = i > 30 && availableBedIdx < createdBeds.length;
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
      const targetBed = createdBeds[availableBedIdx];
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
      await prisma.treatmentOrder.create({
        data: {
          recordId: record.id,
          orderType: 'medication',
          content: 'Corticoid thoa ngoài da 2 lần/ngày (Sáng - Tối)',
          note: 'Theo dõi phản ứng trên da',
          status: isDischargeTarget ? TreatmentOrderStatus.done : TreatmentOrderStatus.active,
          orderedBy: doctor.id,
          orderedAt: new Date(),
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

  console.log(`Successfully seeded 100 Patients, 100 Medical Records, and ${createdBeds.length} Beds for Lane 6.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
