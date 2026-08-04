import { z } from 'zod';

export const labTestIdParamsSchema = z.object({ labTestId: z.string().min(1) });
export const labTestTypeIdParamsSchema = z.object({ id: z.string().min(1) });

/** Omitted `status` returns all 3 states (khớp tab "Tất cả" trong ảnh mẫu). */
export const listPendingLabTestsQuerySchema = z.object({
  status: z.enum(['ordered', 'in_progress', 'resulted']).optional(),
  isUrgent: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

interface DecimalRangeOptions {
  label: string;
  max?: number;
  min?: number;
  precision: number;
  scale: number;
}

/**
 * Kiểm tra số thập phân theo giới hạn vật lý và precision/scale của cột Prisma.
 * Giá trị được giữ ở dạng chuỗi sau parse để tránh sai số dấu phẩy động khi ghi Decimal.
 */
const decimalRange = ({ label, max, min, precision, scale }: DecimalRangeOptions) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .superRefine((value, context) => {
      // Cho phép form gửi chuỗi rỗng; đây là field optional và sẽ được chuẩn hóa thành undefined.
      if (value === '') return;
      if (!/^-?\d+(?:\.\d+)?$/.test(value)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} phải là số hợp lệ.` });
        return;
      }

      const unsigned = value.startsWith('-') ? value.slice(1) : value;
      const [integerPart = '', fractionPart = ''] = unsigned.split('.');
      if (integerPart.length + fractionPart.length > precision || fractionPart.length > scale) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} vượt quá độ chính xác cho phép.`,
        });
        return;
      }

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} phải là số hữu hạn.` });
        return;
      }
      if (min !== undefined && numericValue < min) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải lớn hơn hoặc bằng ${min}.`,
        });
      }
      if (max !== undefined && numericValue > max) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} phải nhỏ hơn hoặc bằng ${max}.`,
        });
      }
    })
    .transform((value) => (value === '' ? undefined : value));

const cbcNonNegative = (label: string, precision: number, scale: number) =>
  decimalRange({ label, min: 0, precision, scale });
const cbcPercent = (label: string) =>
  decimalRange({ label, max: 100, min: 0, precision: 5, scale: 2 });

/** CBC / công thức máu — plain numeric fields, no enums. */
export const cbcResultSchema = z.object({
  mayXetNghiem: z.string().max(100, 'Máy xét nghiệm tối đa 100 ký tự.').optional(),
  mauBenhPham: z.string().max(100, 'Mẫu bệnh phẩm tối đa 100 ký tự.').optional(),
  wbc: cbcNonNegative('WBC', 6, 2).optional(),
  neu: cbcPercent('NEU').optional(),
  lym: cbcPercent('LYM').optional(),
  mono: cbcPercent('MONO').optional(),
  eos: cbcPercent('EOS').optional(),
  baso: cbcPercent('BASO').optional(),
  rbc: cbcNonNegative('RBC', 6, 2).optional(),
  hgb: cbcNonNegative('HGB', 5, 1).optional(),
  hct: decimalRange({ label: 'HCT', max: 1, min: 0, precision: 5, scale: 3 }).optional(),
  mcv: cbcNonNegative('MCV', 6, 2).optional(),
  mch: cbcNonNegative('MCH', 6, 2).optional(),
  mchc: cbcNonNegative('MCHC', 6, 2).optional(),
  rdw: cbcNonNegative('RDW', 5, 2).optional(),
  plt: cbcNonNegative('PLT', 6, 1).optional(),
  mpv: cbcNonNegative('MPV', 5, 2).optional(),
  pdw: cbcNonNegative('PDW', 5, 2).optional(),
  pct: cbcNonNegative('PCT', 6, 4).optional(),
  ghiChuChiSo: z.string().max(1000, 'Ghi chú chỉ số tối đa 1000 ký tự.').optional(),
});

const bioChemistryFields: Record<string, [string, number, number]> = {
  ure: ['Urê', 5, 2],
  glucose: ['Glucose', 5, 2],
  creatinin: ['Creatinin', 6, 2],
  acidUric: ['Acid Uric', 6, 2],
  bilirubinTP: ['Bilirubin T.P', 5, 2],
  bilirubinTT: ['Bilirubin T.T', 5, 2],
  bilirubinGT: ['Bilirubin G.T', 5, 2],
  proteinTP: ['Protein T.P', 5, 2],
  albumin: ['Albumin', 5, 2],
  globulin: ['Globulin', 5, 2],
  tyLeAG: ['Tỷ lệ A/G', 4, 2],
  fibrinogen: ['Fibrinogen', 5, 2],
  cholesterol: ['Cholesterol', 5, 2],
  triglycerid: ['Triglycerid', 5, 2],
  hdlCho: ['HDL-cholesterol', 5, 2],
  ldlCho: ['LDL-cholesterol', 5, 2],
  natri: ['Natri', 6, 2],
  kali: ['Kali', 5, 2],
  clorua: ['Clorua', 6, 2],
  calci: ['Calci', 5, 2],
  calciIon: ['Calci ion', 5, 2],
  phospho: ['Phospho', 5, 2],
  sat: ['Sắt', 6, 2],
  magie: ['Magiê', 5, 2],
  ast: ['AST', 7, 2],
  alt: ['ALT', 7, 2],
  amylase: ['Amylase', 8, 2],
  ck: ['CK', 7, 2],
  ckMb: ['CK-MB', 7, 2],
  ldh: ['LDH', 7, 2],
  ggt: ['GGT', 7, 2],
  cholinesterase: ['Cholinesterase', 9, 2],
  phosphataseKiem: ['Phosphatase kiềm', 8, 2],
  pco2: ['pCO2', 5, 2],
  po2DongMach: ['pO2 động mạch', 6, 2],
  hco3Chuan: ['HCO3 chuẩn', 5, 2],
  kiemDu: ['Kiềm dư', 5, 2],
};

const bioChemistryNumericShape = Object.fromEntries(
  Object.entries(bioChemistryFields).map(([field, [label, precision, scale]]) => [
    field,
    decimalRange({ label, min: 0, precision, scale }).optional(),
  ]),
);

/** Hóa sinh máu — mẫu MS 22/BV-02, các chỉ số số không được âm. */
export const bioChemistryResultSchema = z.object({
  mayXetNghiem: z.string().max(100, 'Máy xét nghiệm tối đa 100 ký tự.').optional(),
  mauBenhPham: z.string().max(100, 'Mẫu bệnh phẩm tối đa 100 ký tự.').optional(),
  ...bioChemistryNumericShape,
  phDongMach: decimalRange({
    label: 'pH động mạch',
    max: 14,
    min: 0,
    precision: 4,
    scale: 3,
  }).optional(),
  ghiChuChiSo: z.string().max(1000, 'Ghi chú chỉ số tối đa 1000 ký tự.').optional(),
});

const amTinhDuongTinh = z.enum(['am_tinh', 'duong_tinh']);
const semiQuant3 = z.enum(['am_tinh', 'vet', 'cong', 'v_2_cong', 'v_3_cong']);
const semiQuant4 = z.enum(['am_tinh', 'vet', 'cong', 'v_2_cong', 'v_3_cong', 'v_4_cong']);

const urineNumericFields: Record<string, [string, number, number]> = {
  nt24TheTich: ['Tổng thể tích', 5, 2],
  nt24Protein: ['Protein niệu 24 giờ', 7, 4],
  nt24Glucose: ['Glucose niệu 24 giờ', 7, 3],
  nt24Ure: ['Urê niệu 24 giờ', 7, 2],
  nt24Creatinin: ['Creatinin niệu 24 giờ', 7, 3],
  nt24AcidUric: ['Acid uric niệu 24 giờ', 7, 3],
  nt24Amylase: ['Amylase niệu 24 giờ', 8, 2],
  nt24Na: ['Na+ niệu 24 giờ', 7, 2],
  nt24K: ['K+ niệu 24 giờ', 7, 2],
  dntProtein: ['Protein DNT', 6, 3],
  dntGlucose: ['Glucose DNT', 5, 2],
  dntClorua: ['Clorua DNT', 6, 2],
  dichViHClTuDo: ['HCl tự do', 5, 2],
  dichViHClToanPhan: ['HCl toàn phần', 5, 2],
  dcdProtein: ['Protein dịch chọc dò', 6, 2],
};
const urineNumericShape = Object.fromEntries(
  Object.entries(urineNumericFields).map(([field, [label, precision, scale]]) => [
    field,
    decimalRange({ label, min: 0, precision, scale }).optional(),
  ]),
);

/** Nước tiểu / phân / dịch não tủy / dịch vị / dịch chọc dò. */
export const urinalysisResultSchema = z.object({
  mayXetNghiem: z.string().max(100, 'Máy xét nghiệm tối đa 100 ký tự.').optional(),
  phuongPhap: z.string().max(100, 'Phương pháp tối đa 100 ký tự.').optional(),
  mauSac: z.string().max(50, 'Màu sắc tối đa 50 ký tự.').optional(),
  doTrong: z.enum(['trong', 'hoi_duc', 'duc']).optional(),
  ph: decimalRange({ label: 'pH', max: 14, min: 0, precision: 3, scale: 1 }).optional(),
  tyTrong: decimalRange({
    label: 'Tỷ trọng',
    max: 1.06,
    min: 1,
    precision: 5,
    scale: 3,
  }).optional(),
  glucose: semiQuant4.optional(),
  protein: semiQuant4.optional(),
  ketone: semiQuant4.optional(),
  bilirubin: z.enum(['am_tinh', 'cong', 'v_2_cong', 'v_3_cong']).optional(),
  urobilinogen: z.enum(['binh_thuong', 'cong', 'v_2_cong', 'v_3_cong', 'v_4_cong']).optional(),
  blood: semiQuant3.optional(),
  leukocyte: semiQuant3.optional(),
  nitrite: amTinhDuongTinh.optional(),
  hongCauViTruong: z.string().max(100, 'Hồng cầu vi trường tối đa 100 ký tự.').optional(),
  bachCauViTruong: z.string().max(100, 'Bạch cầu vi trường tối đa 100 ký tự.').optional(),
  teBaoBieuMo: z.string().max(100, 'Tế bào biểu mô tối đa 100 ký tự.').optional(),
  viKhuan: z.string().max(100, 'Vi khuẩn tối đa 100 ký tự.').optional(),
  truNi: z.string().max(100, 'Trụ niệu tối đa 100 ký tự.').optional(),
  tinhThe: z.string().max(100, 'Tinh thể tối đa 100 ký tự.').optional(),
  moTaCanLang: z.string().max(500, 'Mô tả cặn lắng tối đa 500 ký tự.').optional(),
  duongChat: amTinhDuongTinh.optional(),
  porphyrin: amTinhDuongTinh.optional(),
  proteinBenceJones: amTinhDuongTinh.optional(),
  ...urineNumericShape,
  phanHuyetSacTo: amTinhDuongTinh.optional(),
  phanStercobilin: amTinhDuongTinh.optional(),
  phanStercobilinogen: amTinhDuongTinh.optional(),
  phanMauToanPhan: amTinhDuongTinh.optional(),
  phanGhiChu: z.string().max(500, 'Ghi chú phân tối đa 500 ký tự.').optional(),
  dntPandy: amTinhDuongTinh.optional(),
  dntGhiChu: z.string().max(500, 'Ghi chú DNT tối đa 500 ký tự.').optional(),
  dichViGhiChu: z.string().max(500, 'Ghi chú dịch vị tối đa 500 ký tự.').optional(),
  dcdRivalta: amTinhDuongTinh.optional(),
  dcdGhiChu: z.string().max(500, 'Ghi chú dịch chọc dò tối đa 500 ký tự.').optional(),
});

const sirEnum = z.enum(['S', 'I', 'R']);
export const ANTIBIOGRAM_FIELDS = [
  'ksdPenicilline',
  'ksdAmpicilline',
  'ksdAmoAClavulanic',
  'ksdAztreonam',
  'ksdMezlocilline',
  'ksdOxacillinePhe',
  'ksdOxacillineTu',
  'ksdCephalotine',
  'ksdCefuroxime',
  'ksdCeftazidime',
  'ksdCefotaxime',
  'ksdCeftriaxone',
  'ksdCefoperazone',
  'ksdCefepime',
  'ksdVancomycin',
  'ksdClindamycin',
  'ksdChloramphenicol',
  'ksdErythromycine',
  'ksdTetracycline',
  'ksdDoxycycline',
  'ksdNalidixicAcid',
  'ksdNofloxacine',
  'ksdCiprofloxacine',
  'ksdOfloxacine',
  'ksdGentamycine',
  'ksdTobramycine',
  'ksdAmikacine',
  'ksdNetromycine',
  'ksdCoTrimoxazol',
  'ksdNitroxoline',
] as const;
const antibiogramShape = Object.fromEntries(
  ANTIBIOGRAM_FIELDS.map((field) => [field, sirEnum.optional()]),
);

/** Vi sinh — soi trực tiếp/nuôi cấy + kháng sinh đồ. */
export const microbiologyResultSchema = z.object({
  viTriLayMau: z.string().max(255, 'Vị trí lấy mẫu tối đa 255 ký tự.').optional(),
  phuongPhapSoi: z.string().max(100, 'Phương pháp soi tối đa 100 ký tự.').optional(),
  trucTiep: z.string().optional(),
  soiNam: amTinhDuongTinh.optional(),
  teBaoNamMen: amTinhDuongTinh.optional(),
  baoTu: amTinhDuongTinh.optional(),
  moTaHinhThaiNam: z.string().max(500, 'Mô tả hình thái nấm tối đa 500 ký tự.').optional(),
  nuoiCayAiKhi: z.string().optional(),
  nuoiCayKyKhi: z.string().optional(),
  phanUngHT: z.string().optional(),
  chungVkKsd: z.string().max(500, 'Chủng vi khuẩn tối đa 500 ký tự.').optional(),
  ...antibiogramShape,
  ksdKhacTenA: z.string().max(100, 'Tên kháng sinh tối đa 100 ký tự.').optional(),
  ksdKhacKqA: sirEnum.optional(),
  ksdKhacTenB: z.string().max(100, 'Tên kháng sinh tối đa 100 ký tự.').optional(),
  ksdKhacKqB: sirEnum.optional(),
  ksdKhacTenC: z.string().max(100, 'Tên kháng sinh tối đa 100 ký tự.').optional(),
  ksdKhacKqC: sirEnum.optional(),
});

/** Giải phẫu bệnh — trangThai quyết định endpoint nháp hay hoàn tất. */
export const pathologyResultSchema = z.object({
  phuongPhapSinhThiet: z.enum(['punch', 'shave', 'excision', 'incision', 'khac']).optional(),
  viTriSinhThiet: z.string().max(255, 'Vị trí sinh thiết tối đa 255 ký tự.').optional(),
  soManh: z
    .number()
    .int('Số mảnh phải là số nguyên.')
    .positive('Số mảnh phải là số nguyên dương.')
    .optional(),
  chanDoanLamSang: z.string().max(1000, 'Chẩn đoán lâm sàng tối đa 1000 ký tự.').optional(),
  tomTatLamSang: z.string().optional(),
  quaTrinhDieuTri: z.string().optional(),
  nhanXetDaiTheLayMau: z.string().optional(),
  ketQuaSinhThietLanTruoc: z.string().optional(),
  dungDichCoDinh: z.string().max(100, 'Dung dịch cố định tối đa 100 ký tự.').optional(),
  thoiGianCoDinh: z.coerce.date().optional(),
  nguoiPhaBenhPham: z.string().uuid('Mã người pha bệnh phẩm không đúng định dạng UUID.').optional(),
  ngayPha: z.coerce.date().optional(),
  phuongPhapNhuomHE: z.string().max(100, 'Phương pháp nhuộm tối đa 100 ký tự.').optional(),
  ngayLamTieuBan: z.coerce.date().optional(),
  nguoiLamTieuBan: z.string().uuid('Mã người làm tiêu bản không đúng định dạng UUID.').optional(),
  daiThe: z.string().optional(),
  viThe: z.string().optional(),
  nhuomDacBiet: z.string().max(500, 'Nhuộm đặc biệt tối đa 500 ký tự.').optional(),
  chanDoanMoHoc: z.string().max(1000, 'Chẩn đoán mô học tối đa 1000 ký tự.').optional(),
  phuHopChanDoanLamSang: z.enum(['phu_hop', 'khong_phu_hop', 'khong_du_thong_tin']).optional(),
  icd10MoHoc: z
    .string()
    .regex(/^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/, 'Mã ICD-10 không đúng định dạng, VD: L23.9.')
    .optional(),
  bacSiGiaiPhauBenh: z
    .string()
    .uuid('Mã bác sĩ giải phẫu bệnh không đúng định dạng UUID.')
    .optional(),
  ngayTraKetQua: z.coerce.date().optional(),
});

const reportCodeSchema = z
  .string()
  .max(30, 'Mã phiếu tối đa 30 ký tự.')
  .regex(
    /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/,
    'Mã phiếu chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch chéo.',
  )
  .optional();

const signatureFields = {
  attachmentId: z.string().min(1, 'Tệp đính kèm là bắt buộc.'),
  signatureConfirmation: z.literal(true),
  signatureMethod: z.literal('dev_e_confirmation'),
};

const recordLabResultVariants = [
  z.object({
    resultTableKey: z.literal('xn_cong_thuc_mau'),
    structuredResult: cbcResultSchema,
    ...{ ...signatureFields },
    reportCode: reportCodeSchema,
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
  }),
  z.object({
    resultTableKey: z.literal('xn_nuoc_tieu'),
    structuredResult: urinalysisResultSchema,
    ...{ ...signatureFields },
    reportCode: reportCodeSchema,
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
  }),
  z.object({
    resultTableKey: z.literal('xn_vi_sinh'),
    structuredResult: microbiologyResultSchema,
    ...{ ...signatureFields },
    reportCode: reportCodeSchema,
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
  }),
  z.object({
    resultTableKey: z.literal('xn_mo_benh_hoc'),
    structuredResult: pathologyResultSchema.extend({
      trangThai: z.literal('da_co_ket_qua'),
      chanDoanMoHoc: z.string().min(1, 'Chẩn đoán mô học là bắt buộc.').max(1000),
      bacSiGiaiPhauBenh: z.string().uuid('Mã bác sĩ giải phẫu bệnh không đúng định dạng UUID.'),
      ngayTraKetQua: z.coerce.date(),
    }),
    ...{ ...signatureFields },
    reportCode: reportCodeSchema,
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
  }),
  z.object({
    resultTableKey: z.literal('xn_hoa_sinh_mau'),
    structuredResult: bioChemistryResultSchema,
    ...{ ...signatureFields },
    reportCode: reportCodeSchema,
    specimenType: z.string().max(100).optional(),
    method: z.string().max(255).optional(),
    conclusion: z.string().max(1000).optional(),
  }),
] as const;

/** Kiểm tra các quy tắc liên trường sau khi đã xác định loại bảng kết quả. */
function refineLabResult(
  value: z.infer<(typeof recordLabResultVariants)[number]>,
  context: z.RefinementCtx,
) {
  if (value.resultTableKey !== 'xn_vi_sinh') return;

  if (!value.conclusion?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['conclusion'],
      message: 'Kết luận là bắt buộc đối với phiếu vi sinh.',
    });
  }

  const result = value.structuredResult;
  const hasAntibiogramResult = [
    ...ANTIBIOGRAM_FIELDS,
    'ksdKhacKqA',
    'ksdKhacKqB',
    'ksdKhacKqC',
  ].some((field) => Boolean(result[field as keyof typeof result]));
  if (hasAntibiogramResult && !result.chungVkKsd?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['structuredResult', 'chungVkKsd'],
      message: 'Cần nhập chủng vi khuẩn khi đã có kết quả kháng sinh đồ.',
    });
  }
}

export const recordLabResultSchema = z
  .discriminatedUnion('resultTableKey', recordLabResultVariants)
  .superRefine(refineLabResult);

export const savePathologyWorkupDraftSchema = z.object({
  resultTableKey: z.literal('xn_mo_benh_hoc'),
  structuredResult: pathologyResultSchema.extend({ trangThai: z.literal('cho_ket_qua') }),
  attachmentId: z.string().min(1, 'Tệp đính kèm không hợp lệ.').optional(),
});

export const updateReferenceRangeSchema = z.object({
  referenceRange: z.string().max(255, 'Khoảng tham chiếu tối đa 255 ký tự.'),
});
export const referenceRangeIdParamsSchema = z.object({ referenceRangeId: z.string().min(1) });
export const listReferenceRangesQuerySchema = z.object({
  labTestTypeId: z.string().min(1).optional(),
  keyword: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const referenceRangeFields = {
  labTestTypeId: z.string().min(1, 'Loại xét nghiệm là bắt buộc.'),
  fieldKey: z
    .string()
    .min(1, 'Field chỉ số là bắt buộc.')
    .max(100, 'Field chỉ số tối đa 100 ký tự.'),
  code: z
    .string()
    .min(1, 'Mã chỉ số là bắt buộc.')
    .max(20, 'Mã chỉ số tối đa 20 ký tự.')
    .regex(
      /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
      'Mã chỉ số không được chứa khoảng trắng hoặc ký tự đặc biệt.',
    ),
  label: z.string().min(1, 'Tên chỉ số là bắt buộc.').max(255, 'Tên chỉ số tối đa 255 ký tự.'),
  unit: z.string().max(50, 'Đơn vị tối đa 50 ký tự.').optional(),
  lowerBound: decimalRange({ label: 'Ngưỡng dưới', precision: 15, scale: 4 }).optional(),
  upperBound: decimalRange({ label: 'Ngưỡng trên', precision: 15, scale: 4 }).optional(),
  condition: z.enum(['all', 'male', 'female']).default('all'),
};

function withReferenceBoundValidation<T extends z.AnyZodObject>(schema: T) {
  return schema.superRefine((value, context) => {
    if (value.lowerBound === undefined || value.upperBound === undefined) return;
    if (Number(value.lowerBound) >= Number(value.upperBound)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['upperBound'],
        message: 'Ngưỡng dưới phải nhỏ hơn ngưỡng trên.',
      });
    }
  });
}

export const createReferenceRangeSchema = withReferenceBoundValidation(
  z.object(referenceRangeFields),
);
export const updateReferenceRangeDetailSchema = withReferenceBoundValidation(
  z.object(referenceRangeFields).partial().extend({ isActive: z.boolean().optional() }),
);
export const labActivityStatsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('today'),
  date: z.string().optional(),
});
