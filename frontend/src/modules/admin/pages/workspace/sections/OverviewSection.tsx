import { SummaryCardGrid } from '../../../components/SummaryCard';
import { ToneBadge } from '../../../components/ToneBadge';
import type { AdminOverviewSnapshot } from '../../../types/admin.types';

type OverviewSectionProps = {
  snapshot: AdminOverviewSnapshot;
};

/**
 * Biểu đồ SVG lưu lượng bệnh nhân theo giờ.
 * @param points - Các điểm snapshot, `value` là số lượt và `hour` là nhãn giờ địa phương.
 * @remarks Không tự tải dữ liệu; khi không có điểm, trục vẫn giữ fallback tỷ lệ tối thiểu.
 */
function PatientFlowChart({ points }: { points: AdminOverviewSnapshot['hourlyPatientFlow'] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? 600 / (points.length - 1) : 0;
  const linePoints = points
    .map((point, index) => {
      const x = 40 + index * step;
      const y = 190 - (point.value / maxValue) * 150;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold leading-6 text-slate-800">Lưu lượng bệnh nhân theo giờ</h2>
      <div className="mt-5 overflow-hidden">
        <svg className="h-56 w-full" role="img" viewBox="0 0 680 220" aria-label="Biểu đồ lưu lượng bệnh nhân theo giờ">
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} stroke="#e2e8f0" strokeWidth="1" x1="40" x2="650" y1={y} y2={y} />
          ))}
          <polyline fill="none" points={linePoints} stroke="#006096" strokeWidth="4" />
          {points.map((point, index) => {
            const x = 40 + index * step;
            const y = 190 - (point.value / maxValue) * 150;
            return (
              <g key={`${point.hour}-${index}`}>
                <circle cx={x} cy={y} fill="#006096" r="5" />
                <text fill="#64748b" fontSize="11" textAnchor="middle" x={x} y="214">
                  {point.hour}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

/**
 * Bảng tải bệnh nhân theo khoa/phòng.
 * @param rows - Các hàng snapshot với trạng thái `normal`, `busy` hoặc `critical`.
 * @remarks Nhãn màu chỉ là trình bày; dữ liệu được component cha cung cấp và không có mutation tại đây.
 */
function DepartmentLoadTable({ rows }: { rows: AdminOverviewSnapshot['departmentLoad'] }) {
  const statusTone: Record<(typeof rows)[number]['status'], 'green' | 'amber' | 'red'> = {
    busy: 'amber',
    critical: 'red',
    normal: 'green',
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-50 p-6">
        <h2 className="text-base font-bold leading-6 text-slate-800">Tải bệnh nhân theo khoa</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase leading-4 text-slate-500">
            <tr>
              <th className="px-6 py-4">Khoa / phòng</th>
              <th className="px-6 py-4">Đang chờ</th>
              <th className="px-6 py-4">Hoàn tất</th>
              <th className="px-6 py-4">Tổng</th>
              <th className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.departmentName}>
                <td className="px-6 py-4 text-sm font-semibold leading-5 text-slate-800">{row.departmentName}</td>
                <td className="px-6 py-4 text-sm font-bold leading-5 text-slate-900">{row.waiting}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.completed}</td>
                <td className="px-6 py-4 text-sm leading-5 text-slate-600">{row.total}</td>
                <td className="px-6 py-4">
                  <ToneBadge label={row.statusLabel} tone={statusTone[row.status]} />
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
 * Màn hình tổng quan quản trị gồm KPI, lưu lượng theo giờ và tải theo khoa.
 * @param snapshot - Snapshot tổng hợp đã chuẩn hóa từ nguồn dữ liệu của workspace.
 * @remarks `SummaryCardGrid` hiển thị empty khi không có KPI; phần biểu đồ/bảng không có loading,
 * error hoặc forbidden riêng vì workspace hiện chỉ truyền dữ liệu mock/read-only.
 */
export function OverviewSection({ snapshot }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      <SummaryCardGrid cards={snapshot.kpiCards} />
      <PatientFlowChart points={snapshot.hourlyPatientFlow} />
      <DepartmentLoadTable rows={snapshot.departmentLoad} />
    </div>
  );
}
