'use client';

import { useMemo, useState, type Dispatch, type FormEvent } from 'react';

import { AdminIcon } from '../../../components/admin-icon';
import { AdminModal } from '../../../components/admin-modal';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { DataTable, type DataTableColumn } from '../../../components/data-table';
import { FormField, getFormFieldInputClassName } from '../../../components/form-field';
import { SummaryCardGrid } from '../../../components/summary-card';
import { ToneBadge } from '../../../components/tone-badge';
import { departmentLabelByCode } from '../../../constants/admin-mock.data';
import type { BedDirectoryAction } from '../../../hooks/use-bed-directory';
import {
  bedFormSchema,
  emptyBedFormValues,
  getBedFormFieldErrors,
  isBedNumberTaken,
  toBedFormValues,
  type BedFormFieldErrors,
} from '../../../types/admin-bed-form.schema';
import type {
  BedFormValues,
  BedOccupancyRow,
  BedRecord,
  BedStatus,
  DepartmentCode,
  KpiCard,
  PaymentMethodBreakdownRow,
  RevenueSnapshot,
} from '../../../types/admin.types';
import { computeBedOccupancyByDepartment } from '../../../utils/compute-bed-occupancy';
import { adminWorkspaceStyles as styles } from '../admin-workspace.styles';

type BillingSectionProps = {
  beds: BedRecord[];
  dispatchBedDirectory: Dispatch<BedDirectoryAction>;
  paymentBreakdown: PaymentMethodBreakdownRow[];
  revenue: RevenueSnapshot;
  showToast: (message: string, tone?: 'success' | 'error') => void;
};

type ModalMode = 'closed' | 'create' | 'edit';

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

const bedStatusLabel: Record<BedStatus, string> = {
  available: 'Trống',
  maintenance: 'Bảo trì',
  occupied: 'Đang sử dụng',
};

const bedStatusTone: Record<BedStatus, 'green' | 'amber' | 'slate'> = {
  available: 'green',
  maintenance: 'slate',
  occupied: 'amber',
};

/** Chuyển RevenueSnapshot thành các thẻ KPI hiển thị (tiền mặt, chuyển khoản, BHYT, doanh thu ròng...). */
const buildRevenueKpiCards = (revenue: RevenueSnapshot): KpiCard[] => [
  { helper: revenue.periodLabel, id: 'cash', label: 'Tiền mặt', tone: 'sky', value: formatMoney(revenue.cashTotal) },
  {
    helper: revenue.periodLabel,
    id: 'transfer',
    label: 'Chuyển khoản + MoMo',
    tone: 'teal',
    value: formatMoney(revenue.bankTransferTotal + revenue.momoTotal),
  },
  {
    helper: revenue.periodLabel,
    id: 'insurance',
    label: 'Bảo hiểm y tế',
    tone: 'green',
    value: formatMoney(revenue.insuranceTotal),
  },
  {
    helper: `Đã trừ xóa nợ ${formatMoney(revenue.writeOffTotal)}`,
    id: 'net',
    label: 'Doanh thu ròng',
    tone: 'amber',
    value: formatMoney(revenue.netRevenue),
  },
];

