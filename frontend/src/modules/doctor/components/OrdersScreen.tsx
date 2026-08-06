'use client';

import { useState } from 'react';

import { ApiError } from '@/shared/api-client';
import {
  useLabTestTypes,
  useOrderLabTests,
  useRefreshMedicalRecord,
} from '../services/medical-record-api';
import type { LabTestTypeOption, MedicalRecordDetail } from '../types/medical-record.types';
import { DoctorFeedbackModal } from './DoctorFeedbackModal';
import { AssetIcon, cn } from './SharedComponents';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

/**
 * Tìm, chọn và gửi các dịch vụ xét nghiệm cho hồ sơ đang được bác sĩ mở.
 *
 * Danh mục dịch vụ là server state từ `GET /lab-test-types`; các mục chưa gửi, warning, lỗi và
 * success là local state. Mutation `POST /medical-records/:recordId/lab-tests` gửi các ID đã chọn
 * theo version hồ sơ và refresh detail sau thành công. Bảng phân biệt draft `Chưa gửi` với trạng
 * thái server `Đã chỉ định`, `Đang thực hiện` và `Có kết quả`; hồ sơ đóng bị khóa, trạng thái rỗng
 * và lỗi hiển thị trong UI/modal. Khả năng hiển thị này không thay thế authorization/backend gate.
 *
 * @param record Detail hồ sơ server gồm version, status và các lab test đã có.
 * @returns Giao diện tìm dịch vụ, quản lý draft và submit chỉ định.
 */
