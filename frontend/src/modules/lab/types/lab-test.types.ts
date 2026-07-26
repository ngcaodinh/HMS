export type ResultTableKey = 'xn_cong_thuc_mau' | 'xn_nuoc_tieu' | 'xn_vi_sinh' | 'xn_mo_benh_hoc' | 'xn_hoa_sinh_mau';
export type LabTestStatus = 'ordered' | 'in_progress' | 'resulted';

interface PatientSummary {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
}

export interface LabTestQueueItem {
  labTestId: string;
  recordId: string;
  labTestTypeId: string;
  testName: string;
  resultTableKey: ResultTableKey;
  specimenType: string | null;
  isUrgent: boolean;
  status: LabTestStatus;
  reportCode: string | null;
  createdAt: string;
  patient: PatientSummary;
  department: { name: string } | null;
  orderingDoctor: { fullName: string };
}

export interface CbcResult {
  mayXetNghiem?: string | null;
  mauBenhPham?: string | null;
  wbc?: string | null;
  neu?: string | null;
  lym?: string | null;
  mono?: string | null;
  eos?: string | null;
  baso?: string | null;
  rbc?: string | null;
  hgb?: string | null;
  hct?: string | null;
  mcv?: string | null;
  mch?: string | null;
  mchc?: string | null;
  rdw?: string | null;
  plt?: string | null;
  mpv?: string | null;
  pdw?: string | null;
  pct?: string | null;
  ghiChuChiSo?: string | null;
}

export type SemiQuant = 'am_tinh' | 'vet' | 'cong' | 'v_2_cong' | 'v_3_cong' | 'v_4_cong';
export type AmTinhDuongTinh = 'am_tinh' | 'duong_tinh';

export interface UrinalysisResult {
  mayXetNghiem?: string | null;
  phuongPhap?: string | null;
  mauSac?: string | null;
  doTrong?: 'trong' | 'hoi_duc' | 'duc' | null;
  ph?: string | null;
  tyTrong?: string | null;
  glucose?: SemiQuant | null;
  protein?: SemiQuant | null;
  ketone?: SemiQuant | null;
  bilirubin?: 'am_tinh' | 'cong' | 'v_2_cong' | 'v_3_cong' | null;
  urobilinogen?: 'binh_thuong' | 'cong' | 'v_2_cong' | 'v_3_cong' | 'v_4_cong' | null;
  blood?: SemiQuant | null;
  leukocyte?: SemiQuant | null;
  nitrite?: AmTinhDuongTinh | null;
  hongCauViTruong?: string | null;
  bachCauViTruong?: string | null;
  teBaoBieuMo?: string | null;
  viKhuan?: string | null;
  truNi?: string | null;
  tinhThe?: string | null;
  moTaCanLang?: string | null;
  duongChat?: AmTinhDuongTinh | null;
  porphyrin?: AmTinhDuongTinh | null;
  proteinBenceJones?: AmTinhDuongTinh | null;
  nt24TheTich?: string | null;
  nt24Protein?: string | null;
  nt24Glucose?: string | null;
  nt24Ure?: string | null;
  nt24Creatinin?: string | null;
  nt24AcidUric?: string | null;
  nt24Amylase?: string | null;
  nt24Na?: string | null;
  nt24K?: string | null;
  phanHuyetSacTo?: AmTinhDuongTinh | null;
  phanStercobilin?: AmTinhDuongTinh | null;
  phanStercobilinogen?: AmTinhDuongTinh | null;
  phanMauToanPhan?: AmTinhDuongTinh | null;
  phanGhiChu?: string | null;
  dntProtein?: string | null;
  dntGlucose?: string | null;
  dntClorua?: string | null;
  dntPandy?: AmTinhDuongTinh | null;
  dntGhiChu?: string | null;
  dichViHClTuDo?: string | null;
  dichViHClToanPhan?: string | null;
  dichViGhiChu?: string | null;
  dcdRivalta?: AmTinhDuongTinh | null;
  dcdProtein?: string | null;
  dcdGhiChu?: string | null;
}

export type SirResult = 'S' | 'I' | 'R';

