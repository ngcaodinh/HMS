import type { PathologyResult } from '../../types/lab-test.types';
import { NumericField, SelectField, TextAreaField, TextField } from '../SharedComponents';

interface PathologyFormProps {
  errors: Record<string, string>;
  onFieldBlur: (field: string) => void;
  onChange: (value: PathologyResult) => void;
  value: PathologyResult;
}

// Chuyển giá trị null, undefined hoặc NaN về chuỗi rỗng để input hiển thị ổn định.
function getFieldValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))
    ? ''
    : String(value);
}

const BIOPSY_METHOD_OPTIONS = [
  { value: 'punch', label: 'Punch' },
  { value: 'shave', label: 'Shave' },
  { value: 'excision', label: 'Excision' },
  { value: 'incision', label: 'Incision' },
  { value: 'khac', label: 'Khác' },
];

/** Các trạng thái đối chiếu giữa chẩn đoán giải phẫu bệnh và chẩn đoán lâm sàng. */
const CONCORDANCE_OPTIONS = [
  { value: 'phu_hop', label: 'Phù hợp' },
  { value: 'khong_phu_hop', label: 'Không phù hợp' },
  { value: 'khong_du_thong_tin', label: 'Không đủ thông tin' },
];

/**
 * Nhập hồ sơ giải phẫu bệnh từ tiếp nhận bệnh phẩm đến chẩn đoán và trả kết quả.
 *
 * @param errors - Lỗi theo field do panel cung cấp; lỗi bắt buộc khi hoàn tất được hiển thị inline.
 * @param onFieldBlur - Callback ghi nhận field đã chạm để kiểm soát thời điểm hiển thị lỗi.
 * @param onChange - Callback nhận toàn bộ draft pathology; lưu nháp và ký do panel thực hiện.
 * @param value - Draft có `trangThai` `cho_ket_qua` hoặc `da_co_ket_qua`.
 * @remarks Khi ở trạng thái hoàn tất, validator yêu cầu chẩn đoán mô học, bác sĩ đọc kết quả và
 * ngày trả kết quả; trạng thái nháp cho phép lưu nhiều lần. Input ngày hiển thị `YYYY-MM-DD` nhưng
 * lưu chuỗi ISO. Component không tự tải/lưu dữ liệu, không render access gate và không có trạng
 * thái loading/forbidden/success riêng.
 */
