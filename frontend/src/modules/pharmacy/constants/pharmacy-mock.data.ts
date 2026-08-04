/**
 * @file pharmacy-mock.data.ts
 * @description Mock data is retained only for the stock-import flow, which is outside
 * the pharmacy validation plan and still has no complete backend repository workflow.
 */

import type { StockReceipt } from '../types/pharmacy.types';

/** Phiếu nhập kho mẫu dành riêng cho màn hình nhập kho chưa nằm trong phạm vi task. */
export const mockStockReceipt: StockReceipt = {
  receiptCode: '#NKO-2026-0154',
  supplierName: 'Công ty Dược phẩm TW1 (CPC1)',
  invoiceNumber: 'HD-0098124',
  receiptDate: '2026-07-20',
  totalAmount: 19000000,
  isXmlImported: false,
  items: [
    {
      id: 'item-1',
      drugName: 'Clobetasol Propionate 0.05% (Tuýp 30g)',
      lotNumber: 'LOT-20260799',
      manufactureDate: '2026-06-01',
      expiryDate: '2028-06-01',
      importQuantity: 500,
      unitPrice: 38000,
      totalPrice: 19000000,
    },
  ],
};
