import type { UrinalysisResult } from '../../types/lab-test.types';
import { NumericField, SelectField, TextAreaField, TextField } from '../shared';

interface UrinalysisFormProps {
  onChange: (value: UrinalysisResult) => void;
  value: UrinalysisResult;
}

function field(value: string | null | undefined): string {
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

export function UrinalysisForm({ onChange, value }: UrinalysisFormProps) {
  function set<K extends keyof UrinalysisResult>(key: K, next: UrinalysisResult[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Que thử 10 thông số</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Màu sắc" onChange={(v) => set('mauSac', v)} value={field(value.mauSac)} />
        <SelectField label="Độ trong" onChange={(v) => set('doTrong', v as UrinalysisResult['doTrong'])} options={DO_TRONG_OPTIONS} value={field(value.doTrong)} />
        <NumericField hint="0–14" label="pH" onChange={(v) => set('ph', v)} value={field(value.ph)} />
        <NumericField hint="1.000–1.060" label="Tỉ trọng" onChange={(v) => set('tyTrong', v)} value={field(value.tyTrong)} />
        <SelectField label="Glucose" onChange={(v) => set('glucose', v as UrinalysisResult['glucose'])} options={SEMI_QUANT_4} value={field(value.glucose)} />
        <SelectField label="Protein" onChange={(v) => set('protein', v as UrinalysisResult['protein'])} options={SEMI_QUANT_4} value={field(value.protein)} />
        <SelectField label="Thể ceton" onChange={(v) => set('ketone', v as UrinalysisResult['ketone'])} options={SEMI_QUANT_4} value={field(value.ketone)} />
        <SelectField label="Bilirubin" onChange={(v) => set('bilirubin', v as UrinalysisResult['bilirubin'])} options={BILIRUBIN_OPTIONS} value={field(value.bilirubin)} />
        <SelectField label="Urobilinogen" onChange={(v) => set('urobilinogen', v as UrinalysisResult['urobilinogen'])} options={UROBILINOGEN_OPTIONS} value={field(value.urobilinogen)} />
        <SelectField label="Máu (Blood)" onChange={(v) => set('blood', v as UrinalysisResult['blood'])} options={SEMI_QUANT_3} value={field(value.blood)} />
        <SelectField label="Bạch cầu (Leukocyte)" onChange={(v) => set('leukocyte', v as UrinalysisResult['leukocyte'])} options={SEMI_QUANT_3} value={field(value.leukocyte)} />
        <SelectField label="Nitrit" onChange={(v) => set('nitrite', v as UrinalysisResult['nitrite'])} options={AM_DUONG_OPTIONS} value={field(value.nitrite)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Soi cặn vi thể</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Hồng cầu (vi trường)" onChange={(v) => set('hongCauViTruong', v)} value={field(value.hongCauViTruong)} />
        <TextField label="Bạch cầu (vi trường)" onChange={(v) => set('bachCauViTruong', v)} value={field(value.bachCauViTruong)} />
        <TextField label="Tế bào biểu mô" onChange={(v) => set('teBaoBieuMo', v)} value={field(value.teBaoBieuMo)} />
        <TextField label="Vi khuẩn" onChange={(v) => set('viKhuan', v)} value={field(value.viKhuan)} />
        <TextField label="Trụ niệu" onChange={(v) => set('truNi', v)} value={field(value.truNi)} />
        <TextField label="Tinh thể" onChange={(v) => set('tinhThe', v)} value={field(value.tinhThe)} />
        <SelectField label="Dưỡng chấp" onChange={(v) => set('duongChat', v as UrinalysisResult['duongChat'])} options={AM_DUONG_OPTIONS} value={field(value.duongChat)} />
        <SelectField label="Porphyrin" onChange={(v) => set('porphyrin', v as UrinalysisResult['porphyrin'])} options={AM_DUONG_OPTIONS} value={field(value.porphyrin)} />
        <SelectField label="Protein Bence-Jones" onChange={(v) => set('proteinBenceJones', v as UrinalysisResult['proteinBenceJones'])} options={AM_DUONG_OPTIONS} value={field(value.proteinBenceJones)} />
      </div>
      <div className="mb-5">
        <TextAreaField label="Mô tả cặn lắng" onChange={(v) => set('moTaCanLang', v)} value={field(value.moTaCanLang)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Nước tiểu 24 giờ</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField label="Tổng thể tích" onChange={(v) => set('nt24TheTich', v)} unit="L" value={field(value.nt24TheTich)} />
        <NumericField label="Protein" onChange={(v) => set('nt24Protein', v)} unit="g/d" value={field(value.nt24Protein)} />
        <NumericField label="Glucose" onChange={(v) => set('nt24Glucose', v)} unit="mmol/d" value={field(value.nt24Glucose)} />
        <NumericField label="Urê" onChange={(v) => set('nt24Ure', v)} unit="mmol/d" value={field(value.nt24Ure)} />
        <NumericField label="Creatinin" onChange={(v) => set('nt24Creatinin', v)} unit="mmol/d" value={field(value.nt24Creatinin)} />
        <NumericField label="Acid uric" onChange={(v) => set('nt24AcidUric', v)} unit="mmol/d" value={field(value.nt24AcidUric)} />
        <NumericField label="Amylase" onChange={(v) => set('nt24Amylase', v)} unit="U/d" value={field(value.nt24Amylase)} />
        <NumericField label="Na+" onChange={(v) => set('nt24Na', v)} unit="mmol/d" value={field(value.nt24Na)} />
        <NumericField label="K+" onChange={(v) => set('nt24K', v)} unit="mmol/d" value={field(value.nt24K)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Phân</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Huyết sắc tố" onChange={(v) => set('phanHuyetSacTo', v as UrinalysisResult['phanHuyetSacTo'])} options={AM_DUONG_OPTIONS} value={field(value.phanHuyetSacTo)} />
        <SelectField label="Stercobilin" onChange={(v) => set('phanStercobilin', v as UrinalysisResult['phanStercobilin'])} options={AM_DUONG_OPTIONS} value={field(value.phanStercobilin)} />
        <SelectField label="Stercobilinogen" onChange={(v) => set('phanStercobilinogen', v as UrinalysisResult['phanStercobilinogen'])} options={AM_DUONG_OPTIONS} value={field(value.phanStercobilinogen)} />
        <SelectField label="Máu toàn phần" onChange={(v) => set('phanMauToanPhan', v as UrinalysisResult['phanMauToanPhan'])} options={AM_DUONG_OPTIONS} value={field(value.phanMauToanPhan)} />
      </div>
      <div className="mb-5">
        <TextAreaField label="Ghi chú (phân)" onChange={(v) => set('phanGhiChu', v)} value={field(value.phanGhiChu)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Dịch não tủy</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField label="Protein" onChange={(v) => set('dntProtein', v)} unit="g/L" value={field(value.dntProtein)} />
        <NumericField label="Glucose" onChange={(v) => set('dntGlucose', v)} unit="mmol/L" value={field(value.dntGlucose)} />
        <NumericField label="Clorua" onChange={(v) => set('dntClorua', v)} unit="mmol/L" value={field(value.dntClorua)} />
        <SelectField label="Phản ứng Pandy" onChange={(v) => set('dntPandy', v as UrinalysisResult['dntPandy'])} options={AM_DUONG_OPTIONS} value={field(value.dntPandy)} />
      </div>
      <div className="mb-5">
        <TextAreaField label="Ghi chú (DNT)" onChange={(v) => set('dntGhiChu', v)} value={field(value.dntGhiChu)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Dịch vị</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumericField label="HCl tự do" onChange={(v) => set('dichViHClTuDo', v)} unit="mmol/L" value={field(value.dichViHClTuDo)} />
        <NumericField label="HCl toàn phần" onChange={(v) => set('dichViHClToanPhan', v)} unit="mmol/L" value={field(value.dichViHClToanPhan)} />
      </div>
      <div className="mb-5">
        <TextAreaField label="Ghi chú (dịch vị)" onChange={(v) => set('dichViGhiChu', v)} value={field(value.dichViGhiChu)} />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">Dịch chọc dò khác</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Phản ứng Rivalta" onChange={(v) => set('dcdRivalta', v as UrinalysisResult['dcdRivalta'])} options={AM_DUONG_OPTIONS} value={field(value.dcdRivalta)} />
        <NumericField label="Protein" onChange={(v) => set('dcdProtein', v)} unit="g/L" value={field(value.dcdProtein)} />
      </div>
      <TextAreaField label="Ghi chú (dịch chọc dò)" onChange={(v) => set('dcdGhiChu', v)} value={field(value.dcdGhiChu)} />
    </div>
  );
}
