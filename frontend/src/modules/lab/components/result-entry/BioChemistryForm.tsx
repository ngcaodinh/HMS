import type { BioChemistryResult, ReferenceRange } from '../../types/lab-test.types';
import { findReferenceRangeHint } from '../reference-range-hint';
import { NumericField, TextAreaField, TextField } from '../SharedComponents';

interface BioChemistryFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: BioChemistryResult) => void;
  patientGender?: 'male' | 'female';
  referenceRanges: ReferenceRange[];
  value: BioChemistryResult;
}

// Chuẩn hóa giá trị rỗng để các input xét nghiệm luôn nhận chuỗi hiển thị hợp lệ.
function getFieldValue(value: string | null | undefined): string {
  return value ?? '';
}

/** Nhóm field và đơn vị hiển thị của hóa sinh; giới hạn số và reference range được validator/API
 * cung cấp riêng. */
const SECTIONS: Array<{
  fields: Array<{ key: keyof BioChemistryResult; label: string; unit?: string }>;
  title: string;
}> = [
  {
    title: 'Chức năng thận & chuyển hoá cơ bản',
    fields: [
      { key: 'ure', label: 'Urê', unit: 'mmol/L' },
      { key: 'glucose', label: 'Glucose', unit: 'mmol/L' },
      { key: 'creatinin', label: 'Creatinin', unit: 'mmol/L' },
      { key: 'acidUric', label: 'Acid Uric', unit: 'mmol/L' },
    ],
  },
  {
    title: 'Bilirubin & Protein',
    fields: [
      { key: 'bilirubinTP', label: 'Bilirubin T.P', unit: 'mmol/L' },
      { key: 'bilirubinTT', label: 'Bilirubin T.T', unit: 'mmol/L' },
      { key: 'bilirubinGT', label: 'Bilirubin G.T', unit: 'mmol/L' },
      { key: 'proteinTP', label: 'Protein T.P', unit: 'g/L' },
      { key: 'albumin', label: 'Albumin', unit: 'g/L' },
      { key: 'globulin', label: 'Globulin', unit: 'g/L' },
      { key: 'tyLeAG', label: 'Tỷ lệ A/G' },
      { key: 'fibrinogen', label: 'Fibrinogen', unit: 'g/L' },
    ],
  },
  {
    title: 'Lipid máu',
    fields: [
      { key: 'cholesterol', label: 'Cholesterol', unit: 'mmol/L' },
      { key: 'triglycerid', label: 'Triglycerid', unit: 'mmol/L' },
      { key: 'hdlCho', label: 'HDL-cholesterol', unit: 'mmol/L' },
      { key: 'ldlCho', label: 'LDL-cholesterol', unit: 'mmol/L' },
    ],
  },
  {
    title: 'Điện giải & khoáng chất',
    fields: [
      { key: 'natri', label: 'Na+', unit: 'mmol/L' },
      { key: 'kali', label: 'K+', unit: 'mmol/L' },
      { key: 'clorua', label: 'Cl-', unit: 'mmol/L' },
      { key: 'calci', label: 'Calci', unit: 'mmol/L' },
      { key: 'calciIon', label: 'Calci ion hoá', unit: 'mmol/L' },
      { key: 'phospho', label: 'Phospho', unit: 'mmol/L' },
      { key: 'sat', label: 'Sắt', unit: 'mmol/L' },
      { key: 'magie', label: 'Magiê', unit: 'mmol/L' },
    ],
  },
  {
    title: 'Men gan & enzyme',
    fields: [
      { key: 'ast', label: 'AST (GOT)', unit: 'U/L' },
      { key: 'alt', label: 'ALT (GPT)', unit: 'U/L' },
      { key: 'amylase', label: 'Amylase', unit: 'U/L' },
      { key: 'ck', label: 'CK', unit: 'U/L' },
      { key: 'ckMb', label: 'CK-MB', unit: 'U/L' },
      { key: 'ldh', label: 'LDH', unit: 'U/L' },
      { key: 'ggt', label: 'GGT', unit: 'U/L' },
      { key: 'cholinesterase', label: 'Cholinesterase', unit: 'U/L' },
      { key: 'phosphataseKiem', label: 'Phosphatase kiềm', unit: 'U/L' },
    ],
  },
  {
    title: 'Xét nghiệm khí máu',
    fields: [
      { key: 'phDongMach', label: 'pH động mạch' },
      { key: 'pco2', label: 'pCO2', unit: 'mmHg' },
      { key: 'po2DongMach', label: 'pO2 động mạch', unit: 'mmHg' },
      { key: 'hco3Chuan', label: 'HCO3 chuẩn', unit: 'mmol/L' },
      { key: 'kiemDu', label: 'Kiềm dư', unit: 'mmol/L' },
    ],
  },
];

/**
 * Nhập kết quả hóa sinh máu theo nhóm chỉ số và gợi ý reference range của bệnh nhân.
 *
 * @param errors - Lỗi theo field do panel cung cấp sau blur hoặc submit.
 * @param onFieldBlur - Callback đánh dấu field đã chạm để hiển thị lỗi đúng thời điểm.
 * @param onChange - Callback nhận toàn bộ draft hóa sinh; component không tự gửi mutation.
 * @param patientGender - Giới tính dùng để chọn reference range `male`/`female` khi có dữ liệu.
 * @param referenceRanges - Các khoảng tham chiếu lấy từ chi tiết phiếu xét nghiệm.
 * @param value - Draft có key nghiệp vụ giữ nguyên để panel gửi đúng hợp đồng API.
 * @remarks Các số được giữ dạng chuỗi trong input để không làm mất phần thập phân khi đang nhập;
 * đơn vị được khai báo theo từng nhóm chỉ số. Form chỉ hiển thị lỗi inline và không tự xử lý
 * loading, empty, forbidden, success hay quyền backend.
 */
export function BioChemistryForm({
  errors,
  onChange,
  onFieldBlur,
  patientGender,
  referenceRanges,
  value,
}: BioChemistryFormProps) {
  // Chuỗi rỗng biểu thị field chưa nhập, còn giá trị số được giữ nguyên để validator xử lý.
  function set(key: keyof BioChemistryResult, next: string) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Máy xét nghiệm"
          onChange={(v) => set('mayXetNghiem', v)}
          value={getFieldValue(value.mayXetNghiem)}
        />
        <TextField
          label="Mẫu bệnh phẩm"
          onChange={(v) => set('mauBenhPham', v)}
          value={getFieldValue(value.mauBenhPham)}
        />
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
            {section.title}
          </p>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((fieldDef) => (
              <NumericField
                error={errors[fieldDef.key]}
                hint={findReferenceRangeHint(referenceRanges, fieldDef.key, patientGender)}
                key={fieldDef.key}
                label={fieldDef.label}
                onBlur={() => onFieldBlur(fieldDef.key)}
                onChange={(v) => set(fieldDef.key, v)}
                unit={fieldDef.unit}
                value={getFieldValue(value[fieldDef.key])}
              />
            ))}
          </div>
        </div>
      ))}

      <TextAreaField
        label="Ghi chú chỉ số"
        onChange={(v) => set('ghiChuChiSo', v)}
        value={getFieldValue(value.ghiChuChiSo)}
      />
    </div>
  );
}
