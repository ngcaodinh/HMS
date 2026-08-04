import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  filterPrescriptionsByDispenseView,
  openPendingPrescriptionDispense,
  PrescriptionDispenseScreen,
  resolveSelectedPrescription,
  type PrescriptionChipFilter,
} from '../src/modules/pharmacy/components/PrescriptionDispenseScreen';
import {
  PharmacyModals,
  validateRejectReason,
} from '../src/modules/pharmacy/components/PharmacyModals';
import { NationalXmlScreen } from '../src/modules/pharmacy/components/NationalXmlScreen';
import { PharmacyInventoryScreen } from '../src/modules/pharmacy/components/PharmacyInventoryScreen';
import { StockReportScreen } from '../src/modules/pharmacy/components/StockReportScreen';
import { escapeHtml } from '../src/modules/pharmacy/components/print-label';
import {
  createIdempotencyKey,
  downloadPrescriptionXmlFile,
} from '../src/modules/pharmacy/services/prescription-dispense-api';
import type {
  PharmacyInventoryBatch,
  PharmacyStockMovement,
  PharmacyWarehouse,
} from '../src/modules/pharmacy/types/pharmacy-inventory.schema';
import type { Prescription } from '../src/modules/pharmacy/types/pharmacy.types';
import { httpClient } from '../src/shared/api-client';

const originalHttpGet = httpClient.get;
const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalDateNow = Date.now;
const originalMathRandom = Math.random;
const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;

const warehouses: PharmacyWarehouse[] = [
  { code: 'OUT-A', name: 'Kho Ngoai Tru A', warehouseId: 'warehouse-out-a-0001' },
  { code: 'IN-B', name: 'Kho Noi Tru B', warehouseId: 'warehouse-in-b-0001' },
];

function createPrescription(overrides: Partial<Prescription> = {}): Prescription {
  return {
    bhytCardNumber: 'BHYT-0001',
    bhytRatio: 'BHYT 80%',
    department: 'Khoa Kham Benh',
    doctorName: 'BS. Nguyen Van An',
    hasAllergyWarning: false,
    icdCode: 'J00',
    icdDiagnosis: 'Cam lanh',
    id: '0891',
    invoiceId: 'INV-0891',
    invoiceStatus: 'paid',
    isSigned: true,
    items: [
      {
        availableStock: 42,
        dosageInstruction: 'Uong sau an',
        drugId: 'med-paracetamol',
        drugName: 'Paracetamol 500mg',
        expiryDate: '31/08/2026',
        fefoAllocations: [
          {
            balanceAfter: 20,
            batchNumber: 'LOT-A-EARLY',
            expiryDate: '31/08/2026',
            quantityAllocated: 2,
            warehouseName: 'Kho Ngoai Tru A',
          },
        ],
        fefoLotNumber: 'LOT-A-EARLY',
        isStockSufficient: true,
        quantity: 2,
        shelfLocation: 'A-01',
        spec: 'Vien nen',
        unit: 'vien',
      },
    ],
    patientAge: 36,
    patientGender: 'Nam',
    patientId: 'BN-2026-0089',
    patientName: 'Tran Minh Linh',
    patientType: 'outpatient',
    signedAt: '20/07/2026 08:30',
    status: 'pending',
    warehouseId: 'warehouse-out-a-0001',
    warehouseName: 'Kho Ngoai Tru A',
    ...overrides,
  };
}

function getFilteredIds(options: {
  activeChip: PrescriptionChipFilter;
  prescriptions: Prescription[];
  searchQuery?: string;
  selectedWarehouseId?: string;
}) {
  return filterPrescriptionsByDispenseView({
    activeChip: options.activeChip,
    prescriptions: options.prescriptions,
    searchQuery: options.searchQuery ?? '',
    selectedWarehouseId: options.selectedWarehouseId ?? 'all',
  }).map((prescription) => prescription.id);
}

