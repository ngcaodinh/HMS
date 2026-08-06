'use client';

import { useState, type Dispatch, type FormEvent } from 'react';

import { AdminIcon } from '../../../components/AdminIcon';
import { AdminModal } from '../../../components/AdminModal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { FormField, getFormFieldInputClassName } from '../../../components/FormField';
import { ToneBadge } from '../../../components/ToneBadge';
import { departmentLabelByCode } from '../../../constants/admin-mock.data';
import type { ServiceCatalogAction } from '../../../hooks/use-service-catalog';
import {
  catalogFormSchema,
  emptyCatalogFormValues,
  getCatalogFormFieldErrors,
  isCatalogCodeTaken,
  toCatalogFormValues,
  type CatalogFormFieldErrors,
} from '../../../types/admin-catalog-form.schema';
import type { DepartmentCode, ServiceCatalogFormValues, ServiceCatalogItem } from '../../../types/admin.types';
import { adminWorkspaceStyles as styles } from '../admin-workspace.styles';

type CatalogSectionProps = {
  catalogList: ServiceCatalogItem[];
  dispatchServiceCatalog: Dispatch<ServiceCatalogAction>;
  showToast: (message: string, tone?: 'success' | 'error') => void;
};

type ModalMode = 'closed' | 'create' | 'edit';

/** Định dạng số tiền nguyên theo VND để hiển thị nhất quán trong bảng và KPI. */
const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

/**
 * Bảng danh mục dịch vụ và các callback yêu cầu thao tác từ component cha.
 * @param catalogList - Danh sách dịch vụ hiện có trên state cục bộ.
 * @param onDeleteRequest - Mở hộp thoại xác nhận xóa, chưa xóa ngay tại bảng.
 * @param onEditRequest - Mở modal và nạp bản ghi vào form chỉnh sửa.
 * @param onToggleInsurance - Bật/tắt cờ BHYT trên state cục bộ.
 * @remarks Khi danh sách rỗng, bảng hiển thị empty state; cờ BHYT ở UI không thay thế quy tắc backend.
 */
