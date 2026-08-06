/**
 * @file pharmacy-mock.data.ts
 * @description Dữ liệu giả lập làm fallback cho workspace, luồng nhập kho và preview XML khi phù hợp.
 * Đây không phải source of truth cho đơn thuốc, signed/paid gate, FEFO, stock movement hoặc persistence;
 * không dùng các giá trị này để quyết định cấp phát hay trừ kho.
 */

import type { StockReceipt, Prescription } from '../types/pharmacy.types';
import type {
  PharmacyInventoryBatch,
  PharmacyInventorySummary,
  PharmacyStockMovement,
  PharmacyWarehouse,
} from '../types/pharmacy-inventory.schema';

/** Escape ký tự đặc biệt trước khi đưa dữ liệu mock vào text node XML. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tạo chuỗi XML giả lập để preview/tải trình diễn từ view-model đơn thuốc.
 *
 * @param prescription Đối tượng đơn thuốc cần hiển thị trong preview XML.
 * @returns Chuỗi XML UTF-8 dùng cho preview/trình diễn.
 * @remarks Hàm không kiểm tra chữ ký, paid gate, allergy override hoặc FEFO và không cập nhật backend;
 * XML có giá trị nghiệp vụ phải do endpoint export ở server tạo và lưu.
 */
export function generatePrescriptionXml(prescription: Prescription): string {
  const patientGenderCode = prescription.patientGender === 'Nam' ? '1' : '2';
  const xmlExportedDate = prescription.xmlExportedAt
    ? prescription.xmlExportedAt.replace('Z', '')
    : new Date().toISOString().replace('Z', '');

  const itemsXml = prescription.items
    .map(
      (item, idx) => `    <THUOC>
      <STT>${idx + 1}</STT>
      <MA_THUOC>${escapeXml(item.drugId)}</MA_THUOC>
      <TEN_THUOC>${escapeXml(item.drugName)}</TEN_THUOC>
      <QUY_CACH>${escapeXml(item.spec)}</QUY_CACH>
      <DON_VI_TINH>${escapeXml(item.unit)}</DON_VI_TINH>
      <SO_LUONG>${item.quantity}</SO_LUONG>
      <LIEU_DUNG>${escapeXml(item.dosageInstruction)}</LIEU_DUNG>
      <SO_LO_FEFO>${escapeXml(item.fefoLotNumber)}</SO_LO_FEFO>
      <HAN_DUNG>${escapeXml(item.expiryDate)}</HAN_DUNG>
      <VI_TRI_KE>${escapeXml(item.shelfLocation)}</VI_TRI_KE>
    </THUOC>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<DON_THUOC_BO_Y_TE>
  <MA_DON_THUOC>${escapeXml(prescription.prescriptionCode ?? prescription.id)}</MA_DON_THUOC>
  <MA_DANG_KY_KCB>79001</MA_DANG_KY_KCB>
  <THONG_TIN_BENH_NHAN>
    <MA_BENH_NHAN>${escapeXml(prescription.patientId)}</MA_BENH_NHAN>
    <HO_TEN>${escapeXml(prescription.patientName)}</HO_TEN>
    <TUOI>${prescription.patientAge}</TUOI>
    <GIOI_TINH>${patientGenderCode}</GIOI_TINH>
    <MA_THE_BHYT>${escapeXml(prescription.bhytCardNumber ?? 'KHONG_BHYT')}</MA_THE_BHYT>
    <MUC_HUONG>${escapeXml(prescription.bhytRatio ?? 'Viện phí')}</MUC_HUONG>
    <LOAI_BENH_NHAN>${prescription.patientType === 'outpatient' ? 'Ngoại trú' : 'Nội trú'}</LOAI_BENH_NHAN>
  </THONG_TIN_BENH_NHAN>
  <CHAN_DOAN_CHUYEN_MON>
    <MA_ICD>${escapeXml(prescription.icdCode)}</MA_ICD>
    <TEN_CHAN_DOAN>${escapeXml(prescription.icdDiagnosis)}</TEN_CHAN_DOAN>
  </CHAN_DOAN_CHUYEN_MON>
  <DANH_SACH_THUOC_KE_DON>
${itemsXml}
  </DANH_SACH_THUOC_KE_DON>
  <XAC_NHAN_BAC_SI>
    <BAC_SI_KE_DON>${escapeXml(prescription.doctorName)}</BAC_SI_KE_DON>
    <KHOA_PHONG>${escapeXml(prescription.department)}</KHOA_PHONG>
    <THOI_GIAN_KY_SO>${escapeXml(prescription.signedAt)}</THOI_GIAN_KY_SO>
    <HOA_DON_VIEN_PHI>${escapeXml(prescription.invoiceId ?? 'N/A')}</HOA_DON_VIEN_PHI>
  </XAC_NHAN_BAC_SI>
  <CAP_PHAT_DUOC_SI>
    <DUOC_SI_THUC_HIEN>DS. Phạm Thanh Hà</DUOC_SI_THUC_HIEN>
    <KHO_XUAT_THUOC>${escapeXml(prescription.warehouseName ?? 'Kho Ngoại trú A')}</KHO_XUAT_THUOC>
    <THOI_GIAN_KET_XUAT_XML>${xmlExportedDate}</THOI_GIAN_KET_XUAT_XML>
    <TRANG_THAI_CAP_PHAT>${prescription.status === 'dispensed' ? 'Đã cấp phát' : 'Chờ cấp phát'}</TRANG_THAI_CAP_PHAT>
  </CAP_PHAT_DUOC_SI>
</DON_THUOC_BO_Y_TE>`;
}

/**
 * Danh sách kho giả lập cho bộ lọc và form pharmacy.
 * ID, tên và trạng thái trong mảng này không thay thế danh sách warehouse từ API thật.
 */
export const mockWarehousesList: PharmacyWarehouse[] = [
  {
    warehouseId: 'warehouse-out-a-0001',
    code: 'OUT-A',
    name: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
  },
  {
    warehouseId: 'warehouse-in-b-0001',
    code: 'IN-B',
    name: 'Kho Nội trú B (Kho Dược Trung tâm)',
  },
  {
    warehouseId: 'warehouse-emerg-c-0001',
    code: 'EMERG-C',
    name: 'Kho Tủ trực Cấp cứu',
  },
];

/**
 * Danh sách đơn thuốc giả lập cho trạng thái hiển thị của màn hình pharmacy.
 * Các cờ signed/paid, allergy, FEFO và cấp phát chỉ là fixture; command thật phải dùng response/backend.
 */
export const mockPrescriptionsList: Prescription[] = [
  {
    id: '0891',
    backendPrescriptionId: 'rx-20260720-0001-mock',
    backendVersion: 1,
    prescriptionCode: '#DON-0891',
    patientId: 'BN-2026-0089',
    patientName: 'Trần Minh Linh',
    patientAge: 36,
    patientGender: 'Nam',
    bhytCardNumber: 'BHYT-791028391',
    bhytRatio: 'Ngoại trú BHYT 80%',
    patientType: 'outpatient',
    icdCode: 'L20.8',
    icdDiagnosis: 'Viêm da cơ địa dị ứng cấp tính',
    doctorName: 'BS. CKII Lê Hoàng Nam',
    department: 'Khoa Khám bệnh',
    signedAt: '20/07/2026 07:15',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2026-0891',
    hasAllergyWarning: false,
    items: [
      {
        drugId: 'med-clobetasol',
        drugName: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
        spec: 'Kem bôi da tuýp 30g',
        categoryLabel: 'Thuốc bôi ngoài da',
        quantity: 2,
        unit: 'tuýp',
        dosageInstruction: 'Bôi mỏng vùng da tổn thương 2 lần/ngày (sáng, tối)',
        fefoLotNumber: 'LOT-20260799',
        shelfLocation: 'Kệ A-01-02',
        availableStock: 450,
        expiryDate: '01/06/2028',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-20260799',
            expiryDate: '01/06/2028',
            quantityAllocated: 2,
            balanceAfter: 448,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
      {
        drugId: 'med-cetirizine',
        drugName: 'Cetirizine Dihydrochloride 10mg',
        spec: 'Viên nén bao phim Hộp 100 viên',
        categoryLabel: 'Thuốc kháng Histamin',
        quantity: 20,
        unit: 'viên',
        dosageInstruction: 'Uống 1 viên vào buổi tối sau ăn',
        fefoLotNumber: 'LOT-CET-2026A',
        shelfLocation: 'Kệ A-02-05',
        availableStock: 1200,
        expiryDate: '15/12/2027',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-CET-2026A',
            expiryDate: '15/12/2027',
            quantityAllocated: 20,
            balanceAfter: 1180,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
    ],
    status: 'pending',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
  },
  {
    id: '0892',
    backendPrescriptionId: 'rx-20260720-0002-mock',
    backendVersion: 1,
    prescriptionCode: '#DON-0892',
    patientId: 'BN-2026-0104',
    patientName: 'Phạm Thị Thu Hà',
    patientAge: 42,
    patientGender: 'Nữ',
    bhytCardNumber: 'BHYT-791054321',
    bhytRatio: 'Ngoại trú BHYT 80%',
    patientType: 'outpatient',
    icdCode: 'L40.0',
    icdDiagnosis: 'Vẩy nến thể mảng thông thường (Psoriasis vulgaris)',
    doctorName: 'BS. CKI Phùng Thị Hoa',
    department: 'Khoa Đào tạo & Điều trị Da liễu',
    signedAt: '20/07/2026 07:45',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2026-0892',
    hasAllergyWarning: false,
    items: [
      {
        drugId: 'med-daivobet',
        drugName: 'Daivobet Ointment (Calcipotriol/Betamethasone) 30g',
        spec: 'Mỡ bôi ngoài da tuýp 30g',
        categoryLabel: 'Thuốc bôi đặc trị vẩy nến',
        quantity: 1,
        unit: 'tuýp',
        dosageInstruction: 'Bôi sang tổn thương 1 lần/ngày vào buổi tối',
        fefoLotNumber: 'LOT-DAI-202609',
        shelfLocation: 'Kệ A-04-01',
        availableStock: 180,
        expiryDate: '18/09/2027',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-DAI-202609',
            expiryDate: '18/09/2027',
            quantityAllocated: 1,
            balanceAfter: 179,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
      {
        drugId: 'med-methotrexate',
        drugName: 'Methotrexate 2.5mg',
        spec: 'Viên nén Hộp 100 viên',
        categoryLabel: 'Thuốc ức chế miễn dịch',
        quantity: 10,
        unit: 'viên',
        dosageInstruction: 'Uống 3 viên/tuần chia 2 lần cách nhau 12 giờ',
        fefoLotNumber: 'LOT-MTX-202601',
        shelfLocation: 'Kệ B-03-01',
        availableStock: 350,
        expiryDate: '10/11/2027',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-MTX-202601',
            expiryDate: '10/11/2027',
            quantityAllocated: 10,
            balanceAfter: 340,
            warehouseName: 'Kho Nội trú B (Kho Dược Trung tâm)',
          },
        ],
      },
    ],
    status: 'pending',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
  },
  {
    id: '0893',
    backendPrescriptionId: 'rx-20260720-0003-mock',
    backendVersion: 1,
    prescriptionCode: '#DON-0893',
    patientId: 'BN-2026-0158',
    patientName: 'Nguyễn Hoàng Long',
    patientAge: 24,
    patientGender: 'Nam',
    bhytRatio: 'Viện phí',
    patientType: 'outpatient',
    icdCode: 'L70.0',
    icdDiagnosis: 'Mụn trứng cá bọc nặng kèm nang viêm',
    doctorName: 'BS. Nguyễn Thanh Tùng',
    department: 'Khoa Thẩm mỹ Da',
    signedAt: '20/07/2026 08:10',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2026-0893',
    hasAllergyWarning: true,
    allergyWarningText: 'Dị ứng tiền sử: Kháng sinh nhóm Tetracycline',
    allergyOverrideReason: 'Đã tư vấn BN và đổi sang Isotretinoin đường uống không chứa nhóm dị ứng',
    allergyOverrideMeta: 'BS. Nguyễn Thanh Tùng xác nhận ký ghi đè lúc 20/07/2026 08:10',
    items: [
      {
        drugId: 'med-isotretinoin',
        drugName: 'Isotretinoin 10mg (Softgel)',
        spec: 'Viên nang mềm Hộp 30 viên',
        categoryLabel: 'Thuốc điều trị mụn trứng cá',
        quantity: 30,
        unit: 'viên',
        dosageInstruction: 'Uống 1 viên/ngày sau bữa ăn nhiều chất béo',
        fefoLotNumber: 'LOT-ISO-202605',
        shelfLocation: 'Kệ B-01-04',
        availableStock: 600,
        expiryDate: '30/04/2028',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-ISO-202605',
            expiryDate: '30/04/2028',
            quantityAllocated: 30,
            balanceAfter: 570,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
    ],
    status: 'pending',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
  },
  {
    id: '0894',
    backendPrescriptionId: 'rx-20260720-0004-mock',
    backendVersion: 2,
    prescriptionCode: '#DON-0894',
    patientId: 'BN-2026-0210',
    patientName: 'Hoàng Thị Khánh',
    patientAge: 58,
    patientGender: 'Nữ',
    bhytCardNumber: 'BHYT-791108877',
    bhytRatio: 'Ngoại trú BHYT 80%',
    patientType: 'outpatient',
    icdCode: 'B02.2',
    icdDiagnosis: 'Zona thần kinh liên sườn kèm đau sau Zona',
    doctorName: 'BS. CKII Lê Hoàng Nam',
    department: 'Khoa Khám bệnh',
    signedAt: '20/07/2026 08:20',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2026-0894',
    hasAllergyWarning: false,
    items: [
      {
        drugId: 'med-acyclovir',
        drugName: 'Acyclovir 800mg',
        spec: 'Viên nén Hộp 35 viên',
        categoryLabel: 'Thuốc kháng Virus',
        quantity: 35,
        unit: 'viên',
        dosageInstruction: 'Uống 1 viên/lần x 5 lần/ngày cách nhau 4 giờ trong 7 ngày',
        fefoLotNumber: 'LOT-ACY-202602',
        shelfLocation: 'Kệ A-03-02',
        availableStock: 800,
        expiryDate: '22/01/2028',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-ACY-202602',
            expiryDate: '22/01/2028',
            quantityAllocated: 35,
            balanceAfter: 765,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
      {
        drugId: 'med-paracetamol',
        drugName: 'Paracetamol 500mg',
        spec: 'Viên nén Hộp 100 viên',
        categoryLabel: 'Thuốc giảm đau hạ sốt',
        quantity: 20,
        unit: 'viên',
        dosageInstruction: 'Uống 1 viên khi đau nhiều, cách tối thiểu 4-6 giờ',
        fefoLotNumber: 'LOT-PAR-202608',
        shelfLocation: 'Kệ A-01-01',
        availableStock: 2500,
        expiryDate: '15/07/2028',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-PAR-202608',
            expiryDate: '15/07/2028',
            quantityAllocated: 20,
            balanceAfter: 2480,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
    ],
    status: 'dispensed',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
    xmlExportedAt: '2026-07-20T08:35:10Z',
  },
  {
    id: '0895',
    backendPrescriptionId: 'rx-20260720-0005-mock',
    backendVersion: 1,
    prescriptionCode: '#DON-0895',
    patientId: 'BN-2026-0245',
    patientName: 'Vũ Đăng Khoa',
    patientAge: 29,
    patientGender: 'Nam',
    bhytCardNumber: 'BHYT-791129900',
    bhytRatio: 'Ngoại trú BHYT 80%',
    patientType: 'outpatient',
    icdCode: 'B35.3',
    icdDiagnosis: 'Nấm kẽ chân do Trichophyton rubrum',
    doctorName: 'BS. CKI Phùng Thị Hoa',
    department: 'Khoa Đào tạo & Điều trị Da liễu',
    signedAt: '20/07/2026 08:45',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2026-0895',
    hasAllergyWarning: false,
    items: [
      {
        drugId: 'med-terbinafine',
        drugName: 'Terbinafine 250mg',
        spec: 'Viên nén Hộp 28 viên',
        categoryLabel: 'Thuốc kháng nấm đường uống',
        quantity: 14,
        unit: 'viên',
        dosageInstruction: 'Uống 1 viên/ngày sau bữa ăn trong 2 tuần',
        fefoLotNumber: 'LOT-TER-202604',
        shelfLocation: 'Kệ A-02-01',
        availableStock: 420,
        expiryDate: '09/09/2027',
        isStockSufficient: true,
        fefoAllocations: [
          {
            batchNumber: 'LOT-TER-202604',
            expiryDate: '09/09/2027',
            quantityAllocated: 14,
            balanceAfter: 406,
            warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
          },
        ],
      },
    ],
    status: 'pending',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoại trú A (Nhà thuốc Bệnh viện Da liễu)',
  },
];

/**
 * Danh sách batch tồn kho giả lập theo FEFO để trình bày bảng kho.
 * Hạn dùng dùng ngày ISO `YYYY-MM-DD`, `daysToExpiry` là số ngày lịch và `importPrice` là chuỗi giá trị
 * tiền tệ; các cờ cảnh báo không được dùng làm quyết định ghi kho ở client.
 */
export const mockInventoryBatchesList: PharmacyInventoryBatch[] = [
  {
    batchId: 'batch-001',
    batchNumber: 'LOT-20260799',
    daysToExpiry: 681,
    expiryDate: '2028-06-01',
    importPrice: '38000',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Clobetasol Propionate 0.05%',
      code: 'THU-0012',
      coveredByHealthInsurance: true,
      dosage: 'Kem bôi da 0.05%',
      medicineId: 'med-clobetasol',
      name: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
      unit: 'tuýp',
    },
    quantity: 450,
    version: 1,
    warehouse: mockWarehousesList[0],
  },
  {
    batchId: 'batch-002',
    batchNumber: 'LOT-CET-2026A',
    daysToExpiry: 513,
    expiryDate: '2027-12-15',
    importPrice: '1200',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Cetirizine Dihydrochloride 10mg',
      code: 'THU-0045',
      coveredByHealthInsurance: true,
      dosage: 'Viên nén 10mg',
      medicineId: 'med-cetirizine',
      name: 'Cetirizine Dihydrochloride 10mg',
      unit: 'viên',
    },
    quantity: 1200,
    version: 1,
    warehouse: mockWarehousesList[0],
  },
  {
    batchId: 'batch-003',
    batchNumber: 'LOT-ISO-202605',
    daysToExpiry: 649,
    expiryDate: '2028-04-30',
    importPrice: '15000',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Isotretinoin 10mg',
      code: 'THU-0089',
      coveredByHealthInsurance: false,
      dosage: 'Viên nang mềm 10mg',
      medicineId: 'med-isotretinoin',
      name: 'Isotretinoin 10mg (Softgel)',
      unit: 'viên',
    },
    quantity: 600,
    version: 1,
    warehouse: mockWarehousesList[0],
  },
  {
    batchId: 'batch-004',
    batchNumber: 'LOT-MTX-202601',
    daysToExpiry: 478,
    expiryDate: '2027-11-10',
    importPrice: '4500',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Methotrexate 2.5mg',
      code: 'THU-0102',
      coveredByHealthInsurance: true,
      dosage: 'Viên nén 2.5mg',
      medicineId: 'med-methotrexate',
      name: 'Methotrexate 2.5mg',
      unit: 'viên',
    },
    quantity: 350,
    version: 1,
    warehouse: mockWarehousesList[1],
  },
  {
    batchId: 'batch-005',
    batchNumber: 'LOT-PAR-202608',
    daysToExpiry: 725,
    expiryDate: '2028-07-15',
    importPrice: '350',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Paracetamol 500mg',
      code: 'THU-0001',
      coveredByHealthInsurance: true,
      dosage: 'Viên nén 500mg',
      medicineId: 'med-paracetamol',
      name: 'Paracetamol 500mg',
      unit: 'viên',
    },
    quantity: 2500,
    version: 1,
    warehouse: mockWarehousesList[0],
  },
  {
    batchId: 'batch-006',
    batchNumber: 'LOT-ACY-202602',
    daysToExpiry: 551,
    expiryDate: '2028-01-22',
    importPrice: '8500',
    isExpired: false,
    isExpiringSoon: false,
    isLowStock: false,
    medicine: {
      activeIngredient: 'Acyclovir 800mg',
      code: 'THU-0115',
      coveredByHealthInsurance: true,
      dosage: 'Viên nén 800mg',
      medicineId: 'med-acyclovir',
      name: 'Acyclovir 800mg',
      unit: 'viên',
    },
    quantity: 800,
    version: 1,
    warehouse: mockWarehousesList[0],
  },
  {
    batchId: 'batch-007',
    batchNumber: 'LOT-HYD-202603',
    daysToExpiry: 42,
    expiryDate: '2026-09-01',
    importPrice: '25000',
    isExpired: false,
    isExpiringSoon: true,
    isLowStock: true,
    medicine: {
      activeIngredient: 'Hydrocortisone 1%',
      code: 'THU-0022',
      coveredByHealthInsurance: true,
      dosage: 'Kem bôi 15g',
      medicineId: 'med-hydrocortisone',
      name: 'Hydrocortisone 1% (Tuýp 15g)',
      unit: 'tuýp',
    },
    quantity: 25,
    version: 1,
    warehouse: mockWarehousesList[2],
  },
];