/** 30 kháng sinh cố định theo hợp đồng API — khớp đúng `ANTIBIOGRAM_FIELDS` phía backend. */
export const ANTIBIOGRAM_FIELDS = [
  'ksdPenicilline', 'ksdAmpicilline', 'ksdAmoAClavulanic', 'ksdAztreonam', 'ksdMezlocilline',
  'ksdOxacillinePhe', 'ksdOxacillineTu', 'ksdCephalotine', 'ksdCefuroxime', 'ksdCeftazidime',
  'ksdCefotaxime', 'ksdCeftriaxone', 'ksdCefoperazone', 'ksdCefepime', 'ksdVancomycin',
  'ksdClindamycin', 'ksdChloramphenicol', 'ksdErythromycine', 'ksdTetracycline', 'ksdDoxycycline',
  'ksdNalidixicAcid', 'ksdNofloxacine', 'ksdCiprofloxacine', 'ksdOfloxacine', 'ksdGentamycine',
  'ksdTobramycine', 'ksdAmikacine', 'ksdNetromycine', 'ksdCoTrimoxazol', 'ksdNitroxoline',
] as const;

export const ANTIBIOGRAM_LABELS: Record<(typeof ANTIBIOGRAM_FIELDS)[number], string> = {
  ksdPenicilline: 'Penicilline',
  ksdAmpicilline: 'Ampicilline',
  ksdAmoAClavulanic: 'Amo + A.clavulanic',
  ksdAztreonam: 'Aztreonam',
  ksdMezlocilline: 'Mezlocilline',
  ksdOxacillinePhe: 'Oxacilline/phế',
  ksdOxacillineTu: 'Oxacilline/tụ',
  ksdCephalotine: 'Cephalotine',
  ksdCefuroxime: 'Cefuroxime',
  ksdCeftazidime: 'Ceftazidime',
  ksdCefotaxime: 'Cefotaxime',
  ksdCeftriaxone: 'Ceftriaxone',
  ksdCefoperazone: 'Cefoperazone',
  ksdCefepime: 'Cefepime',
  ksdVancomycin: 'Vancomycin',
  ksdClindamycin: 'Clindamycin',
  ksdChloramphenicol: 'Chloramphenicol',
  ksdErythromycine: 'Erythromycine',
  ksdTetracycline: 'Tetracycline',
  ksdDoxycycline: 'Doxycycline',
  ksdNalidixicAcid: 'Nalidixic acid',
  ksdNofloxacine: 'Nofloxacine',
  ksdCiprofloxacine: 'Ciprofloxacine',
  ksdOfloxacine: 'Ofloxacine',
  ksdGentamycine: 'Gentamycine',
  ksdTobramycine: 'Tobramycine',
  ksdAmikacine: 'Amikacine',
  ksdNetromycine: 'Netromycine',
  ksdCoTrimoxazol: 'Co-trimoxazol',
  ksdNitroxoline: 'Nitroxoline',
};

export type MicrobiologyResult = {
  viTriLayMau?: string | null;
  phuongPhapSoi?: string | null;
  trucTiep?: string | null;
  soiNam?: AmTinhDuongTinh | null;
  teBaoNamMen?: AmTinhDuongTinh | null;
  baoTu?: AmTinhDuongTinh | null;
  moTaHinhThaiNam?: string | null;
  nuoiCayAiKhi?: string | null;
  nuoiCayKyKhi?: string | null;
  phanUngHT?: string | null;
  chungVkKsd?: string | null;
  ksdKhacTenA?: string | null;
  ksdKhacKqA?: SirResult | null;
  ksdKhacTenB?: string | null;
  ksdKhacKqB?: SirResult | null;
  ksdKhacTenC?: string | null;
  ksdKhacKqC?: SirResult | null;
} & Partial<Record<(typeof ANTIBIOGRAM_FIELDS)[number], SirResult | null>>;

