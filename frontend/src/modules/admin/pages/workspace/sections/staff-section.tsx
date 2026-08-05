'use client';

import { useState, type Dispatch, type FormEvent } from 'react';

import { AdminIcon } from '../../../components/admin-icon';
import { AdminModal } from '../../../components/admin-modal';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { FormField, getFormFieldInputClassName } from '../../../components/form-field';
import { ToneBadge } from '../../../components/tone-badge';
import { departmentLabelByCode, roleLabelByCode } from '../../../constants/admin-mock.data';
import type { StaffDirectoryAction } from '../../../hooks/use-staff-directory';
import {
  emptyStaffFormValues,
  getStaffFormFieldErrors,
  isStaffUsernameTaken,
  staffFormSchema,
  toStaffFormValues,
  type StaffFormFieldErrors,
} from '../../../types/admin-staff-form.schema';
import type { DepartmentCode, RoleCode, StaffFormValues, StaffMember } from '../../../types/admin.types';
import { adminWorkspaceStyles as styles } from '../admin-workspace.styles';

type StaffSectionProps = {
  dispatchStaffDirectory: Dispatch<StaffDirectoryAction>;
  showToast: (message: string, tone?: 'success' | 'error') => void;
  staffList: StaffMember[];
};

type ModalMode = 'closed' | 'create' | 'edit';

