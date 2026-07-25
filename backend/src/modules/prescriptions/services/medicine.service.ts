import { listActiveMedicines } from '../repositories/medicine.repository';

/**
 * @route GET /api/v1/medicines
 * @desc Active medicine catalog with non-expired batches, for the doctor's Rx search and
 * the pharmacist's dispense screen.
 * @access doctor, pharmacist
 */
export async function listDispensableMedicines(keyword?: string) {
  const medicines = await listActiveMedicines(keyword);
  return medicines.map((medicine) => ({
    medicineId: medicine.id,
    name: medicine.name,
    activeIngredient: medicine.activeIngredient,
    dosage: medicine.dosage,
    unit: medicine.unit,
    unitPrice: medicine.unitPrice.toString(),
    coveredByHealthInsurance: medicine.coveredByHealthInsurance,
    eligibleBatches: medicine.medicine_batches.map((batch) => ({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
    })),
    availability: {
      status: medicine.medicine_batches.length > 0 ? 'available' : 'unknown',
      source: 'mock_inventory',
    },
  }));
}