export interface PathologyResult {
  phuongPhapSinhThiet?: 'punch' | 'shave' | 'excision' | 'incision' | 'khac' | null;
  viTriSinhThiet?: string | null;
  soManh?: number | null;
  chanDoanLamSang?: string | null;
  tomTatLamSang?: string | null;
  quaTrinhDieuTri?: string | null;
  nhanXetDaiTheLayMau?: string | null;
  ketQuaSinhThietLanTruoc?: string | null;
  dungDichCoDinh?: string | null;
  thoiGianCoDinh?: string | null;
  nguoiPhaBenhPham?: string | null;
  ngayPha?: string | null;
  phuongPhapNhuomHE?: string | null;
  ngayLamTieuBan?: string | null;
  nguoiLamTieuBan?: string | null;
  daiThe?: string | null;
  viThe?: string | null;
  nhuomDacBiet?: string | null;
  chanDoanMoHoc?: string | null;
  phuHopChanDoanLamSang?: 'phu_hop' | 'khong_phu_hop' | 'khong_du_thong_tin' | null;
  icd10MoHoc?: string | null;
  trangThai: 'cho_ket_qua' | 'da_co_ket_qua';
  bacSiGiaiPhauBenh?: string | null;
  ngayTraKetQua?: string | null;
}

export interface BioChemistryResult {
  mayXetNghiem?: string | null;
  mauBenhPham?: string | null;
  ure?: string | null;
  glucose?: string | null;
  creatinin?: string | null;
  acidUric?: string | null;
  bilirubinTP?: string | null;
  bilirubinTT?: string | null;
  bilirubinGT?: string | null;
  proteinTP?: string | null;
  albumin?: string | null;
  globulin?: string | null;
  tyLeAG?: string | null;
  fibrinogen?: string | null;
  cholesterol?: string | null;
  triglycerid?: string | null;
  hdlCho?: string | null;
  ldlCho?: string | null;
  natri?: string | null;
  kali?: string | null;
  clorua?: string | null;
  calci?: string | null;
  calciIon?: string | null;
  phospho?: string | null;
  sat?: string | null;
  magie?: string | null;
  ast?: string | null;
  alt?: string | null;
  amylase?: string | null;
  ck?: string | null;
  ckMb?: string | null;
  ldh?: string | null;
  ggt?: string | null;
  cholinesterase?: string | null;
  phosphataseKiem?: string | null;
  phDongMach?: string | null;
  pco2?: string | null;
  po2DongMach?: string | null;
  hco3Chuan?: string | null;
  kiemDu?: string | null;
  ghiChuChiSo?: string | null;
}

export type StructuredResult =
  | CbcResult
  | UrinalysisResult
  | MicrobiologyResult
  | PathologyResult
  | BioChemistryResult
  | null;

export interface ReferenceRange {
  fieldKey: string;
  code: string;
  label: string;
  unit: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  condition: 'all' | 'male' | 'female';
}

export interface LabTestAttachment {
  attachmentId: string;
  fileType: 'pdf' | 'png' | 'jpeg' | 'xml';
  originalName: string;
  uploadedAt: string;
}

export interface LabTestDetail {
  labTestId: string;
  recordId: string;
  testName: string;
  status: LabTestStatus;
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
  patient: PatientSummary & { healthInsuranceCode: string | null };
  department: { name: string } | null;
  orderingDoctor: { fullName: string };
  diagnosis: { icd10: string; diagnosisText: string | null } | null;
  structuredResult: StructuredResult;
  referenceRanges: ReferenceRange[];
  attachments: LabTestAttachment[];
}

export interface LabTestType {
  labTestTypeId: string;
  code: string;
  name: string;
  category: string | null;
  price: string;
  specimen: string | null;
  resultUnit: string | null;
  referenceRange: string | null;
  method: string | null;
  resultTableKey: ResultTableKey;
  isActive: boolean;
}

export interface ReferenceRangeRow {
  referenceRangeId: string;
  labTestTypeId: string;
  labTestTypeName: string;
  resultTableKey: ResultTableKey;
  fieldKey: string;
  code: string;
  label: string;
  unit: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  condition: 'all' | 'male' | 'female';
}

export interface LabActivityStats {
  totalReceived: number;
  totalCompleted: number;
  urgentCompleted: number;
  averageTatMinutes: number;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}
