import { useState } from 'react';

import { AppToast } from '@/shared/components/app-toast';
import { useAppToast } from '@/shared/hooks/use-app-toast';

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
import {
  getReferenceRangeFormErrors,
  REFERENCE_RANGE_FIELDS,
} from '../validation/reference-range-validation';
import { AssetIcon, cn } from './shared';

const CONDITION_LABELS: Record<string, string> = { all: 'Tất cả', male: 'Nam', female: 'Nữ' };

function InlineError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-[11px] font-medium text-[#ba1a1a]" role="alert">
      {message}
    </p>
  ) : null;
}

function StatCards({ period }: { period: 'today' | 'week' | 'month' }) {
  const { data: stats, isLoading } = useLabActivityStats({ period });

  const cards = [
    {
      label: 'Tổng mẫu đã tiếp nhận',
      value: stats?.totalReceived ?? 0,
      color: '#dbeafe',
      icon: 'icon-lab-order.svg',
      isNeutral: true,
    },
    {
      label: 'Mẫu hoàn thành (đã ký)',
      value: stats?.totalCompleted ?? 0,
      color: '#d4f0e0',
      icon: 'icon-lab-result.svg',
      isNeutral: true,
    },
    {
      label: 'Ca cấp cứu hoàn thành',
      value: stats?.urgentCompleted ?? 0,
      color: '#fee2e2',
      icon: 'icon-alert.svg',
      isNeutral: false,
    },
    {
      label: 'TAT trung bình (phút)',
      value: stats?.averageTatMinutes ?? 0,
      color: '#ffecd4',
      icon: 'icon-save.svg',
      isNeutral: true,
    },
  ];

  return (
    <div className={styles.statGrid}>
      {cards.map((card) => (
        <div className={styles.statCard} key={card.label}>
          <div className={styles.statIconWrap} style={{ background: card.color }}>
            <AssetIcon
              className={cn('h-5 w-5', card.isNeutral && 'brightness-0')}
              name={card.icon}
            />
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
            <div
              className={styles.barChartBar}
              style={{
                height: `${(point.count / max) * 100}%`,
                minHeight: point.count > 0 ? '4px' : '1px',
              }}
            />
            {point.hour % 4 === 0 && <p className={styles.barChartAxisLabel}>{point.hour}h</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableRow({
  canManage,
  onNotify,
  row,
}: {
  canManage: boolean;
  onNotify: (message: string) => void;
  row: ReferenceRangeRow;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [lowerBound, setLowerBound] = useState(row.lowerBound ?? '');
  const [upperBound, setUpperBound] = useState(row.upperBound ?? '');
  const [unit, setUnit] = useState(row.unit ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateMutation = useUpdateReferenceRangeDetail();
  const deleteMutation = useDeleteReferenceRange();

  function validateBounds(nextLowerBound: string, nextUpperBound: string) {
    const lower = nextLowerBound.trim() ? Number(nextLowerBound) : undefined;
    const upper = nextUpperBound.trim() ? Number(nextUpperBound) : undefined;
    const nextErrors: Record<string, string> = {};
    if (lower !== undefined && !Number.isFinite(lower))
      nextErrors.lowerBound = 'Ngưỡng dưới phải là số hợp lệ.';
    if (upper !== undefined && !Number.isFinite(upper))
      nextErrors.upperBound = 'Ngưỡng trên phải là số hợp lệ.';
    if (
      lower !== undefined &&
      upper !== undefined &&
      Number.isFinite(lower) &&
      Number.isFinite(upper) &&
      lower >= upper
    ) {
      nextErrors.upperBound = 'Ngưỡng trên phải lớn hơn ngưỡng dưới.';
    }
    setErrors(nextErrors);
  }

  function save() {
    const lower = lowerBound.trim() ? Number(lowerBound) : undefined;
    const upper = upperBound.trim() ? Number(upperBound) : undefined;
    const nextErrors: Record<string, string> = {};
    if (lower !== undefined && !Number.isFinite(lower))
      nextErrors.lowerBound = 'Ngưỡng dưới phải là số hợp lệ.';
    if (upper !== undefined && !Number.isFinite(upper))
      nextErrors.upperBound = 'Ngưỡng trên phải là số hợp lệ.';
    if (
      lower !== undefined &&
      upper !== undefined &&
      Number.isFinite(lower) &&
      Number.isFinite(upper) &&
      lower >= upper
    ) {
      nextErrors.upperBound = 'Ngưỡng trên phải lớn hơn ngưỡng dưới.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    updateMutation.mutate(
      {
        referenceRangeId: row.referenceRangeId,
        lowerBound: lowerBound || undefined,
        upperBound: upperBound || undefined,
        unit: unit || undefined,
      },
      {
        onError: () => onNotify('Không thể cập nhật trị số tham chiếu.'),
        onSuccess: () => setIsEditing(false),
      },
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
        {row.condition !== 'all' && (
          <span className={cn(styles.chip, styles.chipNeutral, 'ml-1.5')}>
            {CONDITION_LABELS[row.condition]}
          </span>
        )}
      </td>
      <td className={styles.td}>
        {canManage && isEditing ? (
          <input className={styles.input} onChange={(e) => setUnit(e.target.value)} value={unit} />
        ) : canManage ? (
          (row.unit ?? '—')
        ) : (
          '—'
        )}
      </td>
      <td className={styles.td}>
        {canManage && isEditing ? (
          <div>
            <input
              aria-invalid={Boolean(errors.lowerBound)}
              className={styles.input}
              onChange={(e) => {
                setLowerBound(e.target.value);
                validateBounds(e.target.value, upperBound);
              }}
              value={lowerBound}
            />
            <InlineError message={errors.lowerBound} />
          </div>
        ) : (
          (row.lowerBound ?? '—')
        )}
      </td>
      <td className={styles.td}>
        {canManage && isEditing ? (
          <div>
            <input
              aria-invalid={Boolean(errors.upperBound)}
              className={styles.input}
              onChange={(e) => {
                setUpperBound(e.target.value);
                validateBounds(lowerBound, e.target.value);
              }}
              value={upperBound}
            />
            <InlineError message={errors.upperBound} />
          </div>
        ) : (
          (row.upperBound ?? '—')
        )}
      </td>
      <td className={styles.td}>{CONDITION_LABELS[row.condition]}</td>
      <td className={styles.td}>
        {canManage && isEditing ? (
          <div className="flex gap-2">
            <button
              className={styles.mutedButton}
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Hủy
            </button>
            <button
              className={styles.smallPrimaryButton}
              disabled={updateMutation.isPending}
              onClick={save}
              type="button"
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        ) : canManage ? (
          <div className="flex gap-2">
            <button
              className={styles.outlineButton}
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Chỉnh sửa
            </button>
            <button
              className={styles.mutedButton}
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(row.referenceRangeId, {
                  onError: () => onNotify('Không thể xoá trị số tham chiếu.'),
                })
              }
              type="button"
            >
              Xoá
            </button>
          </div>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

function CreateRangeForm({
  onDone,
  onNotify,
}: {
  onDone: () => void;
  onNotify: (message: string) => void;
}) {
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedType = (types ?? []).find((type) => type.labTestTypeId === form.labTestTypeId);
  const fieldOptions = selectedType ? REFERENCE_RANGE_FIELDS[selectedType.resultTableKey] : [];

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    const nextForm = {
      ...form,
      [field]: value,
      ...(field === 'labTestTypeId' ? { fieldKey: '' } : {}),
    };
    const nextErrors = getReferenceRangeFormErrors(nextForm);
    const impactedFields = new Set<string>([String(field)]);
    if (field === 'labTestTypeId') impactedFields.add('fieldKey');
    if (field === 'lowerBound' || field === 'upperBound') {
      impactedFields.add('lowerBound');
      impactedFields.add('upperBound');
    }
    setErrors((current) => {
      const next = { ...current };
      impactedFields.forEach((key) => {
        if (nextErrors[key]) next[key] = nextErrors[key];
        else delete next[key];
      });
      return next;
    });
    setForm(nextForm);
  }

  function submit() {
    const nextErrors = getReferenceRangeFormErrors(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
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
      {
        onError: () => onNotify('Không thể tạo trị số tham chiếu.'),
        onSuccess: onDone,
      },
    );
  }

  return (
    <div className="mb-5 rounded-[10px] border border-[#bfc7d2] bg-[#f8fafc] p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <select
            className={styles.select}
            aria-invalid={Boolean(errors.labTestTypeId)}
            onChange={(e) => updateField('labTestTypeId', e.target.value)}
            value={form.labTestTypeId}
          >
            <option value="">— Loại xét nghiệm —</option>
            {(types ?? []).map((type) => (
              <option key={type.labTestTypeId} value={type.labTestTypeId}>
                {type.name}
              </option>
            ))}
          </select>
          <InlineError message={errors.labTestTypeId} />
        </div>
        <div>
          <select
            className={styles.select}
            aria-invalid={Boolean(errors.fieldKey)}
            onChange={(e) => updateField('fieldKey', e.target.value)}
            value={form.fieldKey}
          >
            <option value="">— Chỉ số —</option>
            {fieldOptions.map((fieldKey) => (
              <option key={fieldKey} value={fieldKey}>
                {fieldKey}
              </option>
            ))}
          </select>
          <InlineError message={errors.fieldKey} />
        </div>
        <div>
          <input
            aria-invalid={Boolean(errors.code)}
            className={styles.input}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="Mã (vd: HSM-039)"
            value={form.code}
          />
          <InlineError message={errors.code} />
        </div>
        <div>
          <input
            aria-invalid={Boolean(errors.label)}
            className={styles.input}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="Tên chỉ số"
            value={form.label}
          />
          <InlineError message={errors.label} />
        </div>
        <input
          className={styles.input}
          onChange={(e) => updateField('unit', e.target.value)}
          placeholder="Đơn vị"
          value={form.unit}
        />
        <div>
          <input
            aria-invalid={Boolean(errors.lowerBound)}
            className={styles.input}
            onChange={(e) => updateField('lowerBound', e.target.value)}
            placeholder="Ngưỡng dưới"
            value={form.lowerBound}
          />
          <InlineError message={errors.lowerBound} />
        </div>
        <div>
          <input
            aria-invalid={Boolean(errors.upperBound)}
            className={styles.input}
            onChange={(e) => updateField('upperBound', e.target.value)}
            placeholder="Ngưỡng trên"
            value={form.upperBound}
          />
          <InlineError message={errors.upperBound} />
        </div>
        <select
          className={styles.select}
          onChange={(e) => updateField('condition', e.target.value as typeof form.condition)}
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
        <button
          className={styles.smallPrimaryButton}
          disabled={createMutation.isPending}
          onClick={submit}
          type="button"
        >
          {createMutation.isPending ? 'Đang lưu...' : 'Lưu trị số mới'}
        </button>
      </div>
    </div>
  );
}

export function ReferenceRangeConfig({ canManage }: { canManage: boolean }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [keyword, setKeyword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { hideToast, showToast, toast } = useAppToast(4500);
  const { data, isLoading } = useReferenceRanges({ keyword: keyword || undefined });
  const rows = data?.data ?? [];

  /** Hiển thị thông báo lỗi theo cùng AppToast với các workspace khác. */
  function showPopup(message: string) {
    showToast(message, 'error');
  }

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
            <p className="mt-1 text-xs text-[#707882]">
              Quản lý ngưỡng so sánh kết quả xét nghiệm — chỉ quản trị viên mới được cập nhật.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className={styles.searchInput}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm chỉ số..."
              value={keyword}
            />
            {canManage && (
              <button
                className={styles.primaryButton}
                onClick={() => setIsCreating((v) => !v)}
                type="button"
              >
                + Cập nhật trị số
              </button>
            )}
          </div>
        </div>

        {isCreating && canManage && (
          <CreateRangeForm onDone={() => setIsCreating(false)} onNotify={showPopup} />
        )}

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
              {!isLoading &&
                rows.map((row) => (
                  <EditableRow
                    canManage={canManage}
                    key={row.referenceRangeId}
                    onNotify={showPopup}
                    row={row}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <AppToast centered message={toast.message} onClose={hideToast} tone={toast.tone} />
    </div>
  );
}
