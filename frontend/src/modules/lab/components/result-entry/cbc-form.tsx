import type { CbcResult } from '../../types/lab-test.types';
import { NumericField, TextAreaField, TextField } from '../shared';

interface CbcFormProps {
  onChange: (value: CbcResult) => void;
  value: CbcResult;
}

function field(value: string | null | undefined): string {
  return value ?? '';
}

export function CbcForm({ onChange, value }: CbcFormProps) {
  function set<K extends keyof CbcResult>(key: K, next: string) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <TextField label="Máy xét nghiệm" onChange={(v) => set('mayXetNghiem', v)} value={field(value.mayXetNghiem)} />
        <TextField label="Mẫu bệnh phẩm" onChange={(v) => set('mauBenhPham', v)} value={field(value.mauBenhPham)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <NumericField label="WBC" onChange={(v) => set('wbc', v)} unit="G/L" value={field(value.wbc)} />
        <NumericField label="RBC" onChange={(v) => set('rbc', v)} unit="T/L" value={field(value.rbc)} />
        <NumericField label="HGB" onChange={(v) => set('hgb', v)} unit="g/L" value={field(value.hgb)} />
        <NumericField
          hint="Tỉ lệ 0–1 (VD 0.42), không nhập theo %"
          label="HCT"
          onChange={(v) => set('hct', v)}
          value={field(value.hct)}
        />
        <NumericField label="MCV" onChange={(v) => set('mcv', v)} unit="fL" value={field(value.mcv)} />
        <NumericField label="MCH" onChange={(v) => set('mch', v)} unit="pg" value={field(value.mch)} />
        <NumericField label="MCHC" onChange={(v) => set('mchc', v)} unit="g/L" value={field(value.mchc)} />
        <NumericField label="RDW" onChange={(v) => set('rdw', v)} unit="%" value={field(value.rdw)} />
        <NumericField label="PLT" onChange={(v) => set('plt', v)} unit="G/L" value={field(value.plt)} />
        <NumericField label="MPV" onChange={(v) => set('mpv', v)} unit="fL" value={field(value.mpv)} />
        <NumericField label="PDW" onChange={(v) => set('pdw', v)} unit="%" value={field(value.pdw)} />
        <NumericField label="PCT" onChange={(v) => set('pct', v)} unit="%" value={field(value.pct)} />
        <NumericField hint="0–100%" label="NEU" onChange={(v) => set('neu', v)} unit="%" value={field(value.neu)} />
        <NumericField hint="0–100%" label="LYM" onChange={(v) => set('lym', v)} unit="%" value={field(value.lym)} />
        <NumericField hint="0–100%" label="MONO" onChange={(v) => set('mono', v)} unit="%" value={field(value.mono)} />
        <NumericField hint="0–100%" label="EOS" onChange={(v) => set('eos', v)} unit="%" value={field(value.eos)} />
        <NumericField hint="0–100%" label="BASO" onChange={(v) => set('baso', v)} unit="%" value={field(value.baso)} />
      </div>

      <div className="mt-4">
        <TextAreaField label="Ghi chú chỉ số" onChange={(v) => set('ghiChuChiSo', v)} value={field(value.ghiChuChiSo)} />
      </div>
    </div>
  );
}