function renderDispenseScreen(props: Partial<React.ComponentProps<typeof PrescriptionDispenseScreen>> = {}) {
  return renderToStaticMarkup(React.createElement(PrescriptionDispenseScreen, {
    isDownloadingXml: false,
    isExportingXml: false,
    isLoading: false,
    onDownloadXml: () => undefined,
    onExportXml: () => undefined,
    onOpenDispenseModal: () => undefined,
    onOpenRejectModal: () => undefined,
    onPrintLabel: () => undefined,
    onReloadQueue: () => undefined,
    onSelectPrescription: () => undefined,
    onSelectWarehouse: () => undefined,
    prescriptions: [createPrescription()],
    selectedPrescriptionId: '0891',
    selectedWarehouseId: 'all',
    warehouses,
    ...props,
  }));
}

function renderModals(props: Partial<React.ComponentProps<typeof PharmacyModals>> = {}) {
  return renderToStaticMarkup(React.createElement(PharmacyModals, {
    activeModal: null,
    isDispensing: false,
    isRejecting: false,
    onCloseModal: () => undefined,
    onConfirmDispense: () => undefined,
    onConfirmFefoSync: () => undefined,
    onConfirmLogout: () => undefined,
    onConfirmReject: () => undefined,
    onConfirmXmlImport: () => undefined,
    prescription: createPrescription(),
    ...props,
  }));
}

const inventoryBatch: PharmacyInventoryBatch = {
  batchId: 'batch-1',
  batchNumber: 'LOT-REAL-001',
  daysToExpiry: 12,
  expiryDate: '2026-08-16T00:00:00.000Z',
  importPrice: '10000',
  isExpired: false,
  isExpiringSoon: true,
  isLowStock: false,
  medicine: {
    activeIngredient: 'Paracetamol',
    code: 'MED-001',
    coveredByHealthInsurance: true,
    dosage: '500mg',
    medicineId: 'medicine-1',
    name: 'Real Medicine',
    unit: 'vien',
  },
  quantity: 42,
  version: 1,
  warehouse: { code: 'WH-1', name: 'Real Warehouse', warehouseId: 'warehouse-1' },
};

const stockMovement: PharmacyStockMovement = {
  actorUserId: 'pharmacist-1',
  balanceAfter: 40,
  batch: {
    batchId: 'batch-1',
    batchNumber: 'LOT-REAL-001',
    expiryDate: '2026-08-16T00:00:00.000Z',
  },
  createdAt: '2026-08-04T10:00:00.000Z',
  medicine: { code: 'MED-001', medicineId: 'medicine-1', name: 'Real Medicine' },
  movementId: 'movement-1',
  movementType: 'prescription_sign',
  prescriptionId: 'prescription-1',
  quantityChange: -2,
  referenceId: 'prescription-1',
  referenceType: 'prescription',
  warehouse: { code: 'WH-1', name: 'Real Warehouse', warehouseId: 'warehouse-1' },
};

function renderNationalXml(props: Partial<React.ComponentProps<typeof NationalXmlScreen>> = {}) {
  return renderToStaticMarkup(React.createElement(NationalXmlScreen, {
    onDownloadXml: () => undefined,
    prescription: createPrescription({ xmlExportedAt: '2026-08-04T10:00:00.000Z' }),
    xmlContent: '<REAL_XML />',
    ...props,
  }));
}

function renderInventory(props: Partial<React.ComponentProps<typeof PharmacyInventoryScreen>> = {}) {
  return renderToStaticMarkup(React.createElement(PharmacyInventoryScreen, {
    inventoryItems: [inventoryBatch],
    isError: false,
    isLoading: false,
    kpi: {
      expiredBatches: 0,
      expiringSoonBatches: 1,
      lowStockBatches: 0,
      totalBatches: 1,
      totalQuantity: 42,
    },
    onNavigateToStockImport: () => undefined,
    onSearchQueryChange: () => undefined,
    searchQuery: '',
    ...props,
  }));
}

