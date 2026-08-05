'use client';

import { useMemo, useState } from 'react';

import { AdminIcon } from '../../../components/admin-icon';
import { DataTable, type DataTableColumn } from '../../../components/data-table';
import { ToneBadge } from '../../../components/tone-badge';
import { roleLabelByCode } from '../../../constants/admin-mock.data';
import type { AuditLogEntry } from '../../../types/admin.types';

type AuditSectionProps = {
  auditLog: AuditLogEntry[];
};

const formatOccurredAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
};

/** Lọc nhật ký kiểm toán theo từ khóa trên state cục bộ (không gọi API), khớp nhiều trường cùng lúc. */
const filterAuditLog = (auditLog: AuditLogEntry[], keyword: string): AuditLogEntry[] => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return auditLog;

  return auditLog.filter((entry) =>
    [entry.actorUsername, entry.action, entry.resource, entry.description]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword),
  );
};

/** Màn hình nhật ký kiểm toán: bảng chỉ đọc, tìm kiếm/lọc hoàn toàn trên state cục bộ. */
export function AuditSection({ auditLog }: AuditSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAuditLog = useMemo(() => filterAuditLog(auditLog, searchTerm), [auditLog, searchTerm]);

  const columns: Array<DataTableColumn<AuditLogEntry>> = [
    { header: 'Thời gian', key: 'time', render: (row) => formatOccurredAt(row.occurredAt) },
    { header: 'Tài khoản', key: 'actor', render: (row) => row.actorUsername },
    {
      header: 'Vai trò',
      key: 'role',
      render: (row) => (row.actorRoleCode === 'system' ? 'Hệ thống' : roleLabelByCode[row.actorRoleCode]),
    },
    { header: 'Hành động', key: 'action', render: (row) => row.action },
    { header: 'Tài nguyên', key: 'resource', render: (row) => row.resource },
    {
      header: 'Mô tả',
      key: 'description',
      render: (row) => <ToneBadge label={row.description} tone={row.tone} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative max-w-sm">
          <AdminIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            name="search"
          />
          <input
            className="h-10 w-full rounded-lg border border-[#bfc7d2] bg-white pl-9 pr-3 text-sm text-[#171c1f] outline-none transition placeholder:text-[#707882] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tài khoản, hành động, tài nguyên..."
            value={searchTerm}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Chế độ chỉ đọc - dữ liệu demo, không hỗ trợ chỉnh sửa hoặc xóa.
        </p>
      </div>

      <DataTable
        columns={columns}
        emptyLabel="Không tìm thấy nhật ký phù hợp."
        rowKey={(row) => row.id}
        rows={filteredAuditLog}
      />
    </div>
  );
}
