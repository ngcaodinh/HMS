/**
 * @file pharmacy-mock.data.ts
 * @description Dữ liệu thử nghiệm (Mock Data) cho Phân hệ Quản lý Dược & Nhà thuốc HMS-VN
 * @author Senior Frontend Engineer
 */

import type {
  InventoryItem,
  PharmacyKpiSummary,
  Prescription,
  StockMovementLog,
  StockReceipt,
} from '../types/pharmacy.types';

/**
 * Danh sách đơn thuốc điện tử mẫu đã được ký số bác sĩ
 */
export const mockPrescriptions: Prescription[] = [
  {
    id: '0891', // HIển thị #RX-2026-0891
    patientId: 'BN-2026-0089',
    patientName: 'Nguyễn Thị Lan',
    patientAge: 41,
    patientGender: 'Nữ',
    bhytCardNumber: 'HS4-0100-3500-2026',
    bhytRatio: 'Ngoại trú BHYT 80%',
    patientType: 'outpatient',
    icdCode: 'L23.9',
    icdDiagnosis: 'Viêm da tiếp xúc dị ứng',
    doctorName: 'BS. Lê Thành Tâm',
    department: 'Khoa Da Liễu — P.201',
    signedAt: '20/07/2026 07:32',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: '#INV-2026-0312',
    hasAllergyWarning: true,
    allergyWarningText: 'Cảnh báo Penicillin',
    allergyOverrideReason:
      'Đã kiểm tra hoạt chất Cetirizine & Clobetasol không thuộc nhóm B-lactam, an toàn sử dụng cho bệnh nhân',
    allergyOverrideMeta: 'BS. Lê Thành Tâm · 20/07/2026 07:32 · Override ID: #ALR-8812',
    status: 'pending',
    warehouseId: 'kho-a',
    items: [
      {
        drugId: 'THU-0012',
        drugName: 'Clobetasol Propionate 0.05%',
        spec: 'Tuýp 30g · Thuốc bôi ngoài da',
        categoryLabel: 'Thuốc bôi',
        quantity: 2,
        unit: 'tuýp',
        dosageInstruction: 'Bôi mỏng vùng da tổn thương 2 lần/ngày (Sáng - Tối)',
        fefoLotNumber: 'LOT-20260412',
        shelfLocation: 'Kệ A-02',
        availableStock: 1450,
        expiryDate: '15/10/2027',
        isStockSufficient: true,
      },
      {
        drugId: 'THU-0045',
        drugName: 'Cetirizin 10mg',
        spec: 'Hộp 30 viên · Thuốc kháng histamin',
        categoryLabel: 'Kháng histamin',
        quantity: 1,
        unit: 'hộp',
        dosageInstruction: 'Uống 1 viên vào buổi tối sau khi ăn',
        fefoLotNumber: 'LOT-20260301',
        shelfLocation: 'Kệ B-05',
        availableStock: 820,
        expiryDate: '20/05/2027',
        isStockSufficient: true,
      },
    ],
  },
  {
    id: '0892', // Hiển thị #RX-2026-0892
    patientId: 'BN-2026-0091',
    patientName: 'Trần Minh Đức',
    patientAge: 35,
    patientGender: 'Nam',
    patientType: 'inpatient',
    bhytRatio: 'Nội trú',
    icdCode: 'L40.0',
    icdDiagnosis: 'Vảy nến mảng thông thường',
    doctorName: 'BS. Nguyễn Văn B',
    department: 'Nội trú Da Liễu — Buồng 3',
    signedAt: '20/07/2026 07:40',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: '#INV-2026-0315',
    hasAllergyWarning: false,
    status: 'pending',
    warehouseId: 'kho-b',
    items: [
      {
        drugId: 'THU-0012',
        drugName: 'Clobetasol Propionate 0.05%',
        spec: 'Tuýp 30g · Thuốc bôi ngoài da',
        quantity: 1,
        unit: 'tuýp',
        dosageInstruction: 'Bôi mỏng vùng vảy nến 2 lần/ngày',
        fefoLotNumber: 'LOT-20260412',
        shelfLocation: 'Kệ A-02',
        availableStock: 1450,
        expiryDate: '15/10/2027',
        isStockSufficient: true,
      },
    ],
  },
  {
    id: '0885', // Hiển thị #RX-2026-0885
    patientId: 'BN-2026-0085',
    patientName: 'Lê Thị Hương',
    patientAge: 58,
    patientGender: 'Nữ',
    bhytCardNumber: 'HT2-0100-8812-2026',
    bhytRatio: 'Ngoại trú BHYT 100%',
    patientType: 'outpatient',
    icdCode: 'L30.9',
    icdDiagnosis: 'Chàm / Eczema mãn tính',
    doctorName: 'BS. Lê Thành Tâm',
    department: 'Khoa Da Liễu — P.103',
    signedAt: '20/07/2026 07:15',
    isSigned: true,
    invoiceStatus: 'paid',
    invoiceId: '#INV-2026-0301',
    hasAllergyWarning: false,
    status: 'dispensed',
    warehouseId: 'kho-a',
    items: [
      {
        drugId: 'THU-0045',
        drugName: 'Cetirizin 10mg',
        spec: 'Hộp 30 viên · Thuốc kháng histamin',
        quantity: 2,
        unit: 'hộp',
        dosageInstruction: 'Uống 1 viên vào buổi tối',
        fefoLotNumber: 'LOT-20260301',
        shelfLocation: 'Kệ B-05',
        availableStock: 820,
        expiryDate: '20/05/2027',
        isStockSufficient: true,
      },
    ],
  },
];