export function PathologyForm({ errors, onChange, onFieldBlur, value }: PathologyFormProps) {
  function set<K extends keyof PathologyResult>(key: K, next: PathologyResult[K]) {
    // Giữ số 0/NaN để validator phản hồi ngay; chỉ chuẩn hóa chuỗi rỗng thành undefined.
    const normalized = typeof next === 'string' ? next.trim() || undefined : (next ?? undefined);
    onChange({ ...value, [key]: normalized });
  }

  // Nhánh hiển thị này phản ánh trạng thái workflow; panel mới quyết định lưu nháp hay ký kết quả.
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
          value={getFieldValue(value.phuongPhapSinhThiet)}
        />
        <TextField
          label="Vị trí sinh thiết"
          onChange={(v) => set('viTriSinhThiet', v)}
          value={getFieldValue(value.viTriSinhThiet)}
        />
        <NumericField
          error={errors.soManh}
          label="Số mảnh"
          onBlur={() => onFieldBlur('soManh')}
          onChange={(v) => set('soManh', v ? Number(v) : undefined)}
          value={getFieldValue(value.soManh)}
        />
        <TextField
          label="Dung dịch cố định"
          onChange={(v) => set('dungDichCoDinh', v)}
          value={getFieldValue(value.dungDichCoDinh)}
        />
        <TextField
          error={errors.nguoiPhaBenhPham}
          label="Người pha bệnh phẩm"
          onBlur={() => onFieldBlur('nguoiPhaBenhPham')}
          onChange={(v) => set('nguoiPhaBenhPham', v)}
          value={getFieldValue(value.nguoiPhaBenhPham)}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">Ngày pha</span>
          <input
            aria-describedby={errors.ngayPha ? 'ngayPha-error' : undefined}
            aria-invalid={Boolean(errors.ngayPha)}
            className="h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) =>
              set(
                'ngayPha',
                event.target.value ? new Date(event.target.value).toISOString() : undefined,
              )
            }
            onBlur={() => onFieldBlur('ngayPha')}
            type="date"
            value={value.ngayPha ? value.ngayPha.slice(0, 10) : ''}
          />
          {errors.ngayPha && (
            <p
              className="mt-1 text-[11px] font-medium text-[#ba1a1a]"
              id="ngayPha-error"
              role="alert"
            >
              {errors.ngayPha}
            </p>
          )}
        </label>
        <TextField
          label="Phương pháp nhuộm"
          onChange={(v) => set('phuongPhapNhuomHE', v)}
          value={getFieldValue(value.phuongPhapNhuomHE || 'HE')}
        />
        <TextField
          error={errors.nguoiLamTieuBan}
          label="Người làm tiêu bản"
          onBlur={() => onFieldBlur('nguoiLamTieuBan')}
          onChange={(v) => set('nguoiLamTieuBan', v)}
          value={getFieldValue(value.nguoiLamTieuBan)}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">
            Ngày làm tiêu bản
          </span>
          <input
            aria-describedby={errors.ngayLamTieuBan ? 'ngayLamTieuBan-error' : undefined}
            aria-invalid={Boolean(errors.ngayLamTieuBan)}
            className="h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) =>
              set(
                'ngayLamTieuBan',
                event.target.value ? new Date(event.target.value).toISOString() : undefined,
              )
            }
            onBlur={() => onFieldBlur('ngayLamTieuBan')}
            type="date"
            value={value.ngayLamTieuBan ? value.ngayLamTieuBan.slice(0, 10) : ''}
          />
          {errors.ngayLamTieuBan && (
            <p
              className="mt-1 text-[11px] font-medium text-[#ba1a1a]"
              id="ngayLamTieuBan-error"
              role="alert"
            >
              {errors.ngayLamTieuBan}
            </p>
          )}
        </label>
        <TextField
          label="Nhuộm đặc biệt / IHC"
          onChange={(v) => set('nhuomDacBiet', v)}
          value={getFieldValue(value.nhuomDacBiet)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Thông tin từ bác sĩ điều trị
      </p>
      <div className="mb-5 grid gap-4">
        <TextField
          label="Chẩn đoán lâm sàng"
          onChange={(v) => set('chanDoanLamSang', v)}
          value={getFieldValue(value.chanDoanLamSang)}
        />
        <TextAreaField
          label="Tóm tắt dấu hiệu lâm sàng"
          onChange={(v) => set('tomTatLamSang', v)}
          value={getFieldValue(value.tomTatLamSang)}
        />
        <TextAreaField
          label="Quá trình điều trị"
          onChange={(v) => set('quaTrinhDieuTri', v)}
          value={getFieldValue(value.quaTrinhDieuTri)}
        />
        <TextAreaField
          label="Nhận xét đại thể khi lấy sinh thiết"
          onChange={(v) => set('nhanXetDaiTheLayMau', v)}
          value={getFieldValue(value.nhanXetDaiTheLayMau)}
        />
        <TextAreaField
          label="Kết quả sinh thiết lần trước"
          onChange={(v) => set('ketQuaSinhThietLanTruoc', v)}
          value={getFieldValue(value.ketQuaSinhThietLanTruoc)}
        />
      </div>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871]">
        Kết quả xét nghiệm (phòng lab)
      </p>
      <div className="mb-5 grid gap-4">
        <TextAreaField
          label="Nhận xét đại thể"
          onChange={(v) => set('daiThe', v)}
          value={getFieldValue(value.daiThe)}
        />
        <TextAreaField
          label="Nhận xét vi thể"
          onChange={(v) => set('viThe', v)}
          value={getFieldValue(value.viThe)}
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
          value={getFieldValue(value.chanDoanMoHoc)}
        />
        <TextField
          error={errors.icd10MoHoc}
          label="Mã ICD-10 (VD L23.9)"
          onBlur={() => onFieldBlur('icd10MoHoc')}
          onChange={(v) => set('icd10MoHoc', v)}
          value={getFieldValue(value.icd10MoHoc)}
        />
        <SelectField
          label="Sự phù hợp với chẩn đoán lâm sàng"
          onChange={(v) =>
            set('phuHopChanDoanLamSang', v as PathologyResult['phuHopChanDoanLamSang'])
          }
          options={CONCORDANCE_OPTIONS}
          value={getFieldValue(value.phuHopChanDoanLamSang)}
        />
        <TextField
          error={errors.bacSiGiaiPhauBenh}
          label="Mã bác sĩ đọc kết quả (userId) *"
          onBlur={() => onFieldBlur('bacSiGiaiPhauBenh')}
          onChange={(v) => set('bacSiGiaiPhauBenh', v)}
          value={getFieldValue(value.bacSiGiaiPhauBenh)}
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
