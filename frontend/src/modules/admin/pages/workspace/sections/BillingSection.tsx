'use client';

import { useMemo, useState, type Dispatch, type FormEvent } from 'react';

import { AdminIcon } from '../../../components/AdminIcon';
import { AdminModal } from '../../../components/AdminModal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { FormField, getFormFieldInputClassName } from '../../../components/FormField';
import { SummaryCardGrid } from '../../../components/SummaryCard';
import { ToneBadge } from '../../../components/ToneBadge';
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

/** Định dạng số tiền nguyên theo VND để phân biệt rõ đơn vị trong bảng và thẻ KPI. */
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

/** Nhãn hiển thị cho ba trạng thái vận hành của giường. */
const bedStatusLabel: Record<BedStatus, string> = {
  available: 'Trống',
  maintenance: 'Bảo trì',
  occupied: 'Đang sử dụng',
};

/** Màu semantic của trạng thái giường; chỉ phục vụ trình bày, không phải quyền thao tác. */
const bedStatusTone: Record<BedStatus, 'green' | 'amber' | 'slate'> = {
  available: 'green',
  maintenance: 'slate',
  occupied: 'amber',
};

/**
 * Chuyển snapshot doanh thu thành các thẻ KPI hiển thị.
 * @param revenue - Snapshot tiền VND theo kỳ, hiện được workspace cung cấp từ mock data.
 * @returns Các thẻ đã định dạng tiền; không làm thay đổi snapshot đầu vào.
 * @remarks Các thẻ doanh thu chỉ đọc và không phải số liệu quyết toán từ API.
 */
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

/**
 * Hiển thị cơ cấu doanh thu theo phương thức thanh toán.
 * @param rows - Các dòng số tiền VND và phần trăm đã chuẩn hóa.
 * @remarks Chỉ render dữ liệu read-only; thanh phần trăm được giới hạn trong khoảng 0–100 khi vẽ.
 */
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

/**
 * Bảng CRUD giường bệnh dùng `DataTable`.
 * @param bedList - Danh sách giường từ state cục bộ.
 * @param onDeleteRequest - Mở hộp thoại xác nhận xóa.
 * @param onEditRequest - Mở modal chỉnh sửa bản ghi.
 * @remarks Trạng thái empty do `DataTable` hiển thị; callback cha mới thực hiện mutation.
 */
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

/**
 * Modal thêm/sửa giường với lỗi inline từ schema.
 * @param mode - `create` hiển thị form mới, `edit` nạp dữ liệu đang sửa.
 * @param formValues - Draft cục bộ; đơn giá vẫn là chuỗi trước khi parse thành VND/ngày.
 * @param errors - Map lỗi theo field.
 * @param onChangeText - Cập nhật các field text của draft.
 * @param onChangeStatus - Cập nhật trạng thái giường đã chọn.
 * @param onSubmit - Callback cha validate và dispatch ADD/UPDATE.
 * @param onCancel - Đóng modal mà không lưu draft.
 */
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

/**
 * Bảng công suất giường được tính từ danh sách giường hiện tại.
 * @param rows - Kết quả đã nhóm theo khoa, tỷ lệ là phần trăm đã làm tròn.
 * @remarks Giường bảo trì vẫn thuộc tổng số nhưng không thuộc số giường trống.
 */
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

/**
 * Màn hình doanh thu và giường bệnh.
 * @param revenue - Snapshot doanh thu VND chỉ đọc từ nguồn mock của workspace.
 * @param paymentBreakdown - Phân bổ phương thức thanh toán chỉ đọc.
 * @param beds - Danh sách giường hiện tại từ hook state cục bộ.
 * @param dispatchBedDirectory - Dispatch ADD/UPDATE/DELETE sau khi form/confirm hợp lệ.
 * @param showToast - Callback thông báo kết quả mutation cục bộ.
 * @remarks Không có loading/error/forbidden riêng vì màn hình không gọi API; doanh thu không bị mutation,
 * còn CRUD giường chỉ cập nhật state cục bộ. Authorization cuối cùng không nằm ở UI.
 */
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

  // Tính lại công suất khi danh sách giường cục bộ đổi; không tải hoặc ghi dữ liệu ra hệ thống ngoài.
  const bedOccupancy = useMemo(() => computeBedOccupancyByDepartment(beds), [beds]);

  // Click "Thêm giường": reset bản ghi/draft/lỗi rồi mở modal create.
  const handleOpenCreateModal = () => {
    setEditingBedId(null);
    setFormValues(emptyBedFormValues);
    setFieldErrors({});
    setModalMode('create');
  };

  // Click sửa: nạp giường vào draft, xóa lỗi cũ và mở modal edit; chưa dispatch mutation.
  const handleOpenEditModal = (bed: BedRecord) => {
    setEditingBedId(bed.id);
    setFormValues(toBedFormValues(bed));
    setFieldErrors({});
    setModalMode('edit');
  };

  // Click hủy/đóng: chỉ đóng modal, không thay đổi danh sách giường.
  const handleCloseModal = () => setModalMode('closed');

  // Input text change: cập nhật draft; schema và guard trùng phòng/giường chỉ chạy khi submit.
  const handleChangeText = (
    field: 'bedNumber' | 'dailyRate' | 'departmentCode' | 'roomNumber',
    value: string,
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  // Select trạng thái: cập nhật draft trạng thái, validation cuối cùng vẫn do schema xử lý.
  const handleChangeStatus = (value: BedStatus) => {
    setFormValues((current) => ({ ...current, status: value }));
  };

  // Submit form: guard Zod/trùng phòng-giường, dispatch ADD/UPDATE cục bộ và báo thành công.
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

  // Xác nhận xóa: guard bản ghi chờ, dispatch DELETE cục bộ rồi đóng hộp thoại và báo thành công.
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
