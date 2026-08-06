import { listActiveLabTestTypes } from '../repositories/lab-test-type.repository';

/**
 * @route GET /api/v1/lab-test-types
 * @desc Danh mục xét nghiệm đang hoạt động ở chế độ chỉ đọc (giá/mẫu/phương pháp) để
 * tìm và chọn khi lập chỉ định; quản lý POST/PATCH nằm ở màn hình cấu hình kỹ thuật viên.
 * @access doctor, lab_tech, admin
 */
export async function listLabTestTypes(keyword?: string) {
  const types = await listActiveLabTestTypes(keyword);
  return types.map((type) => ({
    labTestTypeId: type.id,
    code: type.code,
    name: type.name,
    category: type.category,
    price: type.price.toString(),
    specimen: type.specimen,
    resultUnit: type.resultUnit,
    referenceRange: type.referenceRange,
    method: type.method,
    resultTableKey: type.resultTableKey,
    isActive: type.isActive,
  }));
}
