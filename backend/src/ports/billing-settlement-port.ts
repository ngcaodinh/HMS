export class BillingSettlementPort {
  /** Kiểm tra điều kiện chốt hồ sơ; implementation hiện tại là adapter demo. */
  static canFinalizeRecord(recordId: string): Promise<boolean> {
    // Giữ tham số trong log để có thể truy vết đúng hồ sơ đang được kiểm tra.
    console.log(
      `[BillingSettlementPort] Evaluating charges for record ${recordId}... Done (Mocked).`,
    );
    return Promise.resolve(true);
  }
}