/**
 * Tổng quan KPI tồn kho giả lập để render trạng thái ban đầu của UI.
 * Count là số nguyên batch/số lượng; số liệu thật phải lấy từ endpoint summary.
 */
export const mockInventorySummaryData: PharmacyInventorySummary = {
  expiredBatches: 0,
  expiringSoonBatches: 1,
  lowStockBatches: 1,
  totalBatches: 7,
  totalQuantity: 5925,
};

/**
 * Nhật ký stock movement giả lập cho bảng báo cáo/audit read-only.
 * `quantityChange` và `balanceAfter` tính theo đơn vị thuốc; dữ liệu thật phải đọc từ API và không được
 * dùng fixture này để tạo movement mới.
 */
export const mockStockMovementsList: PharmacyStockMovement[] = [
  {
    movementId: 'sm-20260720-001',
    movementType: 'receipt',
    referenceType: 'stock_receipt',
    referenceId: '#NKO-2026-0154',
    prescriptionId: null,
    actorUserId: 'usr-pharmacist-ha',
    quantityChange: 500,
    balanceAfter: 450,
    createdAt: '2026-07-20T07:05:00Z',
    warehouse: mockWarehousesList[0],
    medicine: {
      medicineId: 'med-clobetasol',
      code: 'THU-0012',
      name: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
    },
    batch: {
      batchId: 'batch-001',
      batchNumber: 'LOT-20260799',
      expiryDate: '2028-06-01',
    },
  },
  {
    movementId: 'sm-20260720-002',
    movementType: 'prescription_sign',
    referenceType: 'prescription',
    referenceId: 'rx-20260720-0004-mock',
    prescriptionId: 'rx-20260720-0004-mock',
    actorUserId: 'usr-pharmacist-ha',
    quantityChange: -35,
    balanceAfter: 765,
    createdAt: '2026-07-20T08:35:10Z',
    warehouse: mockWarehousesList[0],
    medicine: {
      medicineId: 'med-acyclovir',
      code: 'THU-0115',
      name: 'Acyclovir 800mg',
    },
    batch: {
      batchId: 'batch-006',
      batchNumber: 'LOT-ACY-202602',
      expiryDate: '2028-01-22',
    },
  },
  {
    movementId: 'sm-20260720-003',
    movementType: 'adjustment',
    referenceType: 'inventory_audit',
    referenceId: '#AUDIT-20260720-SHIFT1',
    prescriptionId: null,
    actorUserId: 'usr-pharmacist-ha',
    quantityChange: 0,
    balanceAfter: 1200,
    createdAt: '2026-07-20T07:30:00Z',
    warehouse: mockWarehousesList[0],
    medicine: {
      medicineId: 'med-cetirizine',
      code: 'THU-0045',
      name: 'Cetirizine Dihydrochloride 10mg',
    },
    batch: {
      batchId: 'batch-002',
      batchNumber: 'LOT-CET-2026A',
      expiryDate: '2027-12-15',
    },
  },
];

/** Phiếu nhập kho giả lập dành riêng cho màn hình nhập kho; tiền là số nguyên VND và không tự persist. */
export const mockStockReceipt: StockReceipt = {
  receiptCode: '#NKO-2026-0154',
  supplierName: 'Công ty Dược phẩm TW1 (CPC1)',
  invoiceNumber: 'HD-0098124',
  receiptDate: '2026-07-20',
  totalAmount: 19000000,
  isXmlImported: false,
  items: [
    {
      id: 'item-1',
      drugName: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
      lotNumber: 'LOT-20260799',
      manufactureDate: '2026-06-01',
      expiryDate: '2028-06-01',
      importQuantity: 500,
      unitPrice: 38000,
      totalPrice: 19000000,
    },
  ],
};

