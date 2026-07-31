import type { Prisma } from '@prisma/client';

import { prisma } from '../../core/db/prisma-client';
import type { DirectorDateRange } from './director-dashboard.types';

type DecimalLike = Prisma.Decimal | null | undefined;

const selectedAntibiotics = [
  { field: 'ksdPenicilline', label: 'Penicillin' },
  { field: 'ksdAmpicilline', label: 'Ampicillin' },
  { field: 'ksdCeftriaxone', label: 'Ceftriaxone' },
  { field: 'ksdVancomycin', label: 'Vancomycin' },
  { field: 'ksdCiprofloxacine', label: 'Ciprofloxacin' },
] as const;

const bioChemistryIndicators = [
  { field: 'glucose', label: 'Glucose', max: 7.8, min: 3.9 },
  { field: 'creatinin', label: 'Creatinin', max: 110, min: 44 },
  { field: 'cholesterol', label: 'Cholesterol', max: 5.2, min: 0 },
  { field: 'ast', label: 'AST/GOT', max: 40, min: 0 },
  { field: 'alt', label: 'ALT/GPT', max: 41, min: 0 },
] as const;

const dateTimeFilter = (range: DirectorDateRange) => ({
  gte: range.start,
  lt: range.end,
});

const decimalToString = (value: DecimalLike) => value?.toString() ?? '0.00';

const toNumber = (value: DecimalLike) => Number(value?.toString() ?? 0);

