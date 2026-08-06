import type { UrinalysisResult } from '../../types/lab-test.types';
import { NumericField, SelectField, TextAreaField, TextField } from '../SharedComponents';

interface UrinalysisFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: UrinalysisResult) => void;
  value: UrinalysisResult;
}

// Chuẩn hóa giá trị rỗng để các input xét nghiệm luôn nhận chuỗi hiển thị hợp lệ.
function getFieldValue(value: string | null | undefined): string {
  return value ?? '';
}

const SEMI_QUANT_4 = [
  { value: 'am_tinh', label: 'Âm tính' },
  { value: 'vet', label: 'Vết' },
  { value: 'cong', label: '1+' },
  { value: 'v_2_cong', label: '2+' },
  { value: 'v_3_cong', label: '3+' },
  { value: 'v_4_cong', label: '4+' },
];

// Máu và bạch cầu chỉ hỗ trợ đến 3+ theo hợp đồng field, nên loại mức 4+ khỏi danh sách dùng chung.
const SEMI_QUANT_3 = SEMI_QUANT_4.filter((option) => option.value !== 'v_4_cong');
const BILIRUBIN_OPTIONS = [
  { value: 'am_tinh', label: 'Âm tính' },
  { value: 'cong', label: '1+' },
  { value: 'v_2_cong', label: '2+' },
  { value: 'v_3_cong', label: '3+' },
];
const UROBILINOGEN_OPTIONS = [
  { value: 'binh_thuong', label: 'Bình thường' },
  { value: 'cong', label: '1+' },
  { value: 'v_2_cong', label: '2+' },
  { value: 'v_3_cong', label: '3+' },
  { value: 'v_4_cong', label: '4+' },
];
const AM_DUONG_OPTIONS = [
  { value: 'am_tinh', label: 'Âm tính' },
  { value: 'duong_tinh', label: 'Dương tính' },
];
const DO_TRONG_OPTIONS = [
  { value: 'trong', label: 'Trong' },
  { value: 'hoi_duc', label: 'Hơi đục' },
  { value: 'duc', label: 'Đục' },
];

/**
 * Nhập nhóm kết quả nước tiểu và các xét nghiệm dịch liên quan trong cùng schema urinalysis.
 *
 * @param errors - Lỗi các trường số do panel cung cấp sau blur hoặc submit.
 * @param onFieldBlur - Callback ghi nhận field đã chạm để hiển thị lỗi inline.
 * @param onChange - Callback nhận toàn bộ draft; component không tự gọi API.
 * @param value - Kết quả đang chỉnh sửa, gồm que thử, cặn vi thể, nước tiểu 24 giờ, phân, DNT,
 * dịch vị và dịch chọc dò khác.
 * @remarks Các lựa chọn định tính/bán định lượng dùng mã schema; các trường số giữ dạng chuỗi
 * trong input và hiển thị đơn vị theo từng nhóm (L, g/d, mmol/d, g/L...). Form không có loading,
 * empty, forbidden hoặc success riêng; panel cha chịu trách nhiệm submit và backend phân quyền.
 */