const formatLastLogin = (value: string | null) => {
  if (!value) return 'Chưa đăng nhập';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

function StaffTable({
  onDeleteRequest,
  onEditRequest,
  onToggleStatus,
  staffList,
}: {
  onDeleteRequest: (staff: StaffMember) => void;
  onEditRequest: (staff: StaffMember) => void;
  onToggleStatus: (staff: StaffMember) => void;
  staffList: StaffMember[];
}) {
  if (!staffList.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chưa có nhân viên nào.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              <th className="px-6 py-4">Họ tên</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Khoa / phòng</th>
              <th className="px-6 py-4">Đăng nhập gần nhất</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staffList.map((staff) => (
              <tr key={staff.id}>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">{staff.fullName}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{staff.username}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{roleLabelByCode[staff.roleCode]}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">
                  {departmentLabelByCode[staff.departmentCode]}
                </td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-500">
                  {formatLastLogin(staff.lastLoginAt)}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => onToggleStatus(staff)} type="button">
                    <ToneBadge
                      label={staff.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                      tone={staff.status === 'active' ? 'green' : 'red'}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className={`${styles.iconButton} h-8 w-8`}
                      onClick={() => onEditRequest(staff)}
                      title="Sửa nhân viên"
                      type="button"
                    >
                      <AdminIcon className="h-4 w-4" name="edit" />
                    </button>
                    <button
                      className={`${styles.iconButton} h-8 w-8 border-red-100 text-red-600 hover:bg-red-50`}
                      onClick={() => onDeleteRequest(staff)}
                      title="Xóa nhân viên"
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

function StaffFormModal({
  errors,
  formValues,
  mode,
  onCancel,
  onChange,
  onSubmit,
}: {
  errors: StaffFormFieldErrors;
  formValues: StaffFormValues;
  mode: ModalMode;
  onCancel: () => void;
  onChange: (field: keyof StaffFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <AdminModal
      description="Điền đầy đủ thông tin. Đây là dữ liệu demo, không lưu vào hệ thống thật."
      onClose={onCancel}
      title={mode === 'create' ? 'Thêm nhân viên' : 'Sửa thông tin nhân viên'}
      titleId="admin-staff-form-title"
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.fullName?.[0]} htmlFor="fullName" label="Họ và tên" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.fullName?.[0]))}
              id="fullName"
              onChange={(event) => onChange('fullName', event.target.value)}
              value={formValues.fullName}
            />
          </FormField>
          <FormField error={errors.username?.[0]} htmlFor="username" label="Tên đăng nhập (Username)" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.username?.[0]))}
              id="username"
              onChange={(event) => onChange('username', event.target.value)}
              value={formValues.username}
            />
          </FormField>
        </div>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.phoneNumber?.[0]} htmlFor="phoneNumber" label="Số điện thoại" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.phoneNumber?.[0]))}
              id="phoneNumber"
              onChange={(event) => onChange('phoneNumber', event.target.value)}
              value={formValues.phoneNumber}
            />
          </FormField>
          <FormField
            error={errors.identityCardNumber?.[0]}
            htmlFor="identityCardNumber"
            label="Số CCCD (12 số)"
            required
          >
            <input
              className={getFormFieldInputClassName(Boolean(errors.identityCardNumber?.[0]))}
              id="identityCardNumber"
              onChange={(event) => onChange('identityCardNumber', event.target.value)}
              value={formValues.identityCardNumber}
            />
          </FormField>
        </div>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.dateOfBirth?.[0]} htmlFor="dateOfBirth" label="Ngày sinh" required>
            <input
              className={getFormFieldInputClassName(Boolean(errors.dateOfBirth?.[0]))}
              id="dateOfBirth"
              onChange={(event) => onChange('dateOfBirth', event.target.value)}
              type="date"
              value={formValues.dateOfBirth}
            />
          </FormField>
          <FormField error={errors.gender?.[0]} htmlFor="gender" label="Giới tính" required>
            <select
              className={getFormFieldInputClassName(Boolean(errors.gender?.[0]))}
              id="gender"
              onChange={(event) => onChange('gender', event.target.value)}
              value={formValues.gender}
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </FormField>
        </div>
        <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField error={errors.roleCode?.[0]} htmlFor="roleCode" label="Vai trò" required>
            <select
              className={getFormFieldInputClassName(Boolean(errors.roleCode?.[0]))}
              id="roleCode"
              onChange={(event) => onChange('roleCode', event.target.value)}
              value={formValues.roleCode}
            >
              <option value="">-- Chọn vai trò --</option>
              {(Object.keys(roleLabelByCode) as RoleCode[]).map((code) => (
                <option key={code} value={code}>
                  {roleLabelByCode[code]}
                </option>
              ))}
            </select>
          </FormField>
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
            {mode === 'create' ? '✓ Thêm nhân viên' : '✓ Lưu thay đổi'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/**
 * Đọc dữ liệu form nhân viên đã qua zod và build StaffMember hoàn chỉnh cho hành động thêm mới.
 */
const buildNewStaffMember = (parsed: {
  dateOfBirth: string;
  departmentCode: DepartmentCode;
  fullName: string;
  gender: 'male' | 'female';
  identityCardNumber: string;
  phoneNumber: string;
  roleCode: RoleCode;
  username: string;
}): StaffMember => ({
  ...parsed,
  createdAt: new Date().toISOString(),
  id: crypto.randomUUID(),
  lastLoginAt: null,
  status: 'active',
});

/** Màn hình quản lý nhân sự & phân quyền: bảng danh sách + thêm/sửa/xóa/khóa trên state cục bộ. */
export function StaffSection({ dispatchStaffDirectory, showToast, staffList }: StaffSectionProps) {
  const [modalMode, setModalMode] = useState<ModalMode>('closed');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<StaffFormValues>(emptyStaffFormValues);
  const [fieldErrors, setFieldErrors] = useState<StaffFormFieldErrors>({});
  const [pendingDeleteStaff, setPendingDeleteStaff] = useState<StaffMember | null>(null);

  const handleOpenCreateModal = () => {
    setEditingStaffId(null);
    setFormValues(emptyStaffFormValues);
    setFieldErrors({});
    setModalMode('create');
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setFormValues(toStaffFormValues(staff));
    setFieldErrors({});
    setModalMode('edit');
  };

  const handleCloseModal = () => setModalMode('closed');

  const handleChangeField = (field: keyof StaffFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = staffFormSchema.safeParse(formValues);
    if (!result.success) {
      setFieldErrors(getStaffFormFieldErrors(result.error));
      return;
    }

    if (isStaffUsernameTaken(staffList, result.data.username, editingStaffId ?? undefined)) {
      setFieldErrors((current) => ({ ...current, username: ['Username đã tồn tại'] }));
      return;
    }

    if (modalMode === 'create') {
      dispatchStaffDirectory({ payload: buildNewStaffMember(result.data), type: 'ADD' });
      showToast(`Đã thêm nhân viên ${result.data.fullName}`);
    } else if (editingStaffId) {
      dispatchStaffDirectory({ payload: { changes: result.data, id: editingStaffId }, type: 'UPDATE' });
      showToast(`Đã cập nhật nhân viên ${result.data.fullName}`);
    }

    handleCloseModal();
  };

  const handleToggleStatus = (staff: StaffMember) => {
    dispatchStaffDirectory({ payload: { id: staff.id }, type: 'TOGGLE_STATUS' });
    showToast(
      staff.status === 'active'
        ? `Đã khóa tài khoản ${staff.username}`
        : `Đã mở khóa tài khoản ${staff.username}`,
    );
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteStaff) return;
    dispatchStaffDirectory({ payload: { id: pendingDeleteStaff.id }, type: 'DELETE' });
    showToast(`Đã xóa nhân viên ${pendingDeleteStaff.fullName}`);
    setPendingDeleteStaff(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className={styles.primaryButton} onClick={handleOpenCreateModal} type="button">
          <AdminIcon className="h-4 w-4" name="plus" />
          Thêm nhân viên
        </button>
      </div>

      <StaffTable
        onDeleteRequest={setPendingDeleteStaff}
        onEditRequest={handleOpenEditModal}
        onToggleStatus={handleToggleStatus}
        staffList={staffList}
      />

      {modalMode !== 'closed' ? (
        <StaffFormModal
          errors={fieldErrors}
          formValues={formValues}
          mode={modalMode}
          onCancel={handleCloseModal}
          onChange={handleChangeField}
          onSubmit={handleSubmit}
        />
      ) : null}

      {pendingDeleteStaff ? (
        <ConfirmDialog
          description={`Xóa nhân viên "${pendingDeleteStaff.fullName}"? Đây là dữ liệu demo, hành động không thể hoàn tác.`}
          onCancel={() => setPendingDeleteStaff(null)}
          onConfirm={handleConfirmDelete}
          title="Xóa nhân viên"
        />
      ) : null}
    </div>
  );
}
