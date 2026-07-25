import { z } from 'zod';

export const labTestIdParamsSchema = z.object({ labTestId: z.string().min(1) });
export const labTestTypeIdParamsSchema = z.object({ id: z.string().min(1) });

/** Omitted `status` returns all 3 states (khớp tab "Tất cả" trong ảnh mẫu). */
export const listPendingLabTestsQuerySchema = z.object({
  status: z.enum(['ordered', 'in_progress', 'resulted']).optional(),
  isUrgent: z.enum(['true', 'false']).optional().transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const decimalString = () => z.union([z.string(), z.number()]).transform((value) => String(value));

/** CBC / công thức máu — plain numeric fields, no enums. */
export const cbcResultSchema = z.object({
  mayXetNghiem: z.string().max(100).optional(),
  mauBenhPham: z.string().max(100).optional(),
  wbc: decimalString().optional(),
  neu: decimalString().optional(),
  lym: decimalString().optional(),
  mono: decimalString().optional(),
  eos: decimalString().optional(),
  baso: decimalString().optional(),
  rbc: decimalString().optional(),
  hgb: decimalString().optional(),
  hct: decimalString().optional(),
  mcv: decimalString().optional(),
  mch: decimalString().optional(),
  mchc: decimalString().optional(),
  rdw: decimalString().optional(),
  plt: decimalString().optional(),
  mpv: decimalString().optional(),
  pdw: decimalString().optional(),
  pct: decimalString().optional(),
  ghiChuChiSo: z.string().max(1000).optional(),
});

/** Hóa sinh máu — mẫu MS 22/BV-02, 38 chỉ số. */
export const bioChemistryResultSchema = z.object({
  mayXetNghiem: z.string().max(100).optional(),
  mauBenhPham: z.string().max(100).optional(),
  ure: decimalString().optional(),
  glucose: decimalString().optional(),
  creatinin: decimalString().optional(),
  acidUric: decimalString().optional(),
  bilirubinTP: decimalString().optional(),
  bilirubinTT: decimalString().optional(),
  bilirubinGT: decimalString().optional(),
  proteinTP: decimalString().optional(),
  albumin: decimalString().optional(),
  globulin: decimalString().optional(),
  tyLeAG: decimalString().optional(),
  fibrinogen: decimalString().optional(),
  cholesterol: decimalString().optional(),
  triglycerid: decimalString().optional(),
  hdlCho: decimalString().optional(),
  ldlCho: decimalString().optional(),
  natri: decimalString().optional(),
  kali: decimalString().optional(),
  clorua: decimalString().optional(),
  calci: decimalString().optional(),
  calciIon: decimalString().optional(),
  phospho: decimalString().optional(),
  sat: decimalString().optional(),
  magie: decimalString().optional(),
  ast: decimalString().optional(),
  alt: decimalString().optional(),
  amylase: decimalString().optional(),
  ck: decimalString().optional(),
  ckMb: decimalString().optional(),
  ldh: decimalString().optional(),
  ggt: decimalString().optional(),
  cholinesterase: decimalString().optional(),
  phosphataseKiem: decimalString().optional(),
  phDongMach: decimalString().optional(),
  pco2: decimalString().optional(),
  po2DongMach: decimalString().optional(),
  hco3Chuan: decimalString().optional(),
  kiemDu: decimalString().optional(),
  ghiChuChiSo: z.string().max(1000).optional(),
});

const amTinhDuongTinh = z.enum(['am_tinh', 'duong_tinh']);
const semiQuant3 = z.enum(['am_tinh', 'vet', 'cong', 'v_2_cong', 'v_3_cong']);
const semiQuant4 = z.enum(['am_tinh', 'vet', 'cong', 'v_2_cong', 'v_3_cong', 'v_4_cong']);

/** Nước tiểu / phân / dịch não tủy / dịch vị / dịch chọc dò — chỉ gửi panel nào có dữ liệu. */
export const urinalysisResultSchema = z.object({
  mayXetNghiem: z.string().max(100).optional(),
  phuongPhap: z.string().max(100).optional(),
  mauSac: z.string().max(50).optional(),
  doTrong: z.enum(['trong', 'hoi_duc', 'duc']).optional(),
  ph: decimalString().optional(),
  tyTrong: decimalString().optional(),
  glucose: semiQuant4.optional(),
  protein: semiQuant4.optional(),
  ketone: semiQuant4.optional(),
  bilirubin: z.enum(['am_tinh', 'cong', 'v_2_cong', 'v_3_cong']).optional(),
  urobilinogen: z.enum(['binh_thuong', 'cong', 'v_2_cong', 'v_3_cong', 'v_4_cong']).optional(),
  blood: semiQuant3.optional(),
  leukocyte: semiQuant3.optional(),
  nitrite: amTinhDuongTinh.optional(),
  hongCauViTruong: z.string().max(100).optional(),
  bachCauViTruong: z.string().max(100).optional(),
  teBaoBieuMo: z.string().max(100).optional(),
  viKhuan: z.string().max(100).optional(),
  truNi: z.string().max(100).optional(),
  tinhThe: z.string().max(100).optional(),
  moTaCanLang: z.string().max(500).optional(),
  duongChat: amTinhDuongTinh.optional(),
  porphyrin: amTinhDuongTinh.optional(),
  proteinBenceJones: amTinhDuongTinh.optional(),
  nt24TheTich: decimalString().optional(),
  nt24Protein: decimalString().optional(),
  nt24Glucose: decimalString().optional(),
  nt24Ure: decimalString().optional(),
  nt24Creatinin: decimalString().optional(),
  nt24AcidUric: decimalString().optional(),
  nt24Amylase: decimalString().optional(),
  nt24Na: decimalString().optional(),
  nt24K: decimalString().optional(),
  phanHuyetSacTo: amTinhDuongTinh.optional(),
  phanStercobilin: amTinhDuongTinh.optional(),
  phanStercobilinogen: amTinhDuongTinh.optional(),
  phanMauToanPhan: amTinhDuongTinh.optional(),
  phanGhiChu: z.string().max(500).optional(),
  dntProtein: decimalString().optional(),
  dntGlucose: decimalString().optional(),
  dntClorua: decimalString().optional(),
  dntPandy: amTinhDuongTinh.optional(),
  dntGhiChu: z.string().max(500).optional(),
  dichViHClTuDo: decimalString().optional(),
  dichViHClToanPhan: decimalString().optional(),
  dichViGhiChu: z.string().max(500).optional(),
  dcdRivalta: amTinhDuongTinh.optional(),
  dcdProtein: decimalString().optional(),
  dcdGhiChu: z.string().max(500).optional(),
});

const sirEnum = z.enum(['S', 'I', 'R']);

/** 30 kháng sinh cố định theo hợp đồng API — không nhận key tự do ngoài danh sách này. */
export const ANTIBIOGRAM_FIELDS = [
  'ksdPenicilline', 'ksdAmpicilline', 'ksdAmoAClavulanic', 'ksdAztreonam', 'ksdMezlocilline',
  'ksdOxacillinePhe', 'ksdOxacillineTu', 'ksdCephalotine', 'ksdCefuroxime', 'ksdCeftazidime',
  'ksdCefotaxime', 'ksdCeftriaxone', 'ksdCefoperazone', 'ksdCefepime', 'ksdVancomycin',
  'ksdClindamycin', 'ksdChloramphenicol', 'ksdErythromycine', 'ksdTetracycline', 'ksdDoxycycline',
  'ksdNalidixicAcid', 'ksdNofloxacine', 'ksdCiprofloxacine', 'ksdOfloxacine', 'ksdGentamycine',
  'ksdTobramycine', 'ksdAmikacine', 'ksdNetromycine', 'ksdCoTrimoxazol', 'ksdNitroxoline',
] as const;

const antibiogramShape = Object.fromEntries(ANTIBIOGRAM_FIELDS.map((field) => [field, sirEnum.optional()]));

/** Vi sinh — soi trực tiếp/nuôi cấy + kháng sinh đồ (30 field cố định + 3 slot kháng sinh khác). */
export const microbiologyResultSchema = z.object({
  viTriLayMau: z.string().max(255).optional(),
  phuongPhapSoi: z.string().max(100).optional(),
  trucTiep: z.string().optional(),
  soiNam: amTinhDuongTinh.optional(),
  teBaoNamMen: amTinhDuongTinh.optional(),
  baoTu: amTinhDuongTinh.optional(),
  moTaHinhThaiNam: z.string().max(500).optional(),
  nuoiCayAiKhi: z.string().optional(),
  nuoiCayKyKhi: z.string().optional(),
  phanUngHT: z.string().optional(),
  chungVkKsd: z.string().max(500).optional(),
  ...antibiogramShape,
  ksdKhacTenA: z.string().max(100).optional(),
  ksdKhacKqA: sirEnum.optional(),
  ksdKhacTenB: z.string().max(100).optional(),
  ksdKhacKqB: sirEnum.optional(),
  ksdKhacTenC: z.string().max(100).optional(),
  ksdKhacKqC: sirEnum.optional(),
});

/** Giải phẫu bệnh — trangThai quyết định endpoint: `cho_ket_qua` chỉ qua pathology-workup (nháp),
 * `da_co_ket_qua` chỉ qua recordLabResult (final) và bắt buộc chanDoanMoHoc/bacSiGiaiPhauBenh/ngayTraKetQua. */
export const pathologyResultSchema = z.object({
  phuongPhapSinhThiet: z.enum(['punch', 'shave', 'excision', 'incision', 'khac']).optional(),
  viTriSinhThiet: z.string().max(255).optional(),
  soManh: z.number().int().positive().optional(),
  chanDoanLamSang: z.string().max(1000).optional(),
  tomTatLamSang: z.string().optional(),
  quaTrinhDieuTri: z.string().optional(),
  nhanXetDaiTheLayMau: z.string().optional(),
  ketQuaSinhThietLanTruoc: z.string().optional(),
  dungDichCoDinh: z.string().max(100).optional(),
  thoiGianCoDinh: z.coerce.date().optional(),
  nguoiPhaBenhPham: z.string().max(36).optional(),
  ngayPha: z.coerce.date().optional(),
  phuongPhapNhuomHE: z.string().max(100).optional(),
  ngayLamTieuBan: z.coerce.date().optional(),
  nguoiLamTieuBan: z.string().max(36).optional(),
  daiThe: z.string().optional(),
  viThe: z.string().optional(),
  nhuomDacBiet: z.string().max(500).optional(),
  chanDoanMoHoc: z.string().max(1000).optional(),
  phuHopChanDoanLamSang: z.enum(['phu_hop', 'khong_phu_hop', 'khong_du_thong_tin']).optional(),
  icd10MoHoc: z.string().max(10).optional(),
  bacSiGiaiPhauBenh: z.string().max(36).optional(),
  ngayTraKetQua: z.coerce.date().optional(),
});

export const recordLabResultSchema = z.discriminatedUnion('resultTableKey', [
  z.object({
    resultTableKey: z.literal('xn_cong_thuc_mau'),
    structuredResult: cbcResultSchema,
    attachmentId: z.string().min(1),
    reportCode: z.string().max(30).optional(),
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
    signatureConfirmation: z.literal(true),
    signatureMethod: z.literal('dev_e_confirmation'),
  }),
  z.object({
    resultTableKey: z.literal('xn_nuoc_tieu'),
    structuredResult: urinalysisResultSchema,
    attachmentId: z.string().min(1),
    reportCode: z.string().max(30).optional(),
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
    signatureConfirmation: z.literal(true),
    signatureMethod: z.literal('dev_e_confirmation'),
  }),
  z.object({
    resultTableKey: z.literal('xn_vi_sinh'),
    structuredResult: microbiologyResultSchema,
    attachmentId: z.string().min(1),
    reportCode: z.string().max(30).optional(),
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
    signatureConfirmation: z.literal(true),
    signatureMethod: z.literal('dev_e_confirmation'),
  }),
  z.object({
    resultTableKey: z.literal('xn_mo_benh_hoc'),
    structuredResult: pathologyResultSchema.extend({
      trangThai: z.literal('da_co_ket_qua'),
      chanDoanMoHoc: z.string().min(1).max(1000),
      bacSiGiaiPhauBenh: z.string().min(1).max(36),
      ngayTraKetQua: z.coerce.date(),
    }),
    attachmentId: z.string().min(1),
    reportCode: z.string().max(30).optional(),
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
    signatureConfirmation: z.literal(true),
    signatureMethod: z.literal('dev_e_confirmation'),
  }),
  z.object({
    resultTableKey: z.literal('xn_hoa_sinh_mau'),
    structuredResult: bioChemistryResultSchema,
    attachmentId: z.string().min(1),
    reportCode: z.string().max(30).optional(),
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
    signatureConfirmation: z.literal(true),
    signatureMethod: z.literal('dev_e_confirmation'),
  }),
]);

export const savePathologyWorkupDraftSchema = z.object({
  resultTableKey: z.literal('xn_mo_benh_hoc'),
  structuredResult: pathologyResultSchema.extend({ trangThai: z.literal('cho_ket_qua') }),
  attachmentId: z.string().min(1).optional(),
});

export const updateReferenceRangeSchema = z.object({
  referenceRange: z.string().max(255),
});

export const referenceRangeIdParamsSchema = z.object({ referenceRangeId: z.string().min(1) });

export const listReferenceRangesQuerySchema = z.object({
  labTestTypeId: z.string().min(1).optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const referenceRangeBodySchema = z.object({
  labTestTypeId: z.string().min(1),
  fieldKey: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  label: z.string().min(1).max(255),
  unit: z.string().max(50).optional(),
  lowerBound: z.union([z.string(), z.number()]).optional(),
  upperBound: z.union([z.string(), z.number()]).optional(),
  condition: z.enum(['all', 'male', 'female']).default('all'),
});

export const createReferenceRangeSchema = referenceRangeBodySchema;
export const updateReferenceRangeDetailSchema = referenceRangeBodySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const labActivityStatsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('today'),
  date: z.string().optional(),
});
