import type { KpiCard } from '../types/admin.types';

type SummaryCardViewProps = {
  card: KpiCard;
};

const valueClassByTone: Record<KpiCard['tone'], string> = {
  amber: 'text-amber-700',
  green: 'text-green-700',
  red: 'text-red-600',
  slate: 'text-slate-800',
  sky: 'text-sky-700',
  teal: 'text-teal-700',
};

/**
 * Thẻ KPI đơn lẻ dùng chung cho tổng quan và doanh thu.
 * @param card - KPI đã được chuẩn hóa; `value` là chuỗi hiển thị, có thể đã có đơn vị tiền.
 * @remarks Thẻ chỉ trình bày snapshot, không tự tải dữ liệu hoặc tính lại giá trị.
 */
export function SummaryCardView({ card }: SummaryCardViewProps) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase leading-4 text-slate-500">{card.label}</p>
      <p className={`mt-2 text-3xl font-bold leading-9 ${valueClassByTone[card.tone]}`}>{card.value}</p>
      <p className="mt-3 border-t border-slate-50 pt-3 text-xs text-slate-400">{card.helper}</p>
    </article>
  );
}

/**
 * Lưới thẻ KPI, tái sử dụng ở Overview và Doanh thu/Giường bệnh.
 * @param cards - Danh sách KPI; khi rỗng hiển thị trạng thái empty.
 */
export function SummaryCardGrid({ cards }: { cards: KpiCard[] }) {
  if (!cards.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chưa có chỉ số tổng hợp.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCardView card={card} key={card.id} />
      ))}
    </div>
  );
}
