import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createLabOrderPrintHtml,
  createLabResultPrintHtml,
  printLabDocument,
} from '../src/modules/lab/components/print-lab';
import type { LabTestDetail, LabTestQueueItem } from '../src/modules/lab/types/lab-test.types';

const queueItem: LabTestQueueItem = {
  createdAt: '2026-08-04T08:30:00.000Z',
  department: { name: 'Khoa Nội' },
  isUrgent: true,
  labTestId: 'lab-test-1',
  labTestTypeId: 'lab-type-1',
  orderingDoctor: { fullName: 'Nguyễn Văn A' },
  patient: {
    dateOfBirth: '1990-05-20',
    fullName: 'Trần Minh <Linh>',
    gender: 'female',
    patientCode: 'BN-0001',
    patientId: 'patient-1',
  },
  recordId: 'record-1',
  reportCode: 'XN-0001',
  resultTableKey: 'xn_cong_thuc_mau',
  specimenType: 'Máu toàn phần',
  status: 'ordered',
  testName: 'Công thức máu',
};

const detail: LabTestDetail = {
  ...queueItem,
  attachments: [],
  conclusion: 'Kết quả trong giới hạn tham chiếu.',
  diagnosis: { diagnosisText: 'Theo dõi', icd10: 'Z00.0' },
  method: 'Máy tự động',
  patient: { ...queueItem.patient, healthInsuranceCode: 'HS-123' },
  referenceRanges: [],
  resultedAt: '2026-08-04T09:00:00.000Z',
  resultedBy: 'Kỹ thuật viên B',
  signedAt: '2026-08-04T09:05:00.000Z',
  signedBy: 'Kỹ thuật viên B',
  status: 'resulted',
  structuredResult: { hgb: '110', wbc: '8.2' },
};

describe('lab print documents', () => {
  it('uses the CBC source layout for an order and escapes patient data', () => {
    const html = createLabOrderPrintHtml(queueItem);

    assert.match(html, /PHIẾU XÉT NGHIỆM HUYẾT HỌC/);
    assert.match(html, /Tổng phân tích tế bào máu ngoại vi/);
    assert.match(html, /Trần Minh &lt;Linh&gt;/);
    assert.match(html, /Máu toàn phần/);
    assert.match(html, /Cấp cứu/);
    assert.doesNotMatch(html, /PHIẾU CHỈ ĐỊNH XÉT NGHIỆM|Kết luận:|Khoảng tham chiếu/);
    assert.doesNotMatch(html, /<script/i);
  });

  it('binds only result values into the matching source form', () => {
    const html = createLabResultPrintHtml(detail, []);

    assert.match(html, /PHIẾU XÉT NGHIỆM HUYẾT HỌC/);
    assert.match(html, /HGB \(Huyết sắc tố\)[\s\S]*?110/);
    assert.match(html, /WBC \(Bạch cầu\)[\s\S]*?8\.2/);
    assert.doesNotMatch(html, /Kết luận:|Khoảng tham chiếu|Tệp đính kèm|Kỹ thuật viên xét nghiệm/);
  });

  it('selects the exact static form for every supported result type', () => {
    const cases: Array<[LabTestDetail['resultTableKey'], string, string]> = [
      ['xn_hoa_sinh_mau', 'PHIẾU XÉT NGHIỆM HOÁ SINH MÁU', 'Urê'],
      ['xn_nuoc_tieu', 'Nước tiểu, phân, dịch chọc dò', 'Que thử 10 thông số'],
      ['xn_vi_sinh', 'PHIẾU XÉT NGHIỆM VI SINH', 'Kháng sinh'],
      ['xn_mo_benh_hoc', 'KẾT QUẢ SINH THIẾT', 'Giải phẫu bệnh - Sinh thiết da'],
    ];

    cases.forEach(([resultTableKey, heading, formText]) => {
      const html = createLabResultPrintHtml({ ...detail, resultTableKey }, []);
      assert.match(html, new RegExp(heading));
      assert.match(html, new RegExp(formText));
    });

    const pathologyHtml = createLabResultPrintHtml(
      {
        ...detail,
        resultTableKey: 'xn_mo_benh_hoc',
        structuredResult: {
          chanDoanMoHoc: 'Viêm da',
          icd10MoHoc: 'L23.9',
          trangThai: 'da_co_ket_qua',
        },
      },
      [],
    );
    assert.match(pathologyHtml, /Mã ICD-10 \(VD L23\.9\)/);
    assert.match(pathologyHtml, /Viêm da/);
  });

  it('opens the isolated print document and invokes the browser print command', () => {
    const calls: string[] = [];
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        open: () => ({
          document: {
            close: () => calls.push('close'),
            open: () => calls.push('open'),
            write: (value: string) => calls.push(value),
          },
          focus: () => calls.push('focus'),
          print: () => calls.push('print'),
        }),
      },
    });

    try {
      printLabDocument('<html><body>only this document</body></html>');
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: originalWindow,
        });
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    }

    assert.deepEqual(calls, [
      'open',
      '<html><body>only this document</body></html>',
      'close',
      'focus',
      'print',
    ]);
  });
});
