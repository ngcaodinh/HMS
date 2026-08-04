import type { CbcResult } from '../../types/lab-test.types';
import { NumericField, TextAreaField, TextField } from '../shared';

interface CbcFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: CbcResult) => void;
  value: CbcResult;
}

function field(value: string | null | undefined): string {
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
const PERCENT_FIELDS = new Set(['neu', 'lym', 'mono', 'eos', 'baso']);

/** Hiển thị form CBC và gắn lỗi theo field sau khi người dùng blur hoặc submit. */
export function CbcForm({ errors, onChange, onFieldBlur, value }: CbcFormProps) {
  function set<K extends keyof CbcResult>(key: K, next: string) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Máy xét nghiệm"
          onChange={(v) => set('mayXetNghiem', v)}
          value={field(value.mayXetNghiem)}
        />
        <TextField
          label="Mẫu bệnh phẩm"
          onChange={(v) => set('mauBenhPham', v)}
          value={field(value.mauBenhPham)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <NumericField
          error={errors.wbc}
          label="WBC"
          onBlur={() => onFieldBlur('wbc')}
          onChange={(v) => set('wbc', v)}
          unit="G/L"
          value={field(value.wbc)}
        />
        <NumericField
          error={errors.rbc}
          label="RBC"
          onBlur={() => onFieldBlur('rbc')}
          onChange={(v) => set('rbc', v)}
          unit="T/L"
          value={field(value.rbc)}
        />
        <NumericField
          error={errors.hgb}
          label="HGB"
          onBlur={() => onFieldBlur('hgb')}
          onChange={(v) => set('hgb', v)}
          unit="g/L"
          value={field(value.hgb)}
        />
        <NumericField
          error={errors.hct}
          hint="Tỷ lệ 0–1 (VD 0.42), không nhập theo %"
          label="HCT"
          onBlur={() => onFieldBlur('hct')}
          onChange={(v) => set('hct', v)}
          value={field(value.hct)}
        />
        {NUMERIC_FIELDS.map((key) => (
          <NumericField
            error={errors[key]}
            hint={PERCENT_FIELDS.has(key) ? '0–100%' : undefined}
            key={key}
            label={key.toUpperCase()}
            onBlur={() => onFieldBlur(key)}
            onChange={(v) => set(key, v)}
            value={field(value[key])}
          />
        ))}
      </div>

      <div className="mt-4">
        <TextAreaField
          label="Ghi chú chỉ số"
          onChange={(v) => set('ghiChuChiSo', v)}
          value={field(value.ghiChuChiSo)}
        />
      </div>
    </div>
  );
}
