import { labWorkspaceStyles as tableStyles } from '../../pages/workspace/lab-workspace.styles';
import {
  ANTIBIOGRAM_FIELDS,
  ANTIBIOGRAM_LABELS,
  type MicrobiologyResult,
  type SirResult,
} from '../../types/lab-test.types';
import { SelectField, TextAreaField, TextField } from '../SharedComponents';
import { cn } from '../SharedComponents';

interface MicrobiologyFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: MicrobiologyResult) => void;
  value: MicrobiologyResult;
}

// Chuẩn hóa giá trị rỗng để các input xét nghiệm luôn nhận chuỗi hiển thị hợp lệ.
function getFieldValue(value: string | null | undefined): string {
  return value ?? '';
}

const AM_DUONG_OPTIONS = [
  { value: 'am_tinh', label: 'Âm tính' },
  { value: 'duong_tinh', label: 'Dương tính' },
];

/** Kết quả kháng sinh đồ chỉ nhận ba trạng thái chuẩn: nhạy (S), trung gian (I) và kháng (R). */
const SIR_OPTIONS: SirResult[] = ['S', 'I', 'R'];

/**
 * Điều khiển một lựa chọn S/I/R; nhấn lại lựa chọn hiện tại sẽ xóa kết quả về trạng thái chưa nhập.
 *
 * @param onChange - Callback nhận trạng thái mới hoặc chuỗi rỗng khi người dùng bỏ chọn.
 * @param value - Kết quả hiện tại của kháng sinh đang chỉnh sửa.
 */
function SirToggle({
  onChange,
  value,
}: {
  onChange: (value: SirResult | '') => void;
  value: SirResult | '';
}) {
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

/**
 * Nhập kết quả vi sinh, nuôi cấy và kháng sinh đồ theo schema của phiếu xét nghiệm.
 *
 * @param errors - Lỗi theo field do panel cung cấp, đặc biệt lỗi thiếu chủng vi khuẩn khi có S/I/R.
 * @param onFieldBlur - Callback đánh dấu field đã chạm để điều khiển lỗi inline.
 * @param onChange - Callback nhận toàn bộ draft vi sinh; việc ghi nhận/ký do panel thực hiện.
 * @param value - Kết quả đang chỉnh sửa, gồm 30 kháng sinh cố định và tối đa 3 kháng sinh khác.
 * @remarks Các kết quả định tính dùng mã API `am_tinh`/`duong_tinh`; kháng sinh đồ dùng S/I/R.
 * Form không tự tải dữ liệu, mutation hoặc kiểm tra quyền; trạng thái loading/forbidden/success
 * thuộc component cha và backend.
 */
export function MicrobiologyForm({ errors, onChange, onFieldBlur, value }: MicrobiologyFormProps) {
  // Bỏ chuỗi rỗng khỏi draft để validator phân biệt kháng sinh chưa nhập với kết quả thực tế.
  function set<K extends keyof MicrobiologyResult>(key: K, next: MicrobiologyResult[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Soi trực tiếp / Nuôi cấy
      </p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          label="Vị trí lấy mẫu"
          onChange={(v) => set('viTriLayMau', v)}
          value={getFieldValue(value.viTriLayMau)}
        />
        <TextField
          label="Phương pháp soi"
          onChange={(v) => set('phuongPhapSoi', v)}
          value={getFieldValue(value.phuongPhapSoi)}
        />
        <SelectField
          label="Soi nấm (KOH)"
          onChange={(v) => set('soiNam', v as MicrobiologyResult['soiNam'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.soiNam)}
        />
        <SelectField
          label="Tế bào nấm men"
          onChange={(v) => set('teBaoNamMen', v as MicrobiologyResult['teBaoNamMen'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.teBaoNamMen)}
        />
        <SelectField
          label="Bào tử"
          onChange={(v) => set('baoTu', v as MicrobiologyResult['baoTu'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.baoTu)}
        />
        <TextField
          label="Mô tả hình thái nấm"
          onChange={(v) => set('moTaHinhThaiNam', v)}
          value={getFieldValue(value.moTaHinhThaiNam)}
        />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <TextAreaField
          label="Trực tiếp"
          onChange={(v) => set('trucTiep', v)}
          value={getFieldValue(value.trucTiep)}
        />
        <TextAreaField
          label="Phản ứng huyết thanh"
          onChange={(v) => set('phanUngHT', v)}
          value={getFieldValue(value.phanUngHT)}
        />
        <TextAreaField
          label="Nuôi cấy ái khí"
          onChange={(v) => set('nuoiCayAiKhi', v)}
          value={getFieldValue(value.nuoiCayAiKhi)}
        />
        <TextAreaField
          label="Nuôi cấy kỵ khí"
          onChange={(v) => set('nuoiCayKyKhi', v)}
          value={getFieldValue(value.nuoiCayKyKhi)}
        />
      </div>
      <div className="mb-5">
        <TextField
          error={errors.chungVkKsd}
          label="Chủng vi khuẩn làm kháng sinh đồ"
          onBlur={() => onFieldBlur('chungVkKsd')}
          onChange={(v) => set('chungVkKsd', v)}
          value={getFieldValue(value.chungVkKsd)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Kháng sinh đồ (S: nhạy · I: trung gian · R: kháng)
      </p>
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

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Kháng sinh khác
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['A', 'B', 'C'] as const).map((slot) => (
          <div className="flex items-end gap-2" key={slot}>
            <div className="flex-1">
              <TextField
                label={`Kháng sinh khác ${slot}`}
                onChange={(v) => set(`ksdKhacTen${slot}`, v)}
                value={getFieldValue(value[`ksdKhacTen${slot}`])}
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
