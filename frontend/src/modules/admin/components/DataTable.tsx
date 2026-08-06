import type { ReactNode } from 'react';

/**
 * Cột của `DataTable`; `render` quyết định nội dung ô theo từng dòng dữ liệu.
 * `key` cần ổn định và duy nhất trong danh sách cột để React định danh header/cell.
 */
export type DataTableColumn<T> = {
  className?: string;
  header: string;
  key: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  emptyLabel?: string;
  rowKey: (row: T) => string;
  rows: T[];
  title?: string;
};

/**
 * Bảng dữ liệu tổng quát dùng chung cho các màn hình trong module Admin.
 * @param columns - Cấu hình cột và hàm render nội dung ô.
 * @param emptyLabel - Fallback khi `rows` rỗng, mặc định là `Chưa có dữ liệu.`.
 * @param rowKey - Hàm lấy khóa ổn định cho mỗi dòng.
 * @param rows - Danh sách dữ liệu cần hiển thị.
 * @param title - Tiêu đề tùy chọn của bảng.
 * @remarks Component chỉ render dữ liệu; loading, error, quyền truy cập và mutation do component cha quản lý.
 */
export function DataTable<T>({
  columns,
  emptyLabel = 'Chưa có dữ liệu.',
  rowKey,
  rows,
  title,
}: DataTableProps<T>) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      {title ? (
        <div className="border-b border-slate-100 p-6">
          <h3 className="text-base font-bold leading-6 text-slate-800">{title}</h3>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">{emptyLabel}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th className="px-6 py-4" key={column.key}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td
                      className={column.className ?? 'px-6 py-4 text-sm leading-5 text-slate-700'}
                      key={column.key}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