function renderStockReport(props: Partial<React.ComponentProps<typeof StockReportScreen>> = {}) {
  return renderToStaticMarkup(React.createElement(StockReportScreen, {
    from: '',
    isError: false,
    isLoading: false,
    logs: [stockMovement],
    movementType: '',
    onExportExcel: () => undefined,
    onFromChange: () => undefined,
    onMovementTypeChange: () => undefined,
    onToChange: () => undefined,
    to: '',
    ...props,
  }));
}

afterEach(() => {
  httpClient.get = originalHttpGet;
  Date.now = originalDateNow;
  Math.random = originalMathRandom;
  URL.createObjectURL = originalCreateObjectUrl;
  URL.revokeObjectURL = originalRevokeObjectUrl;

  if (originalCrypto) {
    Object.defineProperty(globalThis, 'crypto', originalCrypto);
  } else {
    Reflect.deleteProperty(globalThis, 'crypto');
  }

  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument);
  } else {
    Reflect.deleteProperty(globalThis, 'document');
  }
});

describe('pharmacy dispense screen filters', () => {
  it('filters pending, dispensed, outpatient, inpatient, allergy and all chips', () => {
    const pendingRx = createPrescription({ id: '0891', status: 'pending' });
    const dispensedRx = createPrescription({ id: '0892', status: 'dispensed' });
    const inpatientRx = createPrescription({ id: '0893', patientType: 'inpatient' });
    const allergyRx = createPrescription({
      allergyWarningText: 'Di ung Penicillin',
      hasAllergyWarning: true,
      id: '0894',
    });
    const prescriptions = [pendingRx, dispensedRx, inpatientRx, allergyRx];

    assert.deepEqual(getFilteredIds({ activeChip: 'pending', prescriptions }), ['0891', '0893', '0894']);
    assert.deepEqual(getFilteredIds({ activeChip: 'dispensed', prescriptions }), ['0892']);
    assert.deepEqual(getFilteredIds({ activeChip: 'outpatient', prescriptions }), ['0891', '0892', '0894']);
    assert.deepEqual(getFilteredIds({ activeChip: 'inpatient', prescriptions }), ['0893']);
    assert.deepEqual(getFilteredIds({ activeChip: 'allergy', prescriptions }), ['0894']);
    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions }), ['0891', '0892', '0893', '0894']);
  });

  it('filters by selected warehouse before applying chip status', () => {
    const outpatientRx = createPrescription({ id: '0891', warehouseId: 'warehouse-out-a-0001' });
    const inpatientRx = createPrescription({ id: '0892', warehouseId: 'warehouse-in-b-0001' });

    assert.deepEqual(getFilteredIds({
      activeChip: 'pending',
      prescriptions: [outpatientRx, inpatientRx],
      selectedWarehouseId: 'warehouse-in-b-0001',
    }), ['0892']);
  });

  it('searches by prescription code, patient code, patient name and doctor name case-insensitively', () => {
    const rx = createPrescription();
    const prescriptions = [rx];

    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions, searchQuery: 'rx-2026-0891' }), ['0891']);
    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions, searchQuery: 'bn-2026-0089' }), ['0891']);
    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions, searchQuery: 'minh linh' }), ['0891']);
    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions, searchQuery: 'nguyen van an' }), ['0891']);
    assert.deepEqual(getFilteredIds({ activeChip: 'all', prescriptions, searchQuery: 'khong-ton-tai' }), []);
  });

  it('resolves selected prescription and falls back safely when the current id is stale', () => {
    const firstRx = createPrescription({ id: '0891' });
    const secondRx = createPrescription({ id: '0892' });

    assert.equal(resolveSelectedPrescription([firstRx, secondRx], '0892'), secondRx);
    assert.equal(resolveSelectedPrescription([firstRx, secondRx], 'missing'), firstRx);
    assert.equal(resolveSelectedPrescription([], 'missing'), undefined);
  });
});