/**
 * Danh mục tồn kho thuốc và định cấp FEFO mẫu
 */
export const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    code: 'THU-0012',
    name: 'Clobetasol Propionate 0.05%',
    spec: 'Tuýp 30g · Thuốc bôi',
    registrationNumber: 'VD-24512-16',
    lotNumber: 'LOT-20260412',
    expiryDate: '15/10/2027',
    fefoPriority: 'FEFO Ưu tiên',
    currentStock: 1450,
    unit: 'tuýp',
    minStock: 200,
    shelfLocation: 'Kệ A-02',
    status: 'Đạt chuẩn',
    category: 'topical',
  },
  {
    id: '2',
    code: 'THU-0045',
    name: 'Cetirizin 10mg',
    spec: 'Hộp 30 viên · Kháng histamin',
    registrationNumber: 'VD-18923-13',
    lotNumber: 'LOT-20260301',
    expiryDate: '20/05/2027',
    fefoPriority: 'FEFO Ưu tiên',
    currentStock: 820,
    unit: 'hộp',
    minStock: 100,
    shelfLocation: 'Kệ B-05',
    status: 'Đạt chuẩn',
    category: 'antihistamine',
  },
  {
    id: '3',
    code: 'THU-0108',
    name: 'Acyclovir 200mg',
    spec: 'Hộp 50 viên · Kháng vi-rút',
    registrationNumber: 'VD-31045-19',
    lotNumber: 'LOT-20251105',
    expiryDate: '15/09/2026',
    fefoPriority: 'Cận hạn',
    currentStock: 150,
    unit: 'hộp',
    minStock: 200,
    shelfLocation: 'Kệ C-01',
    status: 'Cảnh báo cận hạn',
    category: 'antibiotic',
  },
  {
    id: '4',
    code: 'THU-0210',
    name: 'Morphin Sulfat 10mg/ml',
    spec: 'Ống 1ml · Thuốc gây nghiện (Kiểm soát đặc biệt)',
    registrationNumber: 'VD-09124-11',
    lotNumber: 'LOT-20260119',
    expiryDate: '30/12/2027',
    fefoPriority: 'Tủ két sắt',
    currentStock: 45,
    unit: 'ống',
    minStock: 50,
    shelfLocation: 'Tủ Két K-01',
    status: 'Tồn dưới tối thiểu',
    category: 'special',
  },
];

/**
 * Mẫu phiếu nhập kho dược từ Nhà cung cấp (#NKO-2026-0154)
 */
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

/**
 * Nhật ký kiểm toán xuất nhập tồn gần nhất
 */
export const mockStockMovementLogs: StockMovementLog[] = [
  {
    id: 'SM-2026-0912',
    drugCode: 'THU-0012',
    drugName: 'Clobetasol Propionate 0.05%',
    lotNumber: 'LOT-20260412',
    movementType: 'Xuất cấp phát #RX-0891',
    movementTypeBadge: 'paid',
    quantityChange: -2,
    quantityChangeText: '- 2 tuýp',
    postStock: 1450,
    unit: 'tuýp',
    executor: 'DS. Phạm Thanh Hà',
    timestamp: '07:45:12 · 20/07',
  },
  {
    id: 'SM-2026-0911',
    drugCode: 'THU-0045',
    drugName: 'Cetirizin 10mg',
    lotNumber: 'LOT-20260301',
    movementType: 'Xuất cấp phát #RX-0891',
    movementTypeBadge: 'paid',
    quantityChange: -1,
    quantityChangeText: '- 1 hộp',
    postStock: 820,
    unit: 'hộp',
    executor: 'DS. Phạm Thanh Hà',
    timestamp: '07:45:12 · 20/07',
  },
  {
    id: 'SM-2026-0905',
    drugCode: 'THU-0012',
    drugName: 'Clobetasol Propionate 0.05%',
    lotNumber: 'LOT-20260799',
    movementType: 'Nhập kho #NKO-0154',
    movementTypeBadge: 'blue',
    quantityChange: 500,
    quantityChangeText: '+ 500 tuýp',
    postStock: 1452,
    unit: 'tuýp',
    executor: 'DS. Phạm Thanh Hà',
    timestamp: '07:15:00 · 20/07',
  },
];

