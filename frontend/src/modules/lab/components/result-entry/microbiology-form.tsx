import { labWorkspaceStyles as tableStyles } from '../../pages/workspace/lab-workspace.styles';
import { ANTIBIOGRAM_FIELDS, ANTIBIOGRAM_LABELS, type MicrobiologyResult, type SirResult } from '../../types/lab-test.types';
import { SelectField, TextAreaField, TextField } from '../shared';
import { cn } from '../shared';

interface MicrobiologyFormProps {
  onChange: (value: MicrobiologyResult) => void;
  value: MicrobiologyResult;
}

function field(value: string | null | undefined): string {
  return value ?? '';
}

const AM_DUONG_OPTIONS = [
  { value: 'am_tinh', label: 'Âm tính' },
  { value: 'duong_tinh', label: 'Dương tính' },
];

const SIR_OPTIONS: SirResult[] = ['S', 'I', 'R'];

function SirToggle({ onChange, value }: { onChange: (value: SirResult | '') => void; value: SirResult | '' }) {
  return (
    <div className={tableStyles.segmented}>
      {SIR_OPTIONS.map((option) => (
        <button
          className={cn(
            tableStyles.segmentedOption,
            value === option && option === 'S' && tableStyles.segmentedOptionActiveS,
            value === option && option === 'I' && tableStyles.segmentedOptionActiveI,
            value === option && option === 'R' && tableStyles.segmentedOptionActiveR,
          )}
          key={option}
          onClick={() => onChange(value === option ? '' : option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function MicrobiologyForm({ onChange, value }: MicrobiologyFormProps) {
  function set<K extends keyof MicrobiologyResult>(key: K, next: MicrobiologyResult[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Soi trực tiếp / Nuôi cấy</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Vị trí lấy mẫu" onChange={(v) => set('viTriLayMau', v)} value={field(value.viTriLayMau)} />
        <TextField label="Phương pháp soi" onChange={(v) => set('phuongPhapSoi', v)} value={field(value.phuongPhapSoi)} />
        <SelectField label="Soi nấm (KOH)" onChange={(v) => set('soiNam', v as MicrobiologyResult['soiNam'])} options={AM_DUONG_OPTIONS} value={field(value.soiNam)} />
        <SelectField label="Tế bào nấm men" onChange={(v) => set('teBaoNamMen', v as MicrobiologyResult['teBaoNamMen'])} options={AM_DUONG_OPTIONS} value={field(value.teBaoNamMen)} />
        <SelectField label="Bào tử" onChange={(v) => set('baoTu', v as MicrobiologyResult['baoTu'])} options={AM_DUONG_OPTIONS} value={field(value.baoTu)} />
        <TextField label="Mô tả hình thái nấm" onChange={(v) => set('moTaHinhThaiNam', v)} value={field(value.moTaHinhThaiNam)} />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <TextAreaField label="Trực tiếp" onChange={(v) => set('trucTiep', v)} value={field(value.trucTiep)} />
        <TextAreaField label="Phản ứng huyết thanh" onChange={(v) => set('phanUngHT', v)} value={field(value.phanUngHT)} />
        <TextAreaField label="Nuôi cấy ái khí" onChange={(v) => set('nuoiCayAiKhi', v)} value={field(value.nuoiCayAiKhi)} />
        <TextAreaField label="Nuôi cấy kỵ khí" onChange={(v) => set('nuoiCayKyKhi', v)} value={field(value.nuoiCayKyKhi)} />
      </div>
      <div className="mb-5">
        <TextField label="Chủng vi khuẩn làm kháng sinh đồ" onChange={(v) => set('chungVkKsd', v)} value={field(value.chungVkKsd)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Kháng sinh đồ (S: nhạy · I: trung gian · R: kháng)</p>
      <div className="mb-4 overflow-hidden rounded-[10px] border border-[#e5e7eb]">
        <table className={tableStyles.antibiogramTable}>
          <tbody className="divide-y divide-[#e5e7eb]">
            {ANTIBIOGRAM_FIELDS.map((fieldName) => (
              <tr key={fieldName}>
                <td className="px-4 py-2 font-medium">{ANTIBIOGRAM_LABELS[fieldName]}</td>
                <td className="px-4 py-2">
                  <SirToggle
                    onChange={(next) => set(fieldName, next || undefined)}
                    value={(value[fieldName] as SirResult) ?? ''}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Kháng sinh khác</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['A', 'B', 'C'] as const).map((slot) => (
          <div className="flex items-end gap-2" key={slot}>
            <div className="flex-1">
              <TextField
                label={`Kháng sinh khác ${slot}`}
                onChange={(v) => set(`ksdKhacTen${slot}`, v)}
                value={field(value[`ksdKhacTen${slot}`])}
              />
            </div>
            <SirToggle
              onChange={(next) => set(`ksdKhacKq${slot}`, next || undefined)}
              value={(value[`ksdKhacKq${slot}`] as SirResult) ?? ''}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
