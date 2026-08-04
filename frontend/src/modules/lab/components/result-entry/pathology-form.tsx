import type { PathologyResult } from '../../types/lab-test.types';
import { NumericField, SelectField, TextAreaField, TextField } from '../shared';

interface PathologyFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: PathologyResult) => void;
  value: PathologyResult;
}

function field(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

const BIOPSY_METHOD_OPTIONS = [
  { value: 'punch', label: 'Punch' },
  { value: 'shave', label: 'Shave' },
  { value: 'excision', label: 'Excision' },
  { value: 'incision', label: 'Incision' },
  { value: 'khac', label: 'Khác' },
];

const CONCORDANCE_OPTIONS = [
  { value: 'phu_hop', label: 'Phù hợp' },
  { value: 'khong_phu_hop', label: 'Không phù hợp' },
  { value: 'khong_du_thong_tin', label: 'Không đủ thông tin' },
];

export function PathologyForm({ errors, onChange, onFieldBlur, value }: PathologyFormProps) {
  function set<K extends keyof PathologyResult>(key: K, next: PathologyResult[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  const isFinal = value.trangThai === 'da_co_ket_qua';

  return (
    <div>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Thông tin sinh thiết
      </p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Phương pháp sinh thiết"
          onChange={(v) => set('phuongPhapSinhThiet', v as PathologyResult['phuongPhapSinhThiet'])}
          options={BIOPSY_METHOD_OPTIONS}
          value={field(value.phuongPhapSinhThiet)}
        />
        <TextField
          label="Vị trí sinh thiết"
          onChange={(v) => set('viTriSinhThiet', v)}
          value={field(value.viTriSinhThiet)}
        />
        <NumericField
          error={errors.soManh}
          label="Số mảnh"
          onBlur={() => onFieldBlur('soManh')}
          onChange={(v) => set('soManh', v ? Number(v) : undefined)}
          value={field(value.soManh)}
        />
        <TextField
          label="Dung dịch cố định"
          onChange={(v) => set('dungDichCoDinh', v)}
          value={field(value.dungDichCoDinh)}
        />
        <TextField
          error={errors.nguoiPhaBenhPham}
          label="Người pha bệnh phẩm"
          onBlur={() => onFieldBlur('nguoiPhaBenhPham')}
          onChange={(v) => set('nguoiPhaBenhPham', v)}
          value={field(value.nguoiPhaBenhPham)}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">Ngày pha</span>
          <input
            className="h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) =>
              set(
                'ngayPha',
                event.target.value ? new Date(event.target.value).toISOString() : undefined,
              )
            }
            type="date"
            value={value.ngayPha ? value.ngayPha.slice(0, 10) : ''}
          />
        </label>
        <TextField
          label="Phương pháp nhuộm"
          onChange={(v) => set('phuongPhapNhuomHE', v)}
          value={field(value.phuongPhapNhuomHE || 'HE')}
        />
        <TextField
          error={errors.nguoiLamTieuBan}
          label="Người làm tiêu bản"
          onBlur={() => onFieldBlur('nguoiLamTieuBan')}
          onChange={(v) => set('nguoiLamTieuBan', v)}
          value={field(value.nguoiLamTieuBan)}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">
            Ngày làm tiêu bản
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) =>
              set(
                'ngayLamTieuBan',
                event.target.value ? new Date(event.target.value).toISOString() : undefined,
              )
            }
            type="date"
            value={value.ngayLamTieuBan ? value.ngayLamTieuBan.slice(0, 10) : ''}
          />
        </label>
        <TextField
          label="Nhuộm đặc biệt / IHC"
          onChange={(v) => set('nhuomDacBiet', v)}
          value={field(value.nhuomDacBiet)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Thông tin từ bác sĩ điều trị
      </p>
      <div className="mb-5 grid gap-4">
        <TextField
          label="Chẩn đoán lâm sàng"
          onChange={(v) => set('chanDoanLamSang', v)}
          value={field(value.chanDoanLamSang)}
        />
        <TextAreaField
          label="Tóm tắt dấu hiệu lâm sàng"
          onChange={(v) => set('tomTatLamSang', v)}
          value={field(value.tomTatLamSang)}
        />
        <TextAreaField
          label="Quá trình điều trị"
          onChange={(v) => set('quaTrinhDieuTri', v)}
          value={field(value.quaTrinhDieuTri)}
        />
        <TextAreaField
          label="Nhận xét đại thể khi lấy sinh thiết"
          onChange={(v) => set('nhanXetDaiTheLayMau', v)}
          value={field(value.nhanXetDaiTheLayMau)}
        />
        <TextAreaField
          label="Kết quả sinh thiết lần trước"
          onChange={(v) => set('ketQuaSinhThietLanTruoc', v)}
          value={field(value.ketQuaSinhThietLanTruoc)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Kết quả xét nghiệm (phòng lab)
      </p>
      <div className="mb-5 grid gap-4">
        <TextAreaField
          label="Nhận xét đại thể"
          onChange={(v) => set('daiThe', v)}
          value={field(value.daiThe)}
        />
        <TextAreaField
          label="Nhận xét vi thể"
          onChange={(v) => set('viThe', v)}
          value={field(value.viThe)}
        />
      </div>

      <div className="mb-2 rounded-md border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 text-[13px] text-[#0369a1]">
        {isFinal
          ? 'Chế độ hoàn tất — cần đủ Chẩn đoán giải phẫu bệnh, Bác sĩ đọc kết quả và Ngày trả kết quả trước khi ký.'
          : 'Đang ở chế độ lưu nháp — có thể lưu nhiều lần trước khi hoàn tất chính thức.'}
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Chẩn đoán giải phẫu bệnh
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          error={errors.chanDoanMoHoc}
          label="Chẩn đoán giải phẫu bệnh *"
          onBlur={() => onFieldBlur('chanDoanMoHoc')}
          onChange={(v) => set('chanDoanMoHoc', v)}
          value={field(value.chanDoanMoHoc)}
        />
        <TextField
          error={errors.icd10MoHoc}
          label="Mã ICD-10 (VD L23.9)"
          onBlur={() => onFieldBlur('icd10MoHoc')}
          onChange={(v) => set('icd10MoHoc', v)}
          value={field(value.icd10MoHoc)}
        />
        <SelectField
          label="Sự phù hợp với chẩn đoán lâm sàng"
          onChange={(v) =>
            set('phuHopChanDoanLamSang', v as PathologyResult['phuHopChanDoanLamSang'])
          }
          options={CONCORDANCE_OPTIONS}
          value={field(value.phuHopChanDoanLamSang)}
        />
        <TextField
          error={errors.bacSiGiaiPhauBenh}
          label="Mã bác sĩ đọc kết quả (userId) *"
          onBlur={() => onFieldBlur('bacSiGiaiPhauBenh')}
          onChange={(v) => set('bacSiGiaiPhauBenh', v)}
          value={field(value.bacSiGiaiPhauBenh)}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">
            Ngày trả kết quả *
          </span>
          <input
            aria-describedby={errors.ngayTraKetQua ? 'ngayTraKetQua-error' : undefined}
            aria-invalid={Boolean(errors.ngayTraKetQua)}
            className="h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) =>
              set(
                'ngayTraKetQua',
                event.target.value ? new Date(event.target.value).toISOString() : undefined,
              )
            }
            onBlur={() => onFieldBlur('ngayTraKetQua')}
            type="date"
            value={value.ngayTraKetQua ? value.ngayTraKetQua.slice(0, 10) : ''}
          />
          {errors.ngayTraKetQua && (
            <p
              className="mt-1 text-[11px] font-medium leading-4 text-[#ba1a1a]"
              id="ngayTraKetQua-error"
              role="alert"
            >
              {errors.ngayTraKetQua}
            </p>
          )}
        </label>
      </div>
    </div>
  );
}