const percentage = (part: number, total: number) => {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

/**
 * Đếm dữ liệu điều hành tổng quan theo khoảng ngày, chỉ trả số liệu tổng hợp đã redacted.
 */
export async function getDirectorOverviewStats(range: DirectorDateRange) {
  const dateWhere = dateTimeFilter(range);
  const queueDateWhere = { gte: range.start, lt: range.end };

  const [
    visitCount,
    emergencyRecordCount,
    emergencyBypassCount,
    totalBeds,
    occupiedBeds,
    paidInvoices,
    queueWaiting,
    queueCalled,
    queueServed,
    departmentGroups,
    hourlyRecords,
  ] = await Promise.all([
    prisma.medicalRecord.count({ where: { createdAt: dateWhere, deletedAt: null } }),
    prisma.medicalRecord.count({ where: { createdAt: dateWhere, deletedAt: null, isEmergency: true } }),
    prisma.patient.count({ where: { createdAt: dateWhere, deletedAt: null, isEmergencyBypass: true } }),
    prisma.bed.count(),
    prisma.bed.count({ where: { status: 'occupied' } }),
    prisma.invoice.aggregate({
      where: { paidAt: dateWhere, status: 'paid' },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.queueTicket.count({ where: { date: queueDateWhere, status: 'waiting' } }),
    prisma.queueTicket.count({ where: { date: queueDateWhere, status: 'called' } }),
    prisma.queueTicket.count({ where: { date: queueDateWhere, status: 'served' } }),
    prisma.medicalRecord.groupBy({
      by: ['departmentId', 'status'],
      where: { createdAt: dateWhere, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.medicalRecord.findMany({
      where: { createdAt: dateWhere, deletedAt: null },
      select: { createdAt: true },
    }),
  ]);

  const departmentIds = Array.from(
    new Set(departmentGroups.map((group) => group.departmentId).filter(Boolean)),
  ) as string[];
  const departments = departmentIds.length
    ? await prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true, name: true },
      })
    : [];
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));

  return {
    beds: {
      occupied: occupiedBeds,
      total: totalBeds,
      utilizationRate: percentage(occupiedBeds, totalBeds),
    },
    departmentGroups: departmentGroups.map((group) => ({
      count: group._count._all,
      departmentId: group.departmentId,
      departmentName: group.departmentId
        ? departmentNameById.get(group.departmentId) ?? 'Chưa phân khoa'
        : 'Chưa phân khoa',
      status: group.status,
    })),
    emergencyBypassCount,
    emergencyRecordCount,
    hourlyRecords,
    paidInvoiceCount: paidInvoices._count._all,
    revenueAmount: decimalToString(paidInvoices._sum.totalAmount),
    visits: visitCount,
    queue: {
      called: queueCalled,
      served: queueServed,
      servedRate: percentage(queueServed, queueWaiting + queueCalled + queueServed),
      waiting: queueWaiting,
    },
  };
}

/**
 * Đọc thống kê xét nghiệm dạng aggregate; không trả record xét nghiệm hay hồ sơ bệnh án chi tiết.
 */
export async function getDirectorLabStats(range: DirectorDateRange) {
  const dateWhere = dateTimeFilter(range);

  const [total, resulted, pending, urgent, statusGroups, typeGroups, types, bioChemistryRows, microbiologyRows] =
    await Promise.all([
      prisma.labTest.count({ where: { orderedAt: dateWhere } }),
      prisma.labTest.count({ where: { orderedAt: dateWhere, status: 'resulted' } }),
      prisma.labTest.count({ where: { orderedAt: dateWhere, status: { in: ['ordered', 'in_progress'] } } }),
      prisma.labTest.count({ where: { orderedAt: dateWhere, isUrgent: true } }),
      prisma.labTest.groupBy({
        by: ['status'],
        where: { orderedAt: dateWhere },
        _count: { _all: true },
      }),
      prisma.labTest.groupBy({
        by: ['labTestTypeId'],
        where: { orderedAt: dateWhere },
        _count: { _all: true },
      }),
      prisma.labTestType.findMany({
        select: { category: true, id: true, name: true },
      }),
      prisma.xnHoaSinhMau.findMany({
        where: { labTest: { orderedAt: dateWhere } },
        select: {
          alt: true,
          ast: true,
          cholesterol: true,
          creatinin: true,
          glucose: true,
        },
      }),
      prisma.xnViSinh.findMany({
        where: { labTest: { orderedAt: dateWhere } },
        select: {
          chungVkKsd: true,
          ksdAmpicilline: true,
          ksdCeftriaxone: true,
          ksdCiprofloxacine: true,
          ksdPenicilline: true,
          ksdVancomycin: true,
        },
      }),
    ]);

  const typeById = new Map(types.map((type) => [type.id, type]));

  return {
    antibiotics: selectedAntibiotics.map((item) => item.label),
    bioChemistryRows,
    microbiologyRows,
    pending,
    resulted,
    statusGroups: statusGroups.map((group) => ({
      count: group._count._all,
      label: group.status,
    })),
    total,
    typeGroups: typeGroups.map((group) => {
      const type = typeById.get(group.labTestTypeId);
      return {
        count: group._count._all,
        label: type?.category || type?.name || 'Chưa phân loại',
      };
    }),
    urgent,
  };
}

/**
 * Tổng hợp tài chính và BHYT bằng Decimal/string để tránh sai số tiền tệ ở API Director.
 */
export async function getDirectorFinanceStats(range: DirectorDateRange) {
  const dateWhere = dateTimeFilter(range);

  const [invoiceTotals, paidTotals, cashTotals, momoTotals, claimGroups, itemGroups, advances] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { createdAt: dateWhere },
        _count: { _all: true },
        _sum: {
          amountDue: true,
          healthInsuranceDiscountAmount: true,
          totalAmount: true,
        },
      }),
      prisma.invoice.aggregate({
        where: { paidAt: dateWhere, status: 'paid' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { paidAt: dateWhere, paymentMethod: 'cash', status: 'paid' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { paidAt: dateWhere, paymentMethod: 'momo', status: 'paid' },
        _sum: { totalAmount: true },
      }),
      prisma.healthInsuranceClaim.groupBy({
        by: ['status'],
        where: { invoice: { createdAt: dateWhere } },
        _count: { _all: true },
      }),
      prisma.invoiceItem.groupBy({
        by: ['category'],
        where: { invoice: { createdAt: dateWhere } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.paymentAdvance.aggregate({
        where: { createdAt: dateWhere },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

  return {
    advances: {
      amount: decimalToString(advances._sum.amount),
      count: advances._count._all,
    },
    cashAmount: decimalToString(cashTotals._sum.totalAmount),
    claimGroups: claimGroups.map((group) => ({
      count: group._count._all,
      label: group.status,
    })),
    healthInsuranceDiscountAmount: decimalToString(invoiceTotals._sum.healthInsuranceDiscountAmount),
    invoiceCount: invoiceTotals._count._all,
    itemGroups: itemGroups.map((group) => ({
      amount: decimalToString(group._sum.amount),
      count: group._count._all,
      label: group.category,
    })),
    momoAmount: decimalToString(momoTotals._sum.totalAmount),
    paidAmount: decimalToString(paidTotals._sum.totalAmount),
    paidCount: paidTotals._count._all,
    totalAmount: decimalToString(invoiceTotals._sum.totalAmount),
  };
}

/**
 * Tổng hợp hiệu suất giường theo khoa/phòng, không trả bệnh nhân đang nằm.
 */
export async function getDirectorBedStats() {
  const beds = await prisma.bed.findMany({
    select: {
      status: true,
      room: {
        select: {
          department: { select: { name: true } },
          name: true,
        },
      },
    },
  });

  return { beds };
}

/**
 * Đọc cảnh báo tồn kho từ batch thật, chỉ expose thuốc/kho và trạng thái tồn tổng hợp.
 */
export async function getDirectorInventoryStats() {
  const now = new Date();
  const expiringSoon = addDays(now, 30);
  const activeBatchWhere = { isActive: true };

  const [summary, activeMedicines, lowStockBatches, expiringSoonBatches, expiredBatches, alertRows] =
    await Promise.all([
      prisma.medicineBatch.aggregate({
        where: activeBatchWhere,
        _count: { _all: true },
        _sum: { quantity: true },
      }),
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.medicineBatch.count({ where: { ...activeBatchWhere, quantity: { lte: 10 } } }),
      prisma.medicineBatch.count({
        where: { ...activeBatchWhere, expiryDate: { gt: now, lte: expiringSoon } },
      }),
      prisma.medicineBatch.count({ where: { ...activeBatchWhere, expiryDate: { lte: now } } }),
      prisma.medicineBatch.findMany({
        where: {
          ...activeBatchWhere,
          OR: [
            { quantity: { lte: 10 } },
            { expiryDate: { lte: expiringSoon } },
          ],
        },
        include: {
          medicine: { select: { name: true, unit: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: [{ expiryDate: 'asc' }, { quantity: 'asc' }],
        take: 8,
      }),
    ]);

  return {
    activeMedicines,
    alertRows,
    expiredBatches,
    expiringSoonBatches,
    lowStockBatches,
    totalBatches: summary._count._all,
    totalQuantity: summary._sum.quantity ?? 0,
  };
}

/**
 * Tổng hợp audit theo action/resource/role, tuyệt đối không trả dòng log chi tiết hay userName.
 */
export async function getDirectorAuditStats(range: DirectorDateRange) {
  const dateWhere = dateTimeFilter(range);

  const [total, loginFailures, actionGroups, resourceGroups, roleGroups, bypassCount] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: dateWhere } }),
    prisma.auditLog.count({ where: { createdAt: dateWhere, action: 'LOGIN_FAILURE' } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: dateWhere },
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
      take: 8,
    }),
    prisma.auditLog.groupBy({
      by: ['resource'],
      where: { createdAt: dateWhere },
      _count: { _all: true },
      orderBy: { _count: { resource: 'desc' } },
      take: 8,
    }),
    prisma.auditLog.groupBy({
      by: ['userRole'],
      where: { createdAt: dateWhere },
      _count: { _all: true },
      orderBy: { _count: { userRole: 'desc' } },
      take: 8,
    }),
    prisma.patient.count({ where: { createdAt: dateWhere, deletedAt: null, isEmergencyBypass: true } }),
  ]);

  return {
    actionGroups: actionGroups.map((group) => ({ count: group._count._all, label: group.action })),
    bypassCount,
    loginFailures,
    resourceGroups: resourceGroups.map((group) => ({ count: group._count._all, label: group.resource })),
    roleGroups: roleGroups.map((group) => ({ count: group._count._all, label: group.userRole })),
    total,
  };
}

export const directorDashboardRepositoryInternals = {
  bioChemistryIndicators,
  percentage,
  selectedAntibiotics,
  toNumber,
};
