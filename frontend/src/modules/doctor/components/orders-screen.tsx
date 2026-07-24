'use client';

import { useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { useLabTestTypes, useOrderLabTests } from '../services/medical-record-api';
import type { LabTestTypeOption, MedicalRecordDetail } from '../types/medical-record.types';
import { AssetIcon, cn } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

export function OrdersScreen({ record }: { record: MedicalRecordDetail }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<LabTestTypeOption[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: searchResults } = useLabTestTypes(searchTerm);
  const orderLabTests = useOrderLabTests(record.recordId);

  function addItem(item: LabTestTypeOption) {
    const isDuplicate =
      selected.some((entry) => entry.labTestTypeId === item.labTestTypeId) ||
      record.labTests.some((test) => test.testName === item.name);
    if (isDuplicate) {
      setWarningMessage('Dịch vụ đã có trong danh sách.');
      setSearchTerm('');
      return;
    }
    setWarningMessage(null);
    setSelected((current) => [...current, item]);
    setSearchTerm('');
  }

  function removeItem(labTestTypeId: string) {
    setSelected((current) => current.filter((entry) => entry.labTestTypeId !== labTestTypeId));
  }

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
      setSuccessMessage(`Đã gửi chỉ định lúc ${new Date().toLocaleTimeString('vi-VN')} — xem tiến độ ở Tab Kết quả CLS.`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể gửi chỉ định xét nghiệm.');
    }
  }

  const isEmpty = selected.length === 0 && record.labTests.length === 0;

  return (
    <section className={styles.card}>
      {successMessage && <div className={cn(styles.alertInfo, 'mb-4')}>{successMessage}</div>}
      <h2 className={styles.cardTitle}>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#e0f7fa]">
          <AssetIcon className="h-5 w-5" name="icon-lab-order.svg" />
        </span>
        Chỉ định dịch vụ xét nghiệm
      </h2>

      <div className="relative mt-6">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3px] text-[#707882]">
            Tìm dịch vụ cận lâm sàng
          </span>
          <span className="relative block">
            <AssetIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" name="icon-search.svg" />
            <input
              className="h-12 w-full rounded-[12px] border border-[#bfc7d2] bg-[#f2f3f8] pl-11 pr-4 text-sm outline-none placeholder:text-[#6b7280]"
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
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#f0f4f8]"
                key={item.labTestTypeId}
                onClick={() => addItem(item)}
                type="button"
              >
                <span>
                  <span className="block font-semibold text-[#171c1f]">{item.name}</span>
                  <span className="block text-xs text-[#707882]">{item.specimen ?? 'Chưa xác định loại mẫu'}</span>
                </span>
                <span className="text-xs font-bold text-[#006096]">{Number(item.price).toLocaleString('vi-VN')}đ</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {warningMessage && <p className={cn(styles.alertDanger, 'mt-4')}>{warningMessage}</p>}

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
                <tr key={item.labTestTypeId}>
                  <td className={styles.td}>{index + 1}</td>
                  <td className={cn(styles.td, 'font-bold text-[#001d32]')}>{item.name}</td>
                  <td className={styles.td}>{item.specimen ?? '—'}</td>
                  <td className={styles.td}>
                    <span className={styles.statusPending}>Chưa gửi</span>
                  </td>
                  <td className={styles.td}>
                    <button
                      className="text-xs font-bold text-[#ba1a1a]"
                      onClick={() => removeItem(item.labTestTypeId)}
                      type="button"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {record.labTests.map((test, index) => (
                <tr key={test.labTestId}>
                  <td className={styles.td}>{selected.length + index + 1}</td>
                  <td className={cn(styles.td, 'font-bold text-[#001d32]')}>{test.testName}</td>
                  <td className={styles.td}>—</td>
                  <td className={styles.td}>
                    <span className={test.status === 'resulted' ? styles.statusNormal : styles.statusPending}>
                      {test.status === 'resulted' ? 'Có kết quả' : 'Đã chỉ định'}
                    </span>
                  </td>
                  <td className={styles.td}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorMessage && <p className={cn(styles.alertDanger, 'mt-4')}>{errorMessage}</p>}

      <div className="mt-6 flex justify-end">
        <button
          className={cn(styles.primaryButton, (selected.length === 0 || orderLabTests.isPending) && 'opacity-60')}
          disabled={selected.length === 0 || orderLabTests.isPending}
          onClick={handleSubmit}
          type="button"
        >
          {orderLabTests.isPending ? 'Đang gửi...' : 'Gửi chỉ định xét nghiệm'}
        </button>
      </div>
    </section>
  );
}
