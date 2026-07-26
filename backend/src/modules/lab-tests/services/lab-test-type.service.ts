import { listActiveLabTestTypes } from '../repositories/lab-test-type.repository';

/**
 * @route GET /api/v1/lab-test-types
 * @desc Read-only active lab test catalog (price/specimen/method) used to search-and-select
 * during ordering. POST/PATCH management is added alongside the lab technician config screen.
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