/**
 * Nội dung tệp tin XML Đơn thuốc Quốc gia mẫu tuân thủ Quy chế Bộ Y tế
 */
export const mockNationalXmlString = `<?xml version="1.0" encoding="UTF-8"?>
<DON_THUOC_DIEN_TU xmlns="http://bythealth.gov.vn/donthuoc/2026">
  <MA_DON_THUOC>RX-2026-0891</MA_DON_THUOC>
  <MA_CO_SO_KCB>01DA00001</MA_CO_SO_KCB>
  <TEN_CO_SO>Bệnh viện Da Liễu HMS-VN</TEN_CO_SO>
  <BAC_SI_KE_DON>
    <MA_BAC_SI>BS-0892</MA_BAC_SI>
    <HO_TEN>BS. Lê Thành Tâm</HO_TEN>
    <IS_SIGNED>true</IS_SIGNED>
    <SIGNED_AT>2026-07-20T07:32:00+07:00</SIGNED_AT>
  </BAC_SI_KE_DON>
  <BENH_NHAN>
    <MA_BN>BN-2026-0089</MA_BN>
    <HO_TEN>Nguyễn Thị Lan</HO_TEN>
    <NAM_SINH>1985</NAM_SINH>
    <GIOI_TINH>Nữ</GIOI_TINH>
    <SO_THE_BHYT>HS4-0100-3500-2026</SO_THE_BHYT>
    <CHAN_DOAN_ICD10>L23.9</CHAN_DOAN_ICD10>
  </BENH_NHAN>
  <DANH_SACH_THUOC>
    <THUOC_ITEM>
      <TEN_THUOC>Clobetasol Propionate 0.05%</TEN_THUOC>
      <DANG_CHE_BHAN>Tuýp 30g</DANG_CHE_BHAN>
      <SO_LUONG>2</SO_LUONG>
      <LIEU_DUNG>Bôi mỏng vùng da tổn thương 2 lần/ngày</LIEU_DUNG>
      <BATCH_NUMBER>LOT-20260412</BATCH_NUMBER>
    </THUOC_ITEM>
    <THUOC_ITEM>
      <TEN_THUOC>Cetirizin 10mg</TEN_THUOC>
      <DANG_CHE_BHAN>Hộp 30 viên</DANG_CHE_BHAN>
      <SO_LUONG>1</SO_LUONG>
      <LIEU_DUNG>Uống 1 viên vào buổi tối sau ăn</LIEU_DUNG>
      <BATCH_NUMBER>LOT-20260301</BATCH_NUMBER>
    </THUOC_ITEM>
  </DANH_SACH_THUOC>
  <DISPENSED_INFO>
    <DISPENSED_BY>DS. Phạm Thanh Hà</DISPENSED_BY>
    <DISPENSED_AT>2026-07-20T07:45:32+07:00</DISPENSED_AT>
  </DISPENSED_INFO>
</DON_THUOC_DIEN_TU>`;

/**
 * Tệp XML mẫu Nhập kho Nhà cung cấp CPC1
 */
export const mockSupplierXmlString = `<?xml version="1.0" encoding="UTF-8"?>
<HOA_DON_DUOC_NHAP_KHO xmlns="http://bythealth.gov.vn/nhapkho/2026">
  <NHA_CUNG_CAP>Công ty Dược phẩm TW1 (CPC1)</NHA_CUNG_CAP>
  <SO_HOA_DON>HD-XML-2026-9921</SO_HOA_DON>
  <NGAY_HOA_DON>2026-07-20</NGAY_HOA_DON>
  <DANH_SACH_THUOC_NHAP>
    <ITEM>
      <TEN_THUOC>Clobetasol Propionate 0.05% (Tuýp 30g)</TEN_THUOC>
      <SO_LO>LOT-20260799</SO_LO>
      <NGAY_SX>2026-06-01</NGAY_SX>
      <HAN_DUNG>2028-06-01</HAN_DUNG>
      <SO_LUONG>500</SO_LUONG>
      <DON_GIA>38000</DON_GIA>
    </ITEM>
    <ITEM>
      <TEN_THUOC>Cetirizin 10mg (Hộp 30v)</TEN_THUOC>
      <SO_LO>LOT-20260810</SO_LO>
      <NGAY_SX>2026-05-15</NGAY_SX>
      <HAN_DUNG>2028-05-15</HAN_DUNG>
      <SO_LUONG>300</SO_LUONG>
      <DON_GIA>45000</DON_GIA>
    </ITEM>
  </DANH_SACH_THUOC_NHAP>
</HOA_DON_DUOC_NHAP_KHO>`;

/**
 * Tổng quan KPI Kho dược
 */
export const mockPharmacyKpi: PharmacyKpiSummary = {
  totalDrugs: 482,
  outpatientCount: 310,
  inpatientCount: 172,
  nearExpiryLotsCount: 12,
  lowStockItemsCount: 5,
  totalInventoryValueVnd: 1850000000,
};
