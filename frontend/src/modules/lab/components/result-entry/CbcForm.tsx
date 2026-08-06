import type { CbcResult } from '../../types/lab-test.types';
import { NumericField, TextAreaField, TextField } from '../SharedComponents';

interface CbcFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: CbcResult) => void;
  value: CbcResult;
}

// Chuẩn hóa giá trị rỗng để các input xét nghiệm luôn nhận chuỗi hiển thị hợp lệ.
function getFieldValue(value: string | null | undefined): string {
  return value ?? '';
}

const NUMERIC_FIELDS = [
  'mcv',
  'mch',
  'mchc',
  'rdw',
  'plt',
  'mpv',
  'pdw',
  'pct',
  'neu',
  'lym',
  'mono',
  'eos',
  'baso',
] as const;

/** Các differential CBC dùng tỷ lệ 0–100% theo validator của công thức máu. */
const PERCENT_FIELDS = new Set(['neu', 'lym', 'mono', 'eos', 'baso']);

/**
 * Nhập kết quả công thức máu (CBC) trong trạng thái bản nháp do panel bên ngoài điều khiển.
 *
 * @param errors - Lỗi theo field do panel tổng hợp từ validator cục bộ và API; chỉ hiển thị tại
 * field.
 * @param onFieldBlur - Callback ghi nhận field đã được chạm để điều khiển thời điểm hiện lỗi.
 * @param onChange - Callback nhận toàn bộ kết quả CBC sau mỗi thay đổi, không tự gọi API.
 * @param value - Snapshot kết quả đang chỉnh sửa; giá trị chưa nhập được hiển thị như chuỗi rỗng.
 * @remarks HCT nhập theo tỷ lệ 0–1, các differential NEU/LYM/MONO/EOS/BASO theo 0–100%; đơn vị
 * được hiển thị tại field và việc validate/ký kết quả thuộc panel cùng backend. Form không tự tải,
 * lưu hoặc phân quyền nên không có trạng thái loading/forbidden/success riêng.
 */
export function CbcForm({ errors, onChange, onFieldBlur, value }: CbcFormProps) {
  // Giữ field rỗng ở dạng undefined trong draft để payload không phân biệt sai với giá trị đã nhập.
  function set<K extends keyof CbcResult>(key: K, next: string) {
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

      <div className="grid gap-4 sm:grid-cols-3">
        <NumericField
          error={errors.wbc}
          label="WBC"
          onBlur={() => onFieldBlur('wbc')}
          onChange={(v) => set('wbc', v)}
          unit="G/L"
          value={getFieldValue(value.wbc)}
        />
        <NumericField
          error={errors.rbc}
          label="RBC"
          onBlur={() => onFieldBlur('rbc')}
          onChange={(v) => set('rbc', v)}
          unit="T/L"
          value={getFieldValue(value.rbc)}
        />
        <NumericField
          error={errors.hgb}
          label="HGB"
          onBlur={() => onFieldBlur('hgb')}
          onChange={(v) => set('hgb', v)}
          unit="g/L"
          value={getFieldValue(value.hgb)}
        />
        <NumericField
          error={errors.hct}
          hint="Tỷ lệ 0–1 (VD 0.42), không nhập theo %"
          label="HCT"
          onBlur={() => onFieldBlur('hct')}
          onChange={(v) => set('hct', v)}
          value={getFieldValue(value.hct)}
        />
        {NUMERIC_FIELDS.map((key) => (
          <NumericField
            error={errors[key]}
            hint={PERCENT_FIELDS.has(key) ? '0–100%' : undefined}
            key={key}
            label={key.toUpperCase()}
            onBlur={() => onFieldBlur(key)}
            onChange={(v) => set(key, v)}
            value={getFieldValue(value[key])}
          />
        ))}
      </div>

      <div className="mt-4">
        <TextAreaField
          label="Ghi chú chỉ số"
          onChange={(v) => set('ghiChuChiSo', v)}
          value={getFieldValue(value.ghiChuChiSo)}
        />
      </div>
    </div>
  );
}