function CatalogTable({
  catalogList,
  onDeleteRequest,
  onEditRequest,
  onToggleInsurance,
}: {
  catalogList: ServiceCatalogItem[];
  onDeleteRequest: (item: ServiceCatalogItem) => void;
  onEditRequest: (item: ServiceCatalogItem) => void;
  onToggleInsurance: (item: ServiceCatalogItem) => void;
}) {
  if (!catalogList.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chưa có dịch vụ nào trong danh mục.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              <th className="px-6 py-4">Mã dịch vụ</th>
              <th className="px-6 py-4">Tên dịch vụ</th>
              <th className="px-6 py-4">Khoa / phòng</th>
              <th className="px-6 py-4">Giá</th>
              <th className="px-6 py-4">Bảo hiểm y tế</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {catalogList.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">{item.code}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-700">{item.name}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">
                  {departmentLabelByCode[item.departmentCode]}
                </td>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">
                  {formatMoney(item.price)}
                </td>
                <td className="px-6 py-4">
                  <button className="inline-flex flex-col items-start gap-1" onClick={() => onToggleInsurance(item)} type="button">
                    <ToneBadge
                      label={item.coveredByHealthInsurance ? 'Có BHYT' : 'Không BHYT'}
                      tone={item.coveredByHealthInsurance ? 'teal' : 'slate'}
                    />
                    {item.coveredByHealthInsurance ? (
                      <span className="text-[11px] text-slate-500">
                        {item.healthInsuranceCeilingPrice === null
                          ? 'Chưa cấu hình mức trần'
                          : `Trần: ${formatMoney(item.healthInsuranceCeilingPrice)}`}
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className={`${styles.iconButton} h-8 w-8`}
                      onClick={() => onEditRequest(item)}
                      title="Sửa dịch vụ"
                      type="button"
                    >
                      <AdminIcon className="h-4 w-4" name="edit" />
                    </button>
                    <button
                      className={`${styles.iconButton} h-8 w-8 border-red-100 text-red-600 hover:bg-red-50`}
                      onClick={() => onDeleteRequest(item)}
                      title="Xóa dịch vụ"
                      type="button"
                    >
                      <AdminIcon className="h-4 w-4" name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Modal thêm/sửa danh mục dịch vụ với quy tắc giá và mức trần BHYT.
 * @param mode - `create` hiển thị form mới, `edit` nạp dữ liệu đang sửa.
 * @param formValues - Draft cục bộ; trường tiền vẫn là chuỗi trước khi parse.
 * @param errors - Map lỗi inline từ schema.
 * @param onChange - Cập nhật draft text khi input thay đổi.
 * @param onToggleInsuranceCheckbox - Đồng bộ cờ BHYT và field mức trần theo lựa chọn.
 * @param onSubmit - Callback cha validate và dispatch ADD/UPDATE.
 * @param onCancel - Đóng modal mà không lưu draft.
 */
function CatalogFormModal({
  errors,
  formValues,
  mode,
  onCancel,
  onChange,
  onSubmit,
  onToggleInsuranceCheckbox,
}: {
  errors: CatalogFormFieldErrors;
  formValues: ServiceCatalogFormValues;
  mode: ModalMode;
  onCancel: () => void;
  onChange: (field: keyof ServiceCatalogFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleInsuranceCheckbox: (checked: boolean) => void;
}) {
  return (
    <AdminModal
      description="Điền đầy đủ thông tin. Đây là dữ liệu demo, không lưu vào hệ thống thật."
      onClose={onCancel}
      title={mode === 'create' ? 'Thêm dịch vụ' : 'Sửa dịch vụ'}
      titleId="admin-catalog-form-title"
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.code?.[0]} htmlFor="code" label="Mã dịch vụ" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.code?.[0]))}
              id="code"
              onChange={(event) => onChange('code', event.target.value)}
              placeholder="SVC-0001"
              value={formValues.code}
            />
          </FormField>
          <FormField error={errors.name?.[0]} htmlFor="name" label="Tên dịch vụ" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.name?.[0]))}
              id="name"
              onChange={(event) => onChange('name', event.target.value)}
              value={formValues.name}
            />
          </FormField>
        </div>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.departmentCode?.[0]} htmlFor="departmentCode" label="Khoa / phòng" required>
            <select
              className={getFormFieldInputClassName(Boolean(errors.departmentCode?.[0]))}
              id="departmentCode"
              onChange={(event) => onChange('departmentCode', event.target.value)}
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
          <FormField error={errors.price?.[0]} htmlFor="price" label="Giá dịch vụ (đ)" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.price?.[0]))}
              id="price"
              inputMode="numeric"
              onChange={(event) => onChange('price', event.target.value)}
              value={formValues.price}
            />
          </FormField>
        </div>

        <label
          className="mb-3.5 flex items-center gap-2 text-xs font-semibold text-[#3f4851]"
          htmlFor="coveredByHealthInsurance"
        >
          <input
            checked={formValues.coveredByHealthInsurance}
            className="h-4 w-4 rounded border-[#bfc7d2] text-[#006096] focus:ring-[#006096]/30"
            id="coveredByHealthInsurance"
            onChange={(event) => onToggleInsuranceCheckbox(event.target.checked)}
            type="checkbox"
          />
          Được bảo hiểm y tế chi trả
        </label>

        {formValues.coveredByHealthInsurance ? (
          <div className="mb-3.5">
            <FormField
              error={errors.healthInsuranceCeilingPrice?.[0]}
              htmlFor="healthInsuranceCeilingPrice"
              label="Mức trần BHYT (đ)"
              required
            >
              <input
                className={getFormFieldInputClassName(Boolean(errors.healthInsuranceCeilingPrice?.[0]))}
                id="healthInsuranceCeilingPrice"
                inputMode="numeric"
                onChange={(event) => onChange('healthInsuranceCeilingPrice', event.target.value)}
                value={formValues.healthInsuranceCeilingPrice}
              />
            </FormField>
          </div>
        ) : null}

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
            {mode === 'create' ? '✓ Thêm dịch vụ' : '✓ Lưu thay đổi'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/**
 * Màn hình quản lý danh mục dịch vụ và cờ bảo hiểm y tế.
 * @param catalogList - Nguồn dữ liệu danh mục hiện tại từ hook state cục bộ.
 * @param dispatchServiceCatalog - Dispatch ADD/UPDATE/DELETE/TOGGLE_INSURANCE sau khi guard hợp lệ.
 * @param showToast - Callback thông báo kết quả thao tác do workspace sở hữu.
 * @remarks Form có validation inline, guard trùng mã và ràng buộc trần BHYT; mọi mutation hiện chỉ ở mock state.
 * Không suy diễn rằng cờ hiển thị này tự cấp quyền thanh toán hoặc thay thế backend.
 */
export function CatalogSection({ catalogList, dispatchServiceCatalog, showToast }: CatalogSectionProps) {
  const [modalMode, setModalMode] = useState<ModalMode>('closed');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ServiceCatalogFormValues>(emptyCatalogFormValues);
  const [fieldErrors, setFieldErrors] = useState<CatalogFormFieldErrors>({});
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ServiceCatalogItem | null>(null);

  // Click "Thêm dịch vụ": reset bản ghi/draft/lỗi rồi mở modal create trên state cục bộ.
  const handleOpenCreateModal = () => {
    setEditingItemId(null);
    setFormValues(emptyCatalogFormValues);
    setFieldErrors({});
    setModalMode('create');
  };

  // Click sửa: nạp bản ghi vào draft, xóa lỗi cũ và mở modal edit; chưa dispatch mutation.
  const handleOpenEditModal = (item: ServiceCatalogItem) => {
    setEditingItemId(item.id);
    setFormValues(toCatalogFormValues(item));
    setFieldErrors({});
    setModalMode('edit');
  };

  // Click hủy/đóng: chỉ đóng modal, không thay đổi danh mục.
  const handleCloseModal = () => setModalMode('closed');

  // Input change: cập nhật draft text; parse và validation chỉ chạy ở submit.
  const handleChangeField = (field: keyof ServiceCatalogFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  // Checkbox BHYT: khi tắt, xóa draft mức trần để tránh giữ giá trị không còn áp dụng.
  const handleToggleInsuranceCheckbox = (checked: boolean) => {
    setFormValues((current) => ({
      ...current,
      coveredByHealthInsurance: checked,
      healthInsuranceCeilingPrice: checked ? current.healthInsuranceCeilingPrice : '',
    }));
  };

  // Submit form: guard Zod/trùng mã, sau đó dispatch ADD/UPDATE cục bộ và báo thành công.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = catalogFormSchema.safeParse(formValues);
    if (!result.success) {
      setFieldErrors(getCatalogFormFieldErrors(result.error));
      return;
    }

    if (isCatalogCodeTaken(catalogList, result.data.code, editingItemId ?? undefined)) {
      setFieldErrors((current) => ({ ...current, code: ['Mã dịch vụ đã tồn tại'] }));
      return;
    }

    if (modalMode === 'create') {
      dispatchServiceCatalog({
        payload: { ...result.data, id: crypto.randomUUID(), isActive: true },
        type: 'ADD',
      });
      showToast(`Đã thêm dịch vụ ${result.data.name}`);
    } else if (editingItemId) {
      dispatchServiceCatalog({ payload: { changes: result.data, id: editingItemId }, type: 'UPDATE' });
      showToast(`Đã cập nhật dịch vụ ${result.data.name}`);
    }

    handleCloseModal();
  };

  // Click cờ BHYT: dispatch toggle trên mock state và báo trạng thái mới; không quyết toán bảo hiểm tại UI.
  const handleToggleInsurance = (item: ServiceCatalogItem) => {
    dispatchServiceCatalog({ payload: { id: item.id }, type: 'TOGGLE_INSURANCE' });
    showToast(
      item.coveredByHealthInsurance
        ? `Đã tắt bảo hiểm y tế cho dịch vụ ${item.name}`
        : `Đã bật bảo hiểm y tế cho dịch vụ ${item.name}`,
    );
  };

  // Xác nhận xóa: guard bản ghi chờ, dispatch DELETE cục bộ rồi đóng hộp thoại và báo thành công.
  const handleConfirmDelete = () => {
    if (!pendingDeleteItem) return;
    dispatchServiceCatalog({ payload: { id: pendingDeleteItem.id }, type: 'DELETE' });
    showToast(`Đã xóa dịch vụ ${pendingDeleteItem.name}`);
    setPendingDeleteItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className={styles.primaryButton} onClick={handleOpenCreateModal} type="button">
          <AdminIcon className="h-4 w-4" name="plus" />
          Thêm dịch vụ
        </button>
      </div>

      <CatalogTable
        catalogList={catalogList}
        onDeleteRequest={setPendingDeleteItem}
        onEditRequest={handleOpenEditModal}
        onToggleInsurance={handleToggleInsurance}
      />

      {modalMode !== 'closed' ? (
        <CatalogFormModal
          errors={fieldErrors}
          formValues={formValues}
          mode={modalMode}
          onCancel={handleCloseModal}
          onChange={handleChangeField}
          onSubmit={handleSubmit}
          onToggleInsuranceCheckbox={handleToggleInsuranceCheckbox}
        />
      ) : null}

      {pendingDeleteItem ? (
        <ConfirmDialog
          description={`Xóa dịch vụ "${pendingDeleteItem.name}"? Đây là dữ liệu demo, hành động không thể hoàn tác.`}
          onCancel={() => setPendingDeleteItem(null)}
          onConfirm={handleConfirmDelete}
          title="Xóa dịch vụ"
        />
      ) : null}
    </div>
  );
}
