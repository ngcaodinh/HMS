import { useState } from 'react';

import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import {
  useCreateReferenceRange,
  useDeleteReferenceRange,
  useLabActivityStats,
  useLabTestTypes,
  useReferenceRanges,
  useUpdateReferenceRangeDetail,
} from '../services/lab-test-api';
import type { ReferenceRangeRow } from '../types/lab-test.types';
import { AssetIcon, cn } from './shared';

const CONDITION_LABELS: Record<string, string> = { all: 'Tất cả', male: 'Nam', female: 'Nữ' };

function StatCards({ period }: { period: 'today' | 'week' | 'month' }) {
  const { data: stats, isLoading } = useLabActivityStats({ period });

  const cards = [
    { label: 'Tổng mẫu đã tiếp nhận', value: stats?.totalReceived ?? 0, color: '#dbeafe', icon: 'icon-lab-order.svg' },
    { label: 'Mẫu hoàn thành (đã ký)', value: stats?.totalCompleted ?? 0, color: '#d4f0e0', icon: 'icon-lab-result.svg' },
    { label: 'Ca cấp cứu hoàn thành', value: stats?.urgentCompleted ?? 0, color: '#fee2e2', icon: 'icon-close.svg' },
    { label: 'TAT trung bình (phút)', value: stats?.averageTatMinutes ?? 0, color: '#ffecd4', icon: 'icon-save.svg' },
  ];

  return (
    <div className={styles.statGrid}>
      {cards.map((card) => (
        <div className={styles.statCard} key={card.label}>
          <div className={styles.statIconWrap} style={{ background: card.color }}>
            <AssetIcon className="h-5 w-5" name={card.icon} />
          </div>
          <div>
            <p className={styles.statValue}>{isLoading ? '—' : card.value}</p>
            <p className={styles.statLabel}>{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HourlyChart({ period }: { period: 'today' | 'week' | 'month' }) {
  const { data: stats } = useLabActivityStats({ period });
  const distribution = stats?.hourlyDistribution ?? [];
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div>
      <p className={styles.formSectionTitle}>Phân bố mẫu xét nghiệm theo giờ trong ngày</p>
      <div className={styles.barChartWrap}>
        {distribution.map((point) => (
          <div className="flex flex-1 flex-col items-center" key={point.hour}>
            <div className={styles.barChartBar} style={{ height: `${(point.count / max) * 100}%`, minHeight: point.count > 0 ? '4px' : '1px' }} />
            {point.hour % 4 === 0 && <p className={styles.barChartAxisLabel}>{point.hour}h</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableRow({ row }: { row: ReferenceRangeRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [lowerBound, setLowerBound] = useState(row.lowerBound ?? '');
  const [upperBound, setUpperBound] = useState(row.upperBound ?? '');
  const [unit, setUnit] = useState(row.unit ?? '');
  const updateMutation = useUpdateReferenceRangeDetail();
  const deleteMutation = useDeleteReferenceRange();

  function save() {
    updateMutation.mutate(
      { referenceRangeId: row.referenceRangeId, lowerBound: lowerBound || undefined, upperBound: upperBound || undefined, unit: unit || undefined },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  return (
    <tr>
      <td className={styles.td}>
        <p className="font-semibold">{row.code}</p>
        <p className="text-xs text-[#707882]">{row.labTestTypeName}</p>
      </td>
      <td className={styles.td}>
        {row.label}
        {row.condition !== 'all' && <span className={cn(styles.chip, styles.chipNeutral, 'ml-1.5')}>{CONDITION_LABELS[row.condition]}</span>}
      </td>
      <td className={styles.td}>
        {isEditing ? <input className={styles.input} onChange={(e) => setUnit(e.target.value)} value={unit} /> : row.unit ?? '—'}
      </td>
      <td className={styles.td}>
        {isEditing ? <input className={styles.input} onChange={(e) => setLowerBound(e.target.value)} value={lowerBound} /> : row.lowerBound ?? '—'}
      </td>
      <td className={styles.td}>
        {isEditing ? <input className={styles.input} onChange={(e) => setUpperBound(e.target.value)} value={upperBound} /> : row.upperBound ?? '—'}
      </td>
      <td className={styles.td}>{CONDITION_LABELS[row.condition]}</td>
      <td className={styles.td}>
        {isEditing ? (
          <div className="flex gap-2">
            <button className={styles.mutedButton} onClick={() => setIsEditing(false)} type="button">
              Hủy
            </button>
            <button className={styles.smallPrimaryButton} disabled={updateMutation.isPending} onClick={save} type="button">
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className={styles.outlineButton} onClick={() => setIsEditing(true)} type="button">
              Chỉnh sửa
            </button>
            <button
              className={styles.mutedButton}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(row.referenceRangeId)}
              type="button"
            >
              Xoá
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function CreateRangeForm({ onDone }: { onDone: () => void }) {
  const { data: types } = useLabTestTypes();
  const createMutation = useCreateReferenceRange();
  const [form, setForm] = useState({
    labTestTypeId: '',
    fieldKey: '',
    code: '',
    label: '',
    unit: '',
    lowerBound: '',
    upperBound: '',
    condition: 'all' as 'all' | 'male' | 'female',
  });

  function submit() {
    if (!form.labTestTypeId || !form.fieldKey || !form.code || !form.label) return;
    createMutation.mutate(
      {
        labTestTypeId: form.labTestTypeId,
        fieldKey: form.fieldKey,
        code: form.code,
        label: form.label,
        unit: form.unit || undefined,
        lowerBound: form.lowerBound || undefined,
        upperBound: form.upperBound || undefined,
        condition: form.condition,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="mb-5 rounded-[10px] border border-[#bfc7d2] bg-[#f8fafc] p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className={styles.select} onChange={(e) => setForm({ ...form, labTestTypeId: e.target.value })} value={form.labTestTypeId}>
          <option value="">— Loại xét nghiệm —</option>
          {(types ?? []).map((type) => (
            <option key={type.labTestTypeId} value={type.labTestTypeId}>
              {type.name}
            </option>
          ))}
        </select>
        <input className={styles.input} onChange={(e) => setForm({ ...form, fieldKey: e.target.value })} placeholder="fieldKey (vd: ure)" value={form.fieldKey} />
        <input className={styles.input} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Mã (vd: HSM-039)" value={form.code} />
        <input className={styles.input} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Tên chỉ số" value={form.label} />
        <input className={styles.input} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Đơn vị" value={form.unit} />
        <input className={styles.input} onChange={(e) => setForm({ ...form, lowerBound: e.target.value })} placeholder="Ngưỡng dưới" value={form.lowerBound} />
        <input className={styles.input} onChange={(e) => setForm({ ...form, upperBound: e.target.value })} placeholder="Ngưỡng trên" value={form.upperBound} />
        <select
          className={styles.select}
          onChange={(e) => setForm({ ...form, condition: e.target.value as typeof form.condition })}
          value={form.condition}
        >
          <option value="all">Tất cả</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className={styles.mutedButton} onClick={onDone} type="button">
          Hủy
        </button>
        <button className={styles.smallPrimaryButton} disabled={createMutation.isPending} onClick={submit} type="button">
          {createMutation.isPending ? 'Đang lưu...' : 'Lưu trị số mới'}
        </button>
      </div>
    </div>
  );
}

export function ReferenceRangeConfig() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [keyword, setKeyword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data, isLoading } = useReferenceRanges({ keyword: keyword || undefined });
  const rows = data?.data ?? [];

  return (
    <div>
      <div className={styles.searchRow}>
        {(['today', 'week', 'month'] as const).map((option) => (
          <button
            className={cn(styles.filterTab, period === option && styles.filterTabActive)}
            key={option}
            onClick={() => setPeriod(option)}
            type="button"
          >
            {option === 'today' ? 'Hôm nay' : option === 'week' ? 'Tuần này' : 'Tháng này'}
          </button>
        ))}
      </div>

      <StatCards period={period} />
      <HourlyChart period={period} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardTitle}>Bảng trị số tham chiếu bình thường</p>
            <p className="mt-1 text-xs text-[#707882]">Quản lý ngưỡng so sánh kết quả xét nghiệm — chỉ kỹ thuật viên xét nghiệm và quản trị viên mới được cập nhật.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className={styles.searchInput}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm chỉ số..."
              value={keyword}
            />
            <button className={styles.primaryButton} onClick={() => setIsCreating((v) => !v)} type="button">
              + Cập nhật trị số
            </button>
          </div>
        </div>

        {isCreating && <CreateRangeForm onDone={() => setIsCreating(false)} />}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Mã chỉ số</th>
                <th className={styles.th}>Tên xét nghiệm</th>
                <th className={styles.th}>Đơn vị</th>
                <th className={styles.th}>Ngưỡng dưới</th>
                <th className={styles.th}>Ngưỡng trên</th>
                <th className={styles.th}>Điều kiện</th>
                <th className={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {isLoading && (
                <tr>
                  <td className={styles.td} colSpan={7}>
                    Đang tải...
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={7}>
                    Chưa có trị số tham chiếu nào phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading && rows.map((row) => <EditableRow key={row.referenceRangeId} row={row} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