describe('pharmacy dispense actions and markup', () => {
  it('selects the pending prescription and opens the dispense modal when processing a row', () => {
    const rx = createPrescription();
    let selectedId = '';
    let openedPrescription: Prescription | undefined;

    openPendingPrescriptionDispense(rx, {
      onOpenDispenseModal: (value) => {
        openedPrescription = value;
      },
      onSelectPrescription: (id) => {
        selectedId = id;
      },
    });

    assert.equal(selectedId, '0891');
    assert.equal(openedPrescription, rx);
  });

  it('renders queue row, selected detail, FEFO allocation and pending action button', () => {
    const html = renderDispenseScreen();

    assert.match(html, /#RX-2026-0891/);
    assert.match(html, /Paracetamol 500mg/);
    assert.match(html, /LOT-A-EARLY/);
    assert.match(html, /Xử lý phát thuốc/);
  });

  it('renders loading and empty states without showing queue rows', () => {
    assert.match(renderDispenseScreen({ isLoading: true, prescriptions: [] }), /Đang tải/);
    assert.match(renderDispenseScreen({ prescriptions: [] }), /Không có/);
  });

  it('switches XML action between export and download states', () => {
    const notExportedHtml = renderDispenseScreen({
      isExportingXml: true,
      prescriptions: [createPrescription({ xmlExportedAt: null })],
    });
    const exportedHtml = renderDispenseScreen({
      isDownloadingXml: true,
      prescriptions: [createPrescription({ xmlExportedAt: '2026-07-20T10:00:00.000Z' })],
    });

    assert.match(notExportedHtml, /Đang kết xuất XML/);
    assert.match(exportedHtml, /Đang tải XML/);
  });
  it('bounds the search field and disables dispense when invoice or stock is unsafe', () => {
    const unpaidHtml = renderDispenseScreen({
      prescriptions: [createPrescription({ invoiceStatus: 'unpaid' })],
    });
    const insufficientHtml = renderDispenseScreen({
      prescriptions: [createPrescription({
        items: [{ ...createPrescription().items[0], isStockSufficient: false }],
      })],
    });

    assert.match(unpaidHtml, /maxLength="100"/);
    assert.match(unpaidHtml, /disabled=""/);
    assert.match(insufficientHtml, /disabled=""/);
  });

  it('disables both dispense and reject actions for an already dispensed prescription', () => {
    const html = renderDispenseScreen({
      prescriptions: [createPrescription({ status: 'dispensed' })],
    });

    assert.match(html, /disabled=""/);
  });
});

describe('pharmacy modals', () => {
  it('validates reject reason boundaries', () => {
    assert.equal(validateRejectReason(''), 'Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.');
    assert.equal(validateRejectReason('          '), 'Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.');
    assert.equal(validateRejectReason('123456789'), 'Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.');
    assert.equal(validateRejectReason('1234567890'), null);
    assert.equal(validateRejectReason('Thuoc tam het hang'), null);
    assert.match(validateRejectReason('a'.repeat(501)) ?? '', /tối đa 500/);
  });

  it('escapes free text before it is inserted into print HTML', () => {
    assert.equal(escapeHtml(`<img src=x onerror="alert(1)"> & 'x'`),
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;x&#39;');
  });

  it('renders dispense modal with disabled pending confirmation', () => {
    const html = renderModals({ activeModal: 'dispense', isDispensing: true });

    assert.match(html, /#RX-2026-0891/);
    assert.match(html, /LOT-A-EARLY/);
    assert.match(html, /disabled=""/);
    assert.match(html, /Đang ghi nhận/);
  });

  it('keeps dispense confirmation disabled for unpaid or insufficient prescriptions', () => {
    const unpaidHtml = renderModals({
      activeModal: 'dispense',
      prescription: createPrescription({ invoiceStatus: 'unpaid' }),
    });
    const insufficientHtml = renderModals({
      activeModal: 'dispense',
      prescription: createPrescription({
        items: [{ ...createPrescription().items[0], isStockSufficient: false }],
      }),
    });

    assert.match(unpaidHtml, /disabled=""/);
    assert.match(insufficientHtml, /disabled=""/);
  });

  it('shows the backend reject field error in the reject modal', () => {
    const html = renderModals({
      activeModal: 'reject',
      rejectServerError: 'cancelReason is invalid',
    });

    assert.match(html, /cancelReason is invalid/);
  });

  it('renders reject, import XML, FEFO sync and logout modal actions', () => {
    assert.match(renderModals({ activeModal: 'reject', isRejecting: true }), /Đang gửi/);
    assert.match(renderModals({ activeModal: 'import-xml' }), /XML-HD-2026-9921/);
    assert.match(renderModals({ activeModal: 'fefo-sync' }), /FEFO/);
    assert.match(renderModals({ activeModal: 'logout' }), /Đăng xuất/);
  });
});

describe('pharmacy prescription API helpers', () => {
  it('uses browser UUID for the dispense idempotency key when available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID: () => '11111111-1111-4111-8111-111111111111' },
    });

    assert.equal(createIdempotencyKey(), '11111111-1111-4111-8111-111111111111');
  });

  it('falls back to a deterministic local idempotency key when crypto UUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });
    Date.now = () => 1784567890000;
    Math.random = () => 0.5;

    assert.equal(createIdempotencyKey(), 'dispense-1784567890000-i');
  });

  it('downloads prescription XML through the BFF proxy and honors the response filename', async () => {
    const clicked: Array<{ download: string; href: string }> = [];
    let capturedUrl = '';
    let capturedResponseType = '';
    let revokedUrl = '';

    httpClient.get = (async (url: string, config?: { responseType?: string }) => {
      capturedUrl = url;
      capturedResponseType = config?.responseType ?? '';

      return {
        data: new Blob(['<xml />'], { type: 'application/xml' }),
        headers: {
          'content-disposition': 'attachment; filename="RX-2026-0891.xml"',
        },
      };
    }) as typeof httpClient.get;

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => ({
          click() {
            clicked.push({ download: this.download, href: this.href });
          },
          download: '',
          href: '',
        }),
      },
    });
    URL.createObjectURL = (() => 'blob:rx-xml') as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((url: string) => {
      revokedUrl = url;
    }) as typeof URL.revokeObjectURL;

    await downloadPrescriptionXmlFile('prescription-0891');

    assert.equal(capturedUrl, '/prescriptions/prescription-0891/xml-file');
    assert.equal(capturedResponseType, 'blob');
    assert.deepEqual(clicked, [{ download: 'RX-2026-0891.xml', href: 'blob:rx-xml' }]);
    assert.equal(revokedUrl, 'blob:rx-xml');
  });
});