export function UrinalysisForm({ errors, onChange, onFieldBlur, value }: UrinalysisFormProps) {
  // Khi bỏ chọn một option, lưu undefined để trạng thái chưa nhập không bị gửi như chuỗi rỗng.
  function set<K extends keyof UrinalysisResult>(key: K, next: UrinalysisResult[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Que thử 10 thông số
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Màu sắc" onChange={(v) => set('mauSac', v)} value={getFieldValue(value.mauSac)} />
        <SelectField
          label="Độ trong"
          onChange={(v) => set('doTrong', v as UrinalysisResult['doTrong'])}
          options={DO_TRONG_OPTIONS}
          value={getFieldValue(value.doTrong)}
        />
        <NumericField
          error={errors.ph}
          hint="0–14"
          label="pH"
          onBlur={() => onFieldBlur('ph')}
          onChange={(v) => set('ph', v)}
          value={getFieldValue(value.ph)}
        />
        <NumericField
          error={errors.tyTrong}
          hint="1.000–1.060"
          label="Tỉ trọng"
          onBlur={() => onFieldBlur('tyTrong')}
          onChange={(v) => set('tyTrong', v)}
          value={getFieldValue(value.tyTrong)}
        />
        <SelectField
          label="Glucose"
          onChange={(v) => set('glucose', v as UrinalysisResult['glucose'])}
          options={SEMI_QUANT_4}
          value={getFieldValue(value.glucose)}
        />
        <SelectField
          label="Protein"
          onChange={(v) => set('protein', v as UrinalysisResult['protein'])}
          options={SEMI_QUANT_4}
          value={getFieldValue(value.protein)}
        />
        <SelectField
          label="Thể ceton"
          onChange={(v) => set('ketone', v as UrinalysisResult['ketone'])}
          options={SEMI_QUANT_4}
          value={getFieldValue(value.ketone)}
        />
        <SelectField
          label="Bilirubin"
          onChange={(v) => set('bilirubin', v as UrinalysisResult['bilirubin'])}
          options={BILIRUBIN_OPTIONS}
          value={getFieldValue(value.bilirubin)}
        />
        <SelectField
          label="Urobilinogen"
          onChange={(v) => set('urobilinogen', v as UrinalysisResult['urobilinogen'])}
          options={UROBILINOGEN_OPTIONS}
          value={getFieldValue(value.urobilinogen)}
        />
        <SelectField
          label="Máu (Blood)"
          onChange={(v) => set('blood', v as UrinalysisResult['blood'])}
          options={SEMI_QUANT_3}
          value={getFieldValue(value.blood)}
        />
        <SelectField
          label="Bạch cầu (Leukocyte)"
          onChange={(v) => set('leukocyte', v as UrinalysisResult['leukocyte'])}
          options={SEMI_QUANT_3}
          value={getFieldValue(value.leukocyte)}
        />
        <SelectField
          label="Nitrit"
          onChange={(v) => set('nitrite', v as UrinalysisResult['nitrite'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.nitrite)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Soi cặn vi thể
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          label="Hồng cầu (vi trường)"
          onChange={(v) => set('hongCauViTruong', v)}
          value={getFieldValue(value.hongCauViTruong)}
        />
        <TextField
          label="Bạch cầu (vi trường)"
          onChange={(v) => set('bachCauViTruong', v)}
          value={getFieldValue(value.bachCauViTruong)}
        />
        <TextField
          label="Tế bào biểu mô"
          onChange={(v) => set('teBaoBieuMo', v)}
          value={getFieldValue(value.teBaoBieuMo)}
        />
        <TextField
          label="Vi khuẩn"
          onChange={(v) => set('viKhuan', v)}
          value={getFieldValue(value.viKhuan)}
        />
        <TextField label="Trụ niệu" onChange={(v) => set('truNi', v)} value={getFieldValue(value.truNi)} />
        <TextField
          label="Tinh thể"
          onChange={(v) => set('tinhThe', v)}
          value={getFieldValue(value.tinhThe)}
        />
        <SelectField
          label="Dưỡng chấp"
          onChange={(v) => set('duongChat', v as UrinalysisResult['duongChat'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.duongChat)}
        />
        <SelectField
          label="Porphyrin"
          onChange={(v) => set('porphyrin', v as UrinalysisResult['porphyrin'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.porphyrin)}
        />
        <SelectField
          label="Protein Bence-Jones"
          onChange={(v) => set('proteinBenceJones', v as UrinalysisResult['proteinBenceJones'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.proteinBenceJones)}
        />
      </div>
      <div className="mb-5">
        <TextAreaField
          label="Mô tả cặn lắng"
          onChange={(v) => set('moTaCanLang', v)}
          value={getFieldValue(value.moTaCanLang)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Nước tiểu 24 giờ
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField
          error={errors.nt24TheTich}
          label="Tổng thể tích"
          onBlur={() => onFieldBlur('nt24TheTich')}
          onChange={(v) => set('nt24TheTich', v)}
          unit="L"
          value={getFieldValue(value.nt24TheTich)}
        />
        <NumericField
          error={errors.nt24Protein}
          label="Protein"
          onBlur={() => onFieldBlur('nt24Protein')}
          onChange={(v) => set('nt24Protein', v)}
          unit="g/d"
          value={getFieldValue(value.nt24Protein)}
        />
        <NumericField
          error={errors.nt24Glucose}
          label="Glucose"
          onBlur={() => onFieldBlur('nt24Glucose')}
          onChange={(v) => set('nt24Glucose', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24Glucose)}
        />
        <NumericField
          error={errors.nt24Ure}
          label="Urê"
          onBlur={() => onFieldBlur('nt24Ure')}
          onChange={(v) => set('nt24Ure', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24Ure)}
        />
        <NumericField
          error={errors.nt24Creatinin}
          label="Creatinin"
          onBlur={() => onFieldBlur('nt24Creatinin')}
          onChange={(v) => set('nt24Creatinin', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24Creatinin)}
        />
        <NumericField
          error={errors.nt24AcidUric}
          label="Acid uric"
          onBlur={() => onFieldBlur('nt24AcidUric')}
          onChange={(v) => set('nt24AcidUric', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24AcidUric)}
        />
        <NumericField
          error={errors.nt24Amylase}
          label="Amylase"
          onBlur={() => onFieldBlur('nt24Amylase')}
          onChange={(v) => set('nt24Amylase', v)}
          unit="U/d"
          value={getFieldValue(value.nt24Amylase)}
        />
        <NumericField
          error={errors.nt24Na}
          label="Na+"
          onBlur={() => onFieldBlur('nt24Na')}
          onChange={(v) => set('nt24Na', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24Na)}
        />
        <NumericField
          error={errors.nt24K}
          label="K+"
          onBlur={() => onFieldBlur('nt24K')}
          onChange={(v) => set('nt24K', v)}
          unit="mmol/d"
          value={getFieldValue(value.nt24K)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Phân</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Huyết sắc tố"
          onChange={(v) => set('phanHuyetSacTo', v as UrinalysisResult['phanHuyetSacTo'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.phanHuyetSacTo)}
        />
        <SelectField
          label="Stercobilin"
          onChange={(v) => set('phanStercobilin', v as UrinalysisResult['phanStercobilin'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.phanStercobilin)}
        />
        <SelectField
          label="Stercobilinogen"
          onChange={(v) => set('phanStercobilinogen', v as UrinalysisResult['phanStercobilinogen'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.phanStercobilinogen)}
        />
        <SelectField
          label="Máu toàn phần"
          onChange={(v) => set('phanMauToanPhan', v as UrinalysisResult['phanMauToanPhan'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.phanMauToanPhan)}
        />
      </div>
      <div className="mb-5">
        <TextAreaField
          label="Ghi chú (phân)"
          onChange={(v) => set('phanGhiChu', v)}
          value={getFieldValue(value.phanGhiChu)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Dịch não tủy
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField
          error={errors.dntProtein}
          label="Protein"
          onBlur={() => onFieldBlur('dntProtein')}
          onChange={(v) => set('dntProtein', v)}
          unit="g/L"
          value={getFieldValue(value.dntProtein)}
        />
        <NumericField
          error={errors.dntGlucose}
          label="Glucose"
          onBlur={() => onFieldBlur('dntGlucose')}
          onChange={(v) => set('dntGlucose', v)}
          unit="mmol/L"
          value={getFieldValue(value.dntGlucose)}
        />
        <NumericField
          error={errors.dntClorua}
          label="Clorua"
          onBlur={() => onFieldBlur('dntClorua')}
          onChange={(v) => set('dntClorua', v)}
          unit="mmol/L"
          value={getFieldValue(value.dntClorua)}
        />
        <SelectField
          label="Phản ứng Pandy"
          onChange={(v) => set('dntPandy', v as UrinalysisResult['dntPandy'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.dntPandy)}
        />
      </div>
      <div className="mb-5">
        <TextAreaField
          label="Ghi chú (DNT)"
          onChange={(v) => set('dntGhiChu', v)}
          value={getFieldValue(value.dntGhiChu)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Dịch vị
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField
          error={errors.dichViHClTuDo}
          label="HCl tự do"
          onBlur={() => onFieldBlur('dichViHClTuDo')}
          onChange={(v) => set('dichViHClTuDo', v)}
          unit="mmol/L"
          value={getFieldValue(value.dichViHClTuDo)}
        />
        <NumericField
          error={errors.dichViHClToanPhan}
          label="HCl toàn phần"
          onBlur={() => onFieldBlur('dichViHClToanPhan')}
          onChange={(v) => set('dichViHClToanPhan', v)}
          unit="mmol/L"
          value={getFieldValue(value.dichViHClToanPhan)}
        />
      </div>
      <div className="mb-5">
        <TextAreaField
          label="Ghi chú (dịch vị)"
          onChange={(v) => set('dichViGhiChu', v)}
          value={getFieldValue(value.dichViGhiChu)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Dịch chọc dò khác
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Phản ứng Rivalta"
          onChange={(v) => set('dcdRivalta', v as UrinalysisResult['dcdRivalta'])}
          options={AM_DUONG_OPTIONS}
          value={getFieldValue(value.dcdRivalta)}
        />
        <NumericField
          error={errors.dcdProtein}
          label="Protein"
          onBlur={() => onFieldBlur('dcdProtein')}
          onChange={(v) => set('dcdProtein', v)}
          unit="g/L"
          value={getFieldValue(value.dcdProtein)}
        />
      </div>
      <TextAreaField
        label="Ghi chú (dịch chọc dò)"
        onChange={(v) => set('dcdGhiChu', v)}
        value={getFieldValue(value.dcdGhiChu)}
      />
    </div>
  );
}
