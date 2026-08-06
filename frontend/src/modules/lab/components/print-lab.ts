import type { LabTestDetail, LabTestQueueItem, ResultTableKey } from '../types/lab-test.types';
import { calculateAge } from './SharedComponents';
import { LAB_PRINT_STYLES, LAB_PRINT_TEMPLATES } from './lab-print-templates';
import type { StructuredResultEntry } from './format-structured-result';

type PrintValue = string | number | boolean | null | undefined;
type PrintData = Record<string, PrintValue>;

const PRINT_VALUE_LABELS: Record<string, string> = {
  am_tinh: 'Âm tính',
  vet: 'Vết',
  cong: '1+',
  v_2_cong: '2+',
  v_3_cong: '3+',
  v_4_cong: '4+',
  duong_tinh: 'Dương tính',
  binh_thuong: 'Bình thường',
  trong: 'Trong',
  hoi_duc: 'Hơi đục',
  duc: 'Đục',
  punch: 'Punch',
  shave: 'Shave',
  excision: 'Excision',
  incision: 'Incision',
  khac: 'Khác',
  phu_hop: 'Phù hợp',
  khong_phu_hop: 'Không phù hợp',
  khong_du_thong_tin: 'Không đủ thông tin',
  cho_ket_qua: 'Chờ kết quả (nháp)',
  da_co_ket_qua: 'Đã có kết quả (hoàn tất)',
  S: 'S',
  I: 'I',
  R: 'R',
};

/** Escape dữ liệu từ API trước khi chèn vào HTML in, tránh XSS từ dữ liệu bệnh nhân/kết quả. */
export function escapePrintHtml(value: PrintValue): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function documentShell(title: string, content: string): string {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapePrintHtml(title)}</title><style>${LAB_PRINT_STYLES}</style></head><body>${content}</body></html>`;
}

function hasValue(data: PrintData, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function formatPrintValue(value: PrintValue): string {
  if (typeof value === 'boolean') return value ? '✓' : '';
  if (value === null || value === undefined) return '';
  return PRINT_VALUE_LABELS[String(value)] ?? String(value);
}

/**
 * Điền dữ liệu vào đúng các nút đánh dấu `data-xn` của mẫu gốc.
 * Chỉ thay giá trị động; toàn bộ nhãn, bảng, đường kẻ và nội dung cố định của mẫu được giữ nguyên.
 */
export function renderLabPrintTemplate(template: string, data: PrintData): string {
  const withSelectValues = template.replace(
    /<select\b([^>]*\bdata-xn="([^"]+)"[^>]*)>[\s\S]*?<\/select>/gi,
    (match, attributes: string, key: string) => {
      void match;
      const classAttributes = attributes.replace(
        /class="([^"]*)"/i,
        (classMatch: string, classes: string) => {
          void classMatch;
          return `class="${classes} print-value"`;
        },
      );
      const value = hasValue(data, key) ? formatPrintValue(data[key]) : '';
      return `<span${classAttributes}>${escapePrintHtml(value)}</span>`;
    },
  );

  return withSelectValues.replace(
    /<([a-z][a-z0-9-]*)([^>]*\bdata-xn="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tagName: string, attributes: string, key: string, originalContent: string) => {
      if (!hasValue(data, key)) return match;

      if (/\bchk-box\b/i.test(attributes)) {
        const updatedAttributes = data[key]
          ? attributes.replace(
              /class="([^"]*)"/i,
              (classMatch: string, classes: string) => {
                void classMatch;
                return `class="${classes} checked"`;
              },
            )
          : attributes;
        return `<${tagName}${updatedAttributes}>${originalContent}</${tagName}>`;
      }

      return `<${tagName}${attributes}>${escapePrintHtml(formatPrintValue(data[key]))}</${tagName}>`;
    },
  );
}

function getTemplate(resultTableKey: ResultTableKey): string {
  return LAB_PRINT_TEMPLATES[resultTableKey];
}

function createBasePrintData(source: LabTestQueueItem | LabTestDetail): PrintData {
  const patient = source.patient;
  const reportCode = source.reportCode ?? source.labTestId.slice(0, 8).toUpperCase();
  const healthInsuranceCode = 'healthInsuranceCode' in patient ? patient.healthInsuranceCode : null;
  const diagnosis = 'diagnosis' in source ? source.diagnosis : null;

  return {
    soyte: '',
    benhvien: '',
    soPhieu: reportCode,
    'chk-thuong': !source.isUrgent,
    'chk-capcuu': source.isUrgent,
    hoten: patient.fullName,
    tuoi: calculateAge(patient.dateOfBirth),
    'chk-nam': patient.gender === 'male',
    'chk-nu': patient.gender === 'female',
    diachi: '',
    bhyt: healthInsuranceCode,
    khoa: source.department?.name,
    buong: '',
    giuong: '',
    mauBenhPham: source.specimenType,
    chandoan: diagnosis
      ? `${diagnosis.icd10}${diagnosis.diagnosisText ? ` - ${diagnosis.diagnosisText}` : ''}`
      : '',
    bsDieuTri: source.orderingDoctor.fullName,
    bsDieuTriKq: source.orderingDoctor.fullName,
    bsChuyenKhoa: '',
    bsTruongKhoaXn: '',
    truongKhoaXn: '',
    trangThai: 'status' in source && source.status === 'resulted' ? 'da_co_ket_qua' : 'cho_ket_qua',
  };
}

function createResultPrintData(detail: LabTestDetail): PrintData {
  const result = detail.structuredResult as Record<string, PrintValue> | null;
  const data = createBasePrintData(detail);

  if (!result) return data;

  Object.entries(result).forEach(([key, value]) => {
    if (!['id', 'labTestId', 'createdAt', 'updatedAt'].includes(key)) data[key] = value;
  });

  return data;
}

/** Tạo phiếu in chỉ định theo đúng mẫu giấy của loại xét nghiệm được chỉ định. */
export function createLabOrderPrintHtml(item: LabTestQueueItem): string {
  return documentShell(
    'Phiếu xét nghiệm',
    renderLabPrintTemplate(getTemplate(item.resultTableKey), createBasePrintData(item)),
  );
}

/**
 * Tạo phiếu in kết quả theo đúng mẫu chuyên môn.
 * `entries` vẫn được nhận để giữ tương thích với màn hình hiện tại; dữ liệu nguồn chính là structuredResult.
 */
export function createLabResultPrintHtml(
  detail: LabTestDetail,
  entries: StructuredResultEntry[],
): string {
  void entries;
  return documentShell(
    'Phiếu kết quả xét nghiệm',
    renderLabPrintTemplate(getTemplate(detail.resultTableKey), createResultPrintData(detail)),
  );
}

/** Mở cửa sổ tài liệu riêng để trình duyệt chỉ in đúng phiếu xét nghiệm. */
export function printLabDocument(html: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