describe('pharmacy data screens', () => {
  it('renders selected XML and empty/unexported states without sample XML', () => {
    assert.match(renderNationalXml(), /REAL_XML/);
    assert.doesNotMatch(renderNationalXml(), /RX-2026-0891/);
    assert.match(renderNationalXml({ prescription: null, xmlContent: null }), /XML/);
    assert.match(renderNationalXml({
      prescription: createPrescription({ xmlExportedAt: null }),
      xmlContent: null,
    }), /XML/);
    assert.doesNotMatch(renderNationalXml({ isLoading: true }), /REAL_XML/);
  });

  it('renders real inventory data and loading/error/empty states', () => {
    assert.match(renderInventory(), /Real Medicine/);
    assert.match(renderInventory(), /LOT-REAL-001/);
    assert.match(renderInventory({ isLoading: true }), /tải/);
    assert.match(renderInventory({ isError: true }), /tải/);
    assert.match(renderInventory({ inventoryItems: [] }), /batch/);
  });

  it('renders real stock movements and loading/error/empty states', () => {
    assert.match(renderStockReport(), /Real Medicine/);
    assert.match(renderStockReport(), /- 2/);
    assert.match(renderStockReport({ dateError: 'Invalid date range' }), /Invalid date range/);
    assert.match(renderStockReport({ isLoading: true }), /tải/);
    assert.match(renderStockReport({ isError: true }), /báo cáo/);
    assert.match(renderStockReport({ logs: [] }), /biến/);
  });
});
