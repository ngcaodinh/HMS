import type { ReferenceRange } from '../types/medical-record.types';

const ANTIBIOGRAM_LABELS: Record<string, string> = {
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

const SEMI_QUANT_LABELS: Record<string, string> = {
  am_tinh: 'Âm tính', vet: 'Vết', cong: '1+', v_2_cong: '2+', v_3_cong: '3+', v_4_cong: '4+',
  duong_tinh: 'Dương tính', binh_thuong: 'Bình thường',
  trong: 'Trong', hoi_duc: 'Hơi đục', duc: 'Đục',
  punch: 'Punch', shave: 'Shave', excision: 'Excision', incision: 'Incision', khac: 'Khác',
  phu_hop: 'Phù hợp', khong_phu_hop: 'Không phù hợp', khong_du_thong_tin: 'Không đủ thông tin',
  cho_ket_qua: 'Chờ kết quả', da_co_ket_qua: 'Đã có kết quả',
  S: 'Nhạy (S)', I: 'Trung gian (I)', R: 'Kháng (R)',
};

const FIELD_LABELS: Record<string, string> = {
  mayXetNghiem: 'Máy xét nghiệm', mauBenhPham: 'Mẫu bệnh phẩm', ghiChuChiSo: 'Ghi chú chỉ số',
  wbc: 'WBC', neu: 'NEU %', lym: 'LYM %', mono: 'MONO %', eos: 'EOS %', baso: 'BASO %', rbc: 'RBC',
  hgb: 'HGB', hct: 'HCT', mcv: 'MCV', mch: 'MCH', mchc: 'MCHC', rdw: 'RDW', plt: 'PLT', mpv: 'MPV', pdw: 'PDW', pct: 'PCT',
  mauSac: 'Màu sắc', doTrong: 'Độ trong', ph: 'pH', tyTrong: 'Tỉ trọng', glucose: 'Glucose', protein: 'Protein',
  ketone: 'Thể ceton', bilirubin: 'Bilirubin', urobilinogen: 'Urobilinogen', blood: 'Máu (Blood)', leukocyte: 'Bạch cầu',
  nitrite: 'Nitrit', hongCauViTruong: 'Hồng cầu (vi trường)', bachCauViTruong: 'Bạch cầu (vi trường)',
  teBaoBieuMo: 'Tế bào biểu mô', viKhuan: 'Vi khuẩn', truNi: 'Trụ niệu', tinhThe: 'Tinh thể', moTaCanLang: 'Mô tả cặn lắng',
  duongChat: 'Dưỡng chấp', porphyrin: 'Porphyrin', proteinBenceJones: 'Protein Bence-Jones',
  nt24TheTich: 'Thể tích 24h', nt24Protein: 'Protein 24h', nt24Glucose: 'Glucose 24h', nt24Ure: 'Urê 24h',
  nt24Creatinin: 'Creatinin 24h', nt24AcidUric: 'Acid uric 24h', nt24Amylase: 'Amylase 24h', nt24Na: 'Na+ 24h', nt24K: 'K+ 24h',
  phanHuyetSacTo: 'Huyết sắc tố (phân)', phanStercobilin: 'Stercobilin', phanStercobilinogen: 'Stercobilinogen',
  phanMauToanPhan: 'Máu toàn phần (phân)', phanGhiChu: 'Ghi chú (phân)',
  dntProtein: 'Protein (DNT)', dntGlucose: 'Glucose (DNT)', dntClorua: 'Clorua (DNT)', dntPandy: 'Phản ứng Pandy', dntGhiChu: 'Ghi chú (DNT)',
  dichViHClTuDo: 'HCl tự do', dichViHClToanPhan: 'HCl toàn phần', dichViGhiChu: 'Ghi chú (dịch vị)',
  dcdRivalta: 'Phản ứng Rivalta', dcdProtein: 'Protein (dịch chọc dò)', dcdGhiChu: 'Ghi chú (dịch chọc dò)',
  viTriLayMau: 'Vị trí lấy mẫu', phuongPhapSoi: 'Phương pháp soi', trucTiep: 'Trực tiếp', soiNam: 'Soi nấm (KOH)',
  teBaoNamMen: 'Tế bào nấm men', baoTu: 'Bào tử', moTaHinhThaiNam: 'Mô tả hình thái nấm',
  nuoiCayAiKhi: 'Nuôi cấy ái khí', nuoiCayKyKhi: 'Nuôi cấy kỵ khí', phanUngHT: 'Phản ứng huyết thanh',
  chungVkKsd: 'Chủng vi khuẩn KSĐ', ksdKhacTenA: 'Kháng sinh khác A', ksdKhacKqA: 'Kết quả KS khác A',
  ksdKhacTenB: 'Kháng sinh khác B', ksdKhacKqB: 'Kết quả KS khác B', ksdKhacTenC: 'Kháng sinh khác C', ksdKhacKqC: 'Kết quả KS khác C',
  phuongPhapSinhThiet: 'Phương pháp sinh thiết', viTriSinhThiet: 'Vị trí sinh thiết', soManh: 'Số mảnh',
  chanDoanLamSang: 'Chẩn đoán lâm sàng', tomTatLamSang: 'Tóm tắt lâm sàng', quaTrinhDieuTri: 'Quá trình điều trị',
  nhanXetDaiTheLayMau: 'Nhận xét đại thể khi lấy mẫu', ketQuaSinhThietLanTruoc: 'Kết quả sinh thiết lần trước',
  dungDichCoDinh: 'Dung dịch cố định', phuongPhapNhuomHE: 'Phương pháp nhuộm', nhuomDacBiet: 'Nhuộm đặc biệt',
  daiThe: 'Nhận xét đại thể', viThe: 'Nhận xét vi thể', chanDoanMoHoc: 'Chẩn đoán giải phẫu bệnh',
  phuHopChanDoanLamSang: 'Phù hợp chẩn đoán lâm sàng', icd10MoHoc: 'Mã ICD-10', trangThai: 'Trạng thái',
  bacSiGiaiPhauBenh: 'Bác sĩ đọc kết quả', ngayTraKetQua: 'Ngày trả kết quả',
  ure: 'Urê', creatinin: 'Creatinin', acidUric: 'Acid Uric', bilirubinTP: 'Bilirubin T.P',
  bilirubinTT: 'Bilirubin T.T', bilirubinGT: 'Bilirubin G.T', proteinTP: 'Protein T.P',
  tyLeAG: 'Tỷ lệ A/G', fibrinogen: 'Fibrinogen', hdlCho: 'HDL-cholesterol', ldlCho: 'LDL-cholesterol',
  natri: 'Na+', kali: 'K+', clorua: 'Cl-', calci: 'Calci', calciIon: 'Calci ion hoá', phospho: 'Phospho',
  sat: 'Sắt', magie: 'Magiê', ast: 'AST (GOT)', alt: 'ALT (GPT)', amylase: 'Amylase', ck: 'CK', ckMb: 'CK-MB',
  ldh: 'LDH', ggt: 'GGT', cholinesterase: 'Cholinesterase', phosphataseKiem: 'Phosphatase kiềm',
  phDongMach: 'pH động mạch', pco2: 'pCO2', po2DongMach: 'pO2 động mạch', hco3Chuan: 'HCO3 chuẩn', kiemDu: 'Kiềm dư',
  ...ANTIBIOGRAM_LABELS,
};

const SKIP_FIELDS = new Set(['id', 'labTestId', 'createdAt', 'updatedAt']);

/** Một dòng kết quả đã chuẩn hóa để hiển thị trong hồ sơ bác sĩ. */
export interface StructuredResultEntry {
  label: string;
  value: string;
  unit: string | null;
  normalRange: string | null;
  isNormal: boolean | null;
  direction: 'low' | 'high' | null;
}

function isNumeric(value: unknown): value is string | number {
  return (typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '' && !Number.isNaN(Number(value));
}

/**
 * Chuẩn hóa result xét nghiệm và chọn khoảng tham chiếu theo giới tính.
 *
 * @param structuredResult Snapshot kết quả; metadata kỹ thuật không được hiển thị như chỉ số.
 * @param referenceRanges Khoảng tham chiếu theo field, ưu tiên giới tính rồi fallback `all`.
 * @param patientGender Giới tính dùng chọn khoảng tham chiếu, có thể thiếu.
 * @returns Danh sách dòng gồm nhãn, giá trị, đơn vị, khoảng và cờ bất thường.
 * @remarks Hàm chỉ map dữ liệu để trình bày, không thay thế kết luận hoặc quyền ký của backend.
 */
export function formatStructuredResultEntries(
  structuredResult: Record<string, unknown> | null,
  referenceRanges: ReferenceRange[] = [],
  patientGender?: 'male' | 'female',
): StructuredResultEntry[] {
  if (!structuredResult) return [];
  return Object.entries(structuredResult)
    .filter(([key, value]) => !SKIP_FIELDS.has(key) && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const candidates = referenceRanges.filter((range) => range.fieldKey === key);
      const range = candidates.find((r) => r.condition === patientGender) ?? candidates.find((r) => r.condition === 'all');
      const unit = range?.unit ?? null;
      const normalRange = range
        ? range.lowerBound && range.upperBound
          ? `${range.lowerBound}–${range.upperBound}`
          : range.lowerBound
            ? `≥ ${range.lowerBound}`
            : range.upperBound
              ? `≤ ${range.upperBound}`
              : null
        : null;

      let isNormal: boolean | null = null;
      let direction: 'low' | 'high' | null = null;
      if (range && isNumeric(value)) {
        const numeric = Number(value);
        const belowLower = range.lowerBound !== null && numeric < Number(range.lowerBound);
        const aboveUpper = range.upperBound !== null && numeric > Number(range.upperBound);
        isNormal = !belowLower && !aboveUpper;
        direction = belowLower ? 'low' : aboveUpper ? 'high' : null;
      }

      return {
        label: FIELD_LABELS[key] ?? key,
        value: SEMI_QUANT_LABELS[String(value)] ?? String(value),
        unit,
        normalRange,
        isNormal,
        direction,
      };
    });
}