export function OrdersScreen({ record }: { record: MedicalRecordDetail }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<LabTestTypeOption[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: searchResults } = useLabTestTypes(searchTerm);
  const orderLabTests = useOrderLabTests(record.recordId);
  const refreshRecord = useRefreshMedicalRecord(record.recordId);
  const isClosed = record.status === 'closed';

  /**
   * Thêm một dịch vụ vào draft sau khi kiểm tra hồ sơ mở, trùng mục và giới hạn batch.
   * @param item Dịch vụ xét nghiệm lấy từ catalog server.
   */
  function addItem(item: LabTestTypeOption) {
    if (isClosed) return;
    const isDuplicate =
      selected.some((entry) => entry.labTestTypeId === item.labTestTypeId) ||
      record.labTests.some((test) => test.testName === item.name);
    if (isDuplicate) {
      setWarningMessage('Dịch vụ đã có trong danh sách.');
      setSearchTerm('');
      return;
    }
    // Giới hạn 20 mục giúp giới hạn batch ở UI; backend vẫn là nguồn quyết định cuối cùng.
    if (selected.length >= 20) {
      setWarningMessage('Chỉ được chọn tối đa 20 chỉ định trong một lần gửi.');
      setSearchTerm('');
      return;
    }
    setWarningMessage(null);
    setSelected((current) => [...current, item]);
    setSearchTerm('');
  }

  /** Xóa một mục khỏi draft local; không sửa các lab test đã tồn tại trên server. */
  function removeItem(labTestTypeId: string) {
    if (isClosed) return;
    setSelected((current) => current.filter((entry) => entry.labTestTypeId !== labTestTypeId));
  }

  /**
   * Xử lý click nút gửi draft chỉ định, xử lý thành công/lỗi và refresh detail khi version
   * conflict.
   * Guard local yêu cầu ít nhất một mục; lỗi nghiệp vụ/API hiển thị qua modal feedback.
   */
  async function handleSubmit() {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (selected.length === 0) {
      setErrorMessage('Thêm ít nhất 1 chỉ định trước khi gửi.');
      return;
    }
    try {
      await orderLabTests.mutateAsync({
        expectedRecordVersion: record.version,
        items: selected.map((item) => ({ labTestTypeId: item.labTestTypeId })),
      });
      setSelected([]);
      setSuccessMessage(
        `Đã gửi chỉ định lúc ${new Date().toLocaleTimeString('vi-VN')} — xem tiến độ ở Tab Kết quả CLS.`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VERSION_CONFLICT') {
        await refreshRecord();
        setErrorMessage(
          'Hồ sơ vừa được cập nhật bởi thao tác khác — dữ liệu đã được tải lại, vui lòng kiểm tra và gửi lại chỉ định.',
        );
        return;
      }
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Không thể gửi chỉ định xét nghiệm.',
      );
    }
  }

  const isEmpty = selected.length === 0 && record.labTests.length === 0;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#e0f7fa]">
          <AssetIcon className="h-5 w-5" name="icon-lab-order.svg" />
        </span>
        Chỉ định dịch vụ xét nghiệm
      </h2>

      {isClosed && (
        <p className={cn(styles.alertDanger, 'mt-4')}>Hồ sơ đã đóng, không thể thêm chỉ định.</p>
      )}

      <div className="relative mt-6">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3px] text-[#707882]">
            Tìm dịch vụ cận lâm sàng
          </span>
          <span className="relative block">
            <AssetIcon
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
              name="icon-search.svg"
            />
            <input
              className={styles.searchInputLg}
              disabled={isClosed}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Gõ tên dịch vụ (VD: Hóa sinh máu, IgE...)"
              value={searchTerm}
            />
          </span>
        </label>
        {searchTerm && (searchResults?.length ?? 0) > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-[12px] border border-[#bfc7d2] bg-white shadow-lg">
            {searchResults?.map((item) => (
              <button
                className={styles.searchResultItem}
                disabled={isClosed}
                key={item.labTestTypeId}
                onClick={() => addItem(item)}
                type="button"
              >
                <span>
                  <span className="block font-semibold text-[#171c1f]">{item.name}</span>
                  <span className="block text-xs text-[#707882]">
                    {item.specimen ?? 'Chưa xác định loại mẫu'}
                  </span>
                </span>
                <span className="text-xs font-bold text-[#006096]">
                  {Number(item.price).toLocaleString('vi-VN')}đ
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>STT</th>
                <th className={styles.th}>Tên dịch vụ</th>
                <th className={styles.th}>Loại mẫu</th>
                <th className={styles.th}>Trạng thái</th>
                <th className={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7] bg-white">
              {isEmpty && (
                <tr>
                  <td className="px-4 py-5 text-center text-sm text-[#707882]" colSpan={5}>
                    Chưa có chỉ định. Tìm và chọn dịch vụ phía trên.
                  </td>
                </tr>
              )}
              {selected.map((item, index) => (
                <tr className={styles.tableRow} key={item.labTestTypeId}>
                  <td className={styles.td}>{index + 1}</td>
                  <td className={cn(styles.td, 'font-bold text-[#001d32]')}>{item.name}</td>
                  <td className={styles.td}>{item.specimen ?? '—'}</td>
                  <td className={styles.td}>
                    <span className={styles.statusPending}>Chưa gửi</span>
                  </td>
                  <td className={styles.td}>
                    <button
                      className={styles.dangerLink}
                      disabled={isClosed}
                      onClick={() => removeItem(item.labTestTypeId)}
                      type="button"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {record.labTests.map((test, index) => (
                <tr className={styles.tableRow} key={test.labTestId}>
                  <td className={styles.td}>{selected.length + index + 1}</td>
                  <td className={cn(styles.td, 'font-bold text-[#001d32]')}>{test.testName}</td>
                  <td className={styles.td}>{test.specimenType ?? '—'}</td>
                  <td className={styles.td}>
                    <span
                      className={
                        test.status === 'resulted' ? styles.statusNormal : styles.statusPending
                      }
                    >
                      {test.status === 'resulted'
                        ? 'Có kết quả'
                        : test.status === 'in_progress'
                          ? 'Đang thực hiện'
                          : 'Đã chỉ định'}
                    </span>
                  </td>
                  <td className={styles.td}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        {selected.length === 0 && !isClosed && (
          <p className="mr-auto self-center text-xs text-[#707882]">
            Chọn ít nhất 1 dịch vụ để bật nút gửi chỉ định.
          </p>
        )}
        <button
          className={cn(
            styles.primaryButton,
            (selected.length === 0 || orderLabTests.isPending || isClosed) && 'opacity-60',
          )}
          disabled={selected.length === 0 || orderLabTests.isPending || isClosed}
          onClick={handleSubmit}
          type="button"
        >
          {orderLabTests.isPending ? 'Đang gửi...' : 'Gửi chỉ định xét nghiệm'}
        </button>
      </div>

      {warningMessage && (
        <DoctorFeedbackModal
          message={warningMessage}
          onClose={() => setWarningMessage(null)}
          title="Kiểm tra chỉ định"
          tone="info"
        />
      )}
      {errorMessage && (
        <DoctorFeedbackModal
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
          title="Không thể gửi chỉ định"
        />
      )}
      {successMessage && (
        <DoctorFeedbackModal
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          title="Đã gửi chỉ định"
          tone="success"
        />
      )}
    </section>
  );
}
