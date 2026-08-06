import { departmentLabelByCode } from '../constants/admin-mock.data';
import type { BedOccupancyRow, BedRecord, DepartmentCode } from '../types/admin.types';

/** Ánh xạ công suất đã làm tròn sang nhãn cảnh báo của bảng công suất giường. */
const resolveOccupancyStatus = (
  occupancyRatePercent: number,
): { status: BedOccupancyRow['status']; statusLabel: string } => {
  if (occupancyRatePercent >= 90) return { status: 'critical', statusLabel: 'Gần đầy / Đầy giường' };
  if (occupancyRatePercent >= 70) return { status: 'busy', statusLabel: 'Đông giường' };
  return { status: 'normal', statusLabel: 'Bình thường' };
};

/**
 * Tính công suất giường bệnh theo từng khoa từ danh sách giường thực tế (thêm/sửa/xóa cập nhật tức thì).
 * Giường bảo trì không tính là trống, chỉ tính vào tổng số giường của khoa.
 * Tỷ lệ được làm tròn về phần trăm nguyên trước khi áp dụng ngưỡng 70% và 90%.
 * @param beds - Danh sách giường hiện tại trên state cục bộ.
 * @returns Danh sách hàng công suất theo khoa, chỉ gồm khoa đang có giường.
 * @remarks Hàm thuần, không gọi API và không thay đổi danh sách đầu vào.
 */
export const computeBedOccupancyByDepartment = (beds: BedRecord[]): BedOccupancyRow[] => {
  const departmentCodes = Array.from(new Set(beds.map((bed) => bed.departmentCode)));

  return departmentCodes.map((departmentCode) => {
    const departmentBeds = beds.filter((bed) => bed.departmentCode === departmentCode);
    const occupiedBeds = departmentBeds.filter((bed) => bed.status === 'occupied').length;
    const availableBeds = departmentBeds.filter((bed) => bed.status === 'available').length;
    const totalBeds = departmentBeds.length;
    const occupancyRatePercent = totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100);

    return {
      availableBeds,
      departmentName: departmentLabelByCode[departmentCode as DepartmentCode],
      occupancyRatePercent,
      occupiedBeds,
      totalBeds,
      ...resolveOccupancyStatus(occupancyRatePercent),
    };
  });
};
