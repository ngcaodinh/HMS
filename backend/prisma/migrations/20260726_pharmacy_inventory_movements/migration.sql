-- CreateTable
CREATE TABLE `pharmacy_warehouses` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacy_warehouses_code_key`(`code`),
    INDEX `pharmacy_warehouses_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill a default warehouse so legacy batches become warehouse-scoped before the NOT NULL FK.
INSERT INTO `pharmacy_warehouses` (`id`, `code`, `name`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('phw-default-000000000000000000000001', 'MAIN', 'Kho dược chính', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- AlterTable
ALTER TABLE `medicine_batches`
    ADD COLUMN `warehouseId` VARCHAR(36) NULL,
    ADD COLUMN `importPrice` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

UPDATE `medicine_batches`
SET `warehouseId` = 'phw-default-000000000000000000000001'
WHERE `warehouseId` IS NULL;

ALTER TABLE `medicine_batches`
    MODIFY `warehouseId` VARCHAR(36) NOT NULL;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` VARCHAR(36) NOT NULL,
    `warehouseId` VARCHAR(36) NOT NULL,
    `medicineId` VARCHAR(36) NOT NULL,
    `batchId` VARCHAR(36) NOT NULL,
    `prescriptionId` VARCHAR(36) NULL,
    `prescriptionItemId` VARCHAR(36) NULL,
    `quantityChange` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `movementType` ENUM('receipt', 'prescription_sign', 'prescription_cancel', 'adjustment') NOT NULL,
    `actorUserId` VARCHAR(36) NULL,
    `referenceType` VARCHAR(60) NULL,
    `referenceId` VARCHAR(36) NULL,
    `idempotencyKey` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_warehouseId_createdAt_idx`(`warehouseId`, `createdAt`),
    INDEX `stock_movements_medicineId_createdAt_idx`(`medicineId`, `createdAt`),
    INDEX `stock_movements_batchId_createdAt_idx`(`batchId`, `createdAt`),
    INDEX `stock_movements_prescriptionId_idx`(`prescriptionId`),
    INDEX `stock_movements_movementType_createdAt_idx`(`movementType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `medicine_batches_warehouseId_medicineId_expiryDate_idx`
ON `medicine_batches`(`warehouseId`, `medicineId`, `expiryDate`);

CREATE INDEX `medicine_batches_isActive_idx`
ON `medicine_batches`(`isActive`);

CREATE UNIQUE INDEX `medicine_batches_warehouseId_medicineId_batchNumber_key`
ON `medicine_batches`(`warehouseId`, `medicineId`, `batchNumber`);

-- AddForeignKey
ALTER TABLE `medicine_batches`
ADD CONSTRAINT `medicine_batches_warehouseId_fkey`
FOREIGN KEY (`warehouseId`) REFERENCES `pharmacy_warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements`
ADD CONSTRAINT `stock_movements_warehouseId_fkey`
FOREIGN KEY (`warehouseId`) REFERENCES `pharmacy_warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements`
ADD CONSTRAINT `stock_movements_medicineId_fkey`
FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements`
ADD CONSTRAINT `stock_movements_batchId_fkey`
FOREIGN KEY (`batchId`) REFERENCES `medicine_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements`
ADD CONSTRAINT `stock_movements_prescriptionId_fkey`
FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements`
ADD CONSTRAINT `stock_movements_prescriptionItemId_fkey`
FOREIGN KEY (`prescriptionItemId`) REFERENCES `prescription_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