function PaymentBreakdownRows({ rows }: { rows: PaymentMethodBreakdownRow[] }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold leading-6 text-slate-800">Cơ cấu doanh thu theo phương thức</h3>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div className="space-y-1.5" key={row.method}>
            <div className="flex items-center justify-between gap-4 text-xs leading-4">
              <span className="font-medium text-slate-600">{row.label}</span>
              <span className="font-bold text-slate-800">{formatMoney(row.amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#006096]"
                style={{ width: `${Math.max(0, Math.min(100, row.percentOfTotal))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BedTable({
  bedList,
  onDeleteRequest,
  onEditRequest,
}: {
  bedList: BedRecord[];
  onDeleteRequest: (bed: BedRecord) => void;
  onEditRequest: (bed: BedRecord) => void;
}) {
  const columns: Array<DataTableColumn<BedRecord>> = [
    { header: 'Phòng', key: 'room', render: (row) => row.roomNumber },
    { header: 'Giường', key: 'bed', render: (row) => row.bedNumber },
    { header: 'Khoa / phòng', key: 'department', render: (row) => departmentLabelByCode[row.departmentCode] },
    { header: 'Giá / ngày', key: 'rate', render: (row) => formatMoney(row.dailyRate) },
    {
      header: 'Trạng thái',
      key: 'status',
      render: (row) => <ToneBadge label={bedStatusLabel[row.status]} tone={bedStatusTone[row.status]} />,
    },
    {
      header: 'Thao tác',
      key: 'actions',
      render: (row) => (
        <div className="inline-flex items-center gap-2">
          <button
            className={`${styles.iconButton} h-8 w-8`}
            onClick={() => onEditRequest(row)}
            title="Sửa giường"
            type="button"
          >
            <AdminIcon className="h-4 w-4" name="edit" />
          </button>
          <button
            className={`${styles.iconButton} h-8 w-8 border-red-100 text-red-600 hover:bg-red-50`}
            onClick={() => onDeleteRequest(row)}
            title="Xóa giường"
            type="button"
          >
            <AdminIcon className="h-4 w-4" name="trash" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyLabel="Chưa có giường nào."
      rowKey={(row) => row.id}
      rows={bedList}
      title="Danh sách giường bệnh"
    />
  );
}

function BedFormModal({
  errors,
  formValues,
  mode,
  onCancel,
  onChangeText,
  onChangeStatus,
  onSubmit,
}: {
  errors: BedFormFieldErrors;
  formValues: BedFormValues;
  mode: ModalMode;
  onCancel: () => void;
  onChangeStatus: (value: BedStatus) => void;
  onChangeText: (field: 'bedNumber' | 'dailyRate' | 'departmentCode' | 'roomNumber', value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <AdminModal
      description="Điền đầy đủ thông tin. Đây là dữ liệu demo, không lưu vào hệ thống thật."
      onClose={onCancel}
      title={mode === 'create' ? 'Thêm giường' : 'Sửa giường'}
      titleId="admin-bed-form-title"
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.departmentCode?.[0]} htmlFor="bedDepartmentCode" label="Khoa / phòng" required>
            <select
              className={getFormFieldInputClassName(Boolean(errors.departmentCode?.[0]))}
              id="bedDepartmentCode"
              onChange={(event) => onChangeText('departmentCode', event.target.value)}
              value={formValues.departmentCode}
            >
              <option value="">-- Chọn khoa/phòng --</option>
              {(Object.keys(departmentLabelByCode) as DepartmentCode[]).map((code) => (
                <option key={code} value={code}>
                  {departmentLabelByCode[code]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField error={errors.status?.[0]} htmlFor="bedStatus" label="Trạng thái" required>
            <select
              className={getFormFieldInputClassName(Boolean(errors.status?.[0]))}
              id="bedStatus"
              onChange={(event) => onChangeStatus(event.target.value as BedStatus)}
              value={formValues.status}
            >
              <option value="available">Trống</option>
              <option value="occupied">Đang sử dụng</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </FormField>
        </div>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.roomNumber?.[0]} htmlFor="bedRoomNumber" label="Số phòng" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.roomNumber?.[0]))}
              id="bedRoomNumber"
              onChange={(event) => onChangeText('roomNumber', event.target.value)}
              placeholder="P101"
              value={formValues.roomNumber}
            />
          </FormField>
          <FormField error={errors.bedNumber?.[0]} htmlFor="bedNumber" label="Số giường" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.bedNumber?.[0]))}
              id="bedNumber"
              onChange={(event) => onChangeText('bedNumber', event.target.value)}
              placeholder="G1"
              value={formValues.bedNumber}
            />
          </FormField>
        </div>
        <div className="mb-3.5">
          <FormField error={errors.dailyRate?.[0]} htmlFor="bedDailyRate" label="Giá giường / ngày (đ)" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.dailyRate?.[0]))}
              id="bedDailyRate"
              inputMode="numeric"
              onChange={(event) => onChangeText('dailyRate', event.target.value)}
              value={formValues.dailyRate}
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            className="rounded-lg border border-[#bfc7d2] px-4 py-2 text-xs font-semibold text-[#3f4851] transition hover:bg-[#f0f4f8]"
            onClick={onCancel}
            type="button"
          >
            Hủy
          </button>
          <button
            className="min-w-[132px] rounded-lg bg-[#006096] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004f7e] active:scale-[0.98]"
            type="submit"
          >
            {mode === 'create' ? '✓ Thêm giường' : '✓ Lưu thay đổi'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

function BedOccupancySummary({ rows }: { rows: BedOccupancyRow[] }) {
  const columns: Array<DataTableColumn<BedOccupancyRow>> = [
    { header: 'Khoa / khu điều trị', key: 'department', render: (row) => row.departmentName },
    { header: 'Đang sử dụng', key: 'occupied', render: (row) => `${row.occupiedBeds} / ${row.totalBeds}` },
    { header: 'Giường trống', key: 'available', render: (row) => row.availableBeds },
    { header: 'Công suất', key: 'rate', render: (row) => `${row.occupancyRatePercent}%` },
    {
      header: 'Trạng thái',
      key: 'status',
      render: (row) => (
        <ToneBadge
          label={row.statusLabel}
          tone={row.status === 'critical' ? 'red' : row.status === 'busy' ? 'amber' : 'green'}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyLabel="Chưa có giường nào để tính công suất."
      rowKey={(row) => row.departmentName}
      rows={rows}
      title="Công suất giường bệnh theo khoa"
    />
  );
}

/** Màn hình doanh thu & giường bệnh: KPI, cơ cấu thanh toán (chỉ đọc) và quản lý giường bệnh (CRUD). */
export function BillingSection({
  beds,
  dispatchBedDirectory,
  paymentBreakdown,
  revenue,
  showToast,
}: BillingSectionProps) {
  const [modalMode, setModalMode] = useState<ModalMode>('closed');
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<BedFormValues>(emptyBedFormValues);
  const [fieldErrors, setFieldErrors] = useState<BedFormFieldErrors>({});
  const [pendingDeleteBed, setPendingDeleteBed] = useState<BedRecord | null>(null);

  const bedOccupancy = useMemo(() => computeBedOccupancyByDepartment(beds), [beds]);

  const handleOpenCreateModal = () => {
    setEditingBedId(null);
    setFormValues(emptyBedFormValues);
    setFieldErrors({});
    setModalMode('create');
  };

  const handleOpenEditModal = (bed: BedRecord) => {
    setEditingBedId(bed.id);
    setFormValues(toBedFormValues(bed));
    setFieldErrors({});
    setModalMode('edit');
  };

  const handleCloseModal = () => setModalMode('closed');

  const handleChangeText = (
    field: 'bedNumber' | 'dailyRate' | 'departmentCode' | 'roomNumber',
    value: string,
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleChangeStatus = (value: BedStatus) => {
    setFormValues((current) => ({ ...current, status: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = bedFormSchema.safeParse(formValues);
    if (!result.success) {
      setFieldErrors(getBedFormFieldErrors(result.error));
      return;
    }

    if (isBedNumberTaken(beds, result.data.roomNumber, result.data.bedNumber, editingBedId ?? undefined)) {
      setFieldErrors((current) => ({ ...current, bedNumber: ['Phòng này đã có giường trùng số'] }));
      return;
    }

    if (modalMode === 'create') {
      dispatchBedDirectory({ payload: { ...result.data, id: crypto.randomUUID() }, type: 'ADD' });
      showToast(`Đã thêm giường ${result.data.bedNumber} (phòng ${result.data.roomNumber})`);
    } else if (editingBedId) {
      dispatchBedDirectory({ payload: { changes: result.data, id: editingBedId }, type: 'UPDATE' });
      showToast(`Đã cập nhật giường ${result.data.bedNumber} (phòng ${result.data.roomNumber})`);
    }

    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteBed) return;
    dispatchBedDirectory({ payload: { id: pendingDeleteBed.id }, type: 'DELETE' });
    showToast(`Đã xóa giường ${pendingDeleteBed.bedNumber} (phòng ${pendingDeleteBed.roomNumber})`);
    setPendingDeleteBed(null);
  };

  return (
    <div className="space-y-6">
      <SummaryCardGrid cards={buildRevenueKpiCards(revenue)} />
      <PaymentBreakdownRows rows={paymentBreakdown} />
      <BedOccupancySummary rows={bedOccupancy} />

      <div className="flex justify-end">
        <button className={styles.primaryButton} onClick={handleOpenCreateModal} type="button">
          <AdminIcon className="h-4 w-4" name="plus" />
          Thêm giường
        </button>
      </div>
      <BedTable bedList={beds} onDeleteRequest={setPendingDeleteBed} onEditRequest={handleOpenEditModal} />

      {modalMode !== 'closed' ? (
        <BedFormModal
          errors={fieldErrors}
          formValues={formValues}
          mode={modalMode}
          onCancel={handleCloseModal}
          onChangeStatus={handleChangeStatus}
          onChangeText={handleChangeText}
          onSubmit={handleSubmit}
        />
      ) : null}

      {pendingDeleteBed ? (
        <ConfirmDialog
          description={`Xóa giường ${pendingDeleteBed.bedNumber} (phòng ${pendingDeleteBed.roomNumber})? Đây là dữ liệu demo, hành động không thể hoàn tác.`}
          onCancel={() => setPendingDeleteBed(null)}
          onConfirm={handleConfirmDelete}
          title="Xóa giường"
        />
      ) : null}
    </div>
  );
}
