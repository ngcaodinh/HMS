-- AlterTable
ALTER TABLE `users` MODIFY `gender` ENUM('male', 'female') NOT NULL;

-- CreateTable
CREATE TABLE `queue_tickets` (
    `id` VARCHAR(36) NOT NULL,
    `number` INTEGER NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `status` ENUM('waiting', 'called', 'served', 'skipped') NOT NULL DEFAULT 'waiting',
    `calledAt` DATETIME(3) NULL,
    `servedAt` DATETIME(3) NULL,
    `recordId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `queue_tickets_recordId_key`(`recordId`),
    UNIQUE INDEX `unique_key_queue_ticket_date_number`(`date`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queue_daily_sequences` (
    `date` DATE NOT NULL,
    `last_number` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` VARCHAR(36) NOT NULL,
    `patientCode` VARCHAR(20) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `dateOfBirth` DATE NOT NULL,
    `gender` ENUM('male', 'female') NOT NULL,
    `phoneNumber` VARCHAR(15) NULL,
    `phoneNumberUnavailableReason` VARCHAR(500) NULL,
    `identityCardNumber` VARCHAR(12) NULL,
    `address` VARCHAR(500) NULL,
    `province` VARCHAR(100) NULL,
    `ward` VARCHAR(100) NULL,
    `bloodType` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
    `allergies` TEXT NULL,
    `healthInsuranceCode` VARCHAR(20) NULL,
    `healthInsuranceExpiryDate` DATE NULL,
    `healthInsuranceInitialFacilityCode` VARCHAR(10) NULL,
    `healthInsuranceBenefitRateHint` DECIMAL(5, 4) NULL,
    `emergencyContact` VARCHAR(255) NULL,
    `emergencyPhoneNumber` VARCHAR(15) NULL,
    `guardianFullName` VARCHAR(255) NULL,
    `guardianPhoneNumber` VARCHAR(15) NULL,
    `isEmergencyBypass` BOOLEAN NOT NULL DEFAULT false,
    `emergencyReason` VARCHAR(500) NULL,
    `privacyNoticeAccepted` BOOLEAN NOT NULL DEFAULT false,
    `privacyNoticeAcceptedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patients_patientCode_key`(`patientCode`),
    UNIQUE INDEX `patients_identityCardNumber_key`(`identityCardNumber`),
    INDEX `index_patient_full_name`(`fullName`),
    INDEX `index_patient_phone`(`phoneNumber`),
    INDEX `patients_deletedAt_idx`(`deletedAt`),
    INDEX `patients_province_idx`(`province`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctors` (
    `id` VARCHAR(36) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `employeeCode` VARCHAR(50) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `doctors_employeeCode_key`(`employeeCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('clinical', 'paraclinical', 'administrative') NOT NULL DEFAULT 'clinical',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_catalog` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `departmentId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_catalog_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_records` (
    `id` VARCHAR(36) NOT NULL,
    `recordCode` VARCHAR(20) NOT NULL,
    `patientId` VARCHAR(36) NOT NULL,
    `doctorId` VARCHAR(36) NOT NULL,
    `departmentId` VARCHAR(36) NULL,
    `status` ENUM('open', 'waiting_results', 'diagnosed', 'closed') NOT NULL DEFAULT 'open',
    `isEmergency` BOOLEAN NOT NULL DEFAULT false,
    `emergencyReason` VARCHAR(500) NULL,
    `chiefComplaint` VARCHAR(500) NULL,
    `vitalSigns` JSON NULL,
    `heightCm` DECIMAL(5, 1) NULL,
    `weightKg` DECIMAL(5, 1) NULL,
    `historyOfPresentIllness` TEXT NULL,
    `pastMedicalHistory` TEXT NULL,
    `familyHistory` TEXT NULL,
    `skinLesionTypes` VARCHAR(255) NULL,
    `skinLesionDescription` TEXT NULL,
    `skinLesionLocation` VARCHAR(500) NULL,
    `skinLesionDistribution` ENUM('localized', 'scattered', 'generalized', 'symmetric', 'dermatomal', 'flexural') NULL,
    `bodySurfaceAreaPercent` DECIMAL(5, 2) NULL,
    `itchSeverity` ENUM('none', 'mild', 'moderate', 'severe') NULL,
    `vitalConfirmedBy` VARCHAR(36) NULL,
    `vitalConfirmedAt` DATETIME(3) NULL,
    `icd10` VARCHAR(10) NULL,
    `icdCodingSystem` ENUM('TT06_2026') NULL,
    `diagnosisText` VARCHAR(1000) NULL,
    `diagnosedBy` VARCHAR(36) NULL,
    `diagnosedAt` DATETIME(3) NULL,
    `diagnosisSignedBy` VARCHAR(36) NULL,
    `diagnosisSignedAt` DATETIME(3) NULL,
    `diagnosisSignatureMethod` ENUM('dev_e_confirmation') NULL,
    `treatmentType` ENUM('outpatient', 'inpatient') NOT NULL DEFAULT 'outpatient',
    `bedId` VARCHAR(36) NULL,
    `notes` TEXT NULL,
    `closedAt` DATETIME(3) NULL,
    `closedBy` VARCHAR(36) NULL,
    `closeSignatureMethod` ENUM('dev_e_confirmation') NULL,
    `deletedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `medical_records_recordCode_key`(`recordCode`),
    INDEX `index_medical_record_patient`(`patientId`),
    INDEX `index_medical_record_doctor`(`doctorId`),
    INDEX `index_medical_record_status`(`status`),
    INDEX `medical_records_deletedAt_idx`(`deletedAt`),
    INDEX `medical_records_bedId_idx`(`bedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_orders` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `serviceCatalogId` VARCHAR(36) NOT NULL,
    `fee` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('waiting', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `index_service_order_record`(`recordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `code_sequences` (
    `key` VARCHAR(30) NOT NULL,
    `last_number` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NULL,
    `departmentId` VARCHAR(36) NULL,
    `roomType` ENUM('exam', 'lab', 'inpatient', 'procedure', 'storage', 'other') NOT NULL DEFAULT 'other',
    `floor` VARCHAR(20) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rooms_code_key`(`code`),
    INDEX `rooms_departmentId_idx`(`departmentId`),
    INDEX `rooms_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beds` (
    `id` VARCHAR(36) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `dailyRate` DECIMAL(15, 2) NOT NULL DEFAULT 200000.00,
    `status` ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
    `patientId` VARCHAR(36) NULL,
    `assignedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `beds_patientId_idx`(`patientId`),
    INDEX `beds_roomId_idx`(`roomId`),
    INDEX `beds_status_idx`(`status`),
    UNIQUE INDEX `unique_key_bed_room_number`(`roomId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bed_assignments` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `bedId` VARCHAR(36) NOT NULL,
    `dailyRateSnapshot` DECIMAL(15, 2) NOT NULL,
    `assignedBy` VARCHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `releasedBy` VARCHAR(36) NULL,
    `releasedAt` DATETIME(3) NULL,
    `releaseReason` ENUM('discharge', 'transfer', 'correction') NULL,
    `note` VARCHAR(255) NULL,
    `openRecordSlot` VARCHAR(36) NULL,
    `openBedSlot` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bed_assignments_openRecordSlot_key`(`openRecordSlot`),
    UNIQUE INDEX `bed_assignments_openBedSlot_key`(`openBedSlot`),
    INDEX `bed_assignments_assignedBy_idx`(`assignedBy`),
    INDEX `bed_assignments_releasedBy_idx`(`releasedBy`),
    INDEX `bed_assignments_bedId_assignedAt_idx`(`bedId`, `assignedAt`),
    INDEX `bed_assignments_recordId_assignedAt_idx`(`recordId`, `assignedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_orders` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `orderedBy` VARCHAR(36) NOT NULL,
    `orderType` ENUM('medication', 'monitoring', 'care', 'diet', 'procedure') NOT NULL,
    `content` VARCHAR(1000) NOT NULL,
    `orderedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('active', 'done', 'cancelled') NOT NULL DEFAULT 'active',
    `executedBy` VARCHAR(36) NULL,
    `executedAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(500) NULL,
    `cancelledBy` VARCHAR(36) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `treatment_orders_recordId_idx`(`recordId`),
    INDEX `treatment_orders_orderedBy_idx`(`orderedBy`),
    INDEX `treatment_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discharge_summaries` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `dischargeDiagnosis` VARCHAR(1000) NOT NULL,
    `icd10` VARCHAR(10) NULL,
    `treatmentSummary` TEXT NOT NULL,
    `dischargeCondition` ENUM('recovered', 'improved', 'unchanged', 'worse', 'deceased') NOT NULL,
    `doctorAdvice` TEXT NULL,
    `followUpDate` DATE NULL,
    `signedBy` VARCHAR(36) NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signatureMethod` ENUM('dev_e_confirmation') NOT NULL DEFAULT 'dev_e_confirmation',
    `dischargedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `discharge_summaries_recordId_key`(`recordId`),
    INDEX `discharge_summaries_signedBy_idx`(`signedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specimen_collections` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `patientCode` VARCHAR(20) NOT NULL,
    `patientName` VARCHAR(255) NOT NULL,
    `departmentName` VARCHAR(255) NOT NULL,
    `specimenCode` VARCHAR(50) NOT NULL,
    `specimenType` VARCHAR(100) NOT NULL,
    `orderDescription` VARCHAR(1000) NOT NULL,
    `priority` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('pending', 'collected', 'handed_over') NOT NULL DEFAULT 'pending',
    `barcodePrinted` BOOLEAN NOT NULL DEFAULT false,
    `collectedBy` VARCHAR(36) NULL,
    `collectedAt` DATETIME(3) NULL,
    `handedOverBy` VARCHAR(36) NULL,
    `handedOverAt` DATETIME(3) NULL,
    `labReceiverName` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `specimen_collections_specimenCode_key`(`specimenCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_test_types` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NULL,
    `departmentId` VARCHAR(36) NOT NULL,
    `resultTableKey` ENUM('xn_cong_thuc_mau', 'xn_nuoc_tieu', 'xn_vi_sinh', 'xn_mo_benh_hoc', 'xn_hoa_sinh_mau') NOT NULL,
    `specimen` VARCHAR(100) NULL,
    `resultUnit` VARCHAR(50) NULL,
    `method` VARCHAR(255) NULL,
    `referenceRange` VARCHAR(255) NULL,
    `price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lab_test_types_code_key`(`code`),
    INDEX `lab_test_types_departmentId_idx`(`departmentId`),
    INDEX `lab_test_types_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_reference_ranges` (
    `id` VARCHAR(36) NOT NULL,
    `labTestTypeId` VARCHAR(36) NOT NULL,
    `fieldKey` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NULL,
    `lowerBound` DECIMAL(15, 4) NULL,
    `upperBound` DECIMAL(15, 4) NULL,
    `condition` ENUM('all', 'male', 'female') NOT NULL DEFAULT 'all',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lab_reference_ranges_labTestTypeId_isActive_idx`(`labTestTypeId`, `isActive`),
    INDEX `lab_reference_ranges_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_tests` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `labTestTypeId` VARCHAR(36) NOT NULL,
    `testName` VARCHAR(255) NOT NULL,
    `fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ordered', 'in_progress', 'resulted') NOT NULL DEFAULT 'ordered',
    `isUrgent` BOOLEAN NOT NULL DEFAULT false,
    `orderedBy` VARCHAR(36) NOT NULL,
    `orderedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `specimenType` VARCHAR(100) NULL,
    `specimenReceivedAt` DATETIME(3) NULL,
    `method` VARCHAR(255) NULL,
    `conclusion` VARCHAR(1000) NULL,
    `reportCode` VARCHAR(30) NULL,
    `resultedBy` VARCHAR(36) NULL,
    `resultedAt` DATETIME(3) NULL,
    `signedBy` VARCHAR(36) NULL,
    `signedAt` DATETIME(3) NULL,
    `signatureMethod` ENUM('dev_e_confirmation') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lab_tests_recordId_idx`(`recordId`),
    INDEX `lab_tests_labTestTypeId_idx`(`labTestTypeId`),
    INDEX `lab_tests_status_idx`(`status`),
    INDEX `lab_tests_orderedAt_idx`(`orderedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachments` (
    `id` VARCHAR(36) NOT NULL,
    `ownerType` ENUM('medical_record', 'lab_test', 'prescription') NOT NULL,
    `ownerId` VARCHAR(36) NOT NULL,
    `filePath` VARCHAR(1000) NOT NULL,
    `fileType` ENUM('pdf', 'png', 'jpeg', 'xml') NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `sizeBytes` BIGINT UNSIGNED NOT NULL,
    `checksumSha256` CHAR(64) NOT NULL,
    `uploadedBy` VARCHAR(36) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_ownerType_ownerId_idx`(`ownerType`, `ownerId`),
    INDEX `attachments_uploadedBy_idx`(`uploadedBy`),
    INDEX `attachments_checksumSha256_idx`(`checksumSha256`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `userRole` VARCHAR(30) NOT NULL DEFAULT 'public',
    `userName` VARCHAR(255) NOT NULL DEFAULT '',
    `action` ENUM('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'RESET_PASSWORD', 'SIGN', 'PAY', 'CANCEL', 'EXPORT', 'OVERRIDE', 'SYNC', 'WRITE_OFF', 'DISPENSE') NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `resourceId` VARCHAR(36) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_resource_resourceId_idx`(`resource`, `resourceId`),
    INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicines` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(30) NULL,
    `name` VARCHAR(255) NOT NULL,
    `activeIngredient` VARCHAR(255) NULL,
    `dosage` VARCHAR(100) NULL,
    `unit` VARCHAR(50) NOT NULL,
    `unitPrice` DECIMAL(15, 2) NOT NULL,
    `coveredByHealthInsurance` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `medicines_code_key`(`code`),
    INDEX `medicines_name_idx`(`name`),
    INDEX `medicines_activeIngredient_idx`(`activeIngredient`),
    INDEX `medicines_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine_batches` (
    `id` VARCHAR(36) NOT NULL,
    `medicineId` VARCHAR(36) NOT NULL,
    `batchNumber` VARCHAR(100) NOT NULL,
    `expiryDate` DATE NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medicine_batches_medicineId_expiryDate_idx`(`medicineId`, `expiryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `prescriptionCode` VARCHAR(40) NOT NULL,
    `prescribedBy` VARCHAR(36) NOT NULL,
    `roundNumber` INTEGER NOT NULL,
    `prescriptionType` ENUM('C', 'N', 'H') NOT NULL,
    `status` ENUM('draft', 'active', 'xml_exported', 'cancelled') NOT NULL DEFAULT 'draft',
    `isSigned` BOOLEAN NOT NULL DEFAULT false,
    `signedBy` VARCHAR(36) NULL,
    `signedAt` DATETIME(3) NULL,
    `signatureMethod` ENUM('dev_e_confirmation') NULL,
    `allergyOverrideReason` VARCHAR(500) NULL,
    `allergyOverrideBy` VARCHAR(36) NULL,
    `allergyOverrideAt` DATETIME(3) NULL,
    `xmlExportedAt` DATETIME(3) NULL,
    `xmlFilePath` VARCHAR(1000) NULL,
    `cancelledBy` VARCHAR(36) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(500) NULL,
    `dispensedBy` VARCHAR(36) NULL,
    `dispensedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prescriptions_prescriptionCode_key`(`prescriptionCode`),
    INDEX `prescriptions_recordId_idx`(`recordId`),
    INDEX `prescriptions_status_idx`(`status`),
    INDEX `prescriptions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_items` (
    `id` VARCHAR(36) NOT NULL,
    `prescriptionId` VARCHAR(36) NOT NULL,
    `medicineId` VARCHAR(36) NULL,
    `medicineNameSnapshot` VARCHAR(255) NULL,
    `activeIngredientSnapshot` VARCHAR(255) NULL,
    `dosageSnapshot` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL,
    `days` INTEGER NOT NULL,
    `dosePerUse` VARCHAR(50) NULL,
    `usesPerDay` INTEGER NULL,
    `useTiming` VARCHAR(100) NULL,
    `dosageInstruction` VARCHAR(500) NOT NULL,
    `longTermReason` VARCHAR(500) NULL,
    `unitPrice` DECIMAL(15, 2) NOT NULL,
    `total` DECIMAL(15, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prescription_items_prescriptionId_idx`(`prescriptionId`),
    INDEX `prescription_items_medicineId_idx`(`medicineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vital_sign_logs` (
    `id` VARCHAR(36) NOT NULL,
    `recordId` VARCHAR(36) NOT NULL,
    `treatmentOrderId` VARCHAR(36) NULL,
    `measuredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pulse` INTEGER NULL,
    `temperatureC` DECIMAL(4, 1) NULL,
    `bloodPressureSystolic` INTEGER NULL,
    `bloodPressureDiastolic` INTEGER NULL,
    `respiratoryRate` INTEGER NULL,
    `spo2` INTEGER NULL,
    `weightKg` DECIMAL(5, 1) NULL,
    `note` VARCHAR(500) NULL,
    `recordedBy` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vital_sign_logs_recordId_measuredAt_idx`(`recordId`, `measuredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xn_cong_thuc_mau` (
    `id` VARCHAR(36) NOT NULL,
    `labTestId` VARCHAR(36) NOT NULL,
    `mayXetNghiem` VARCHAR(100) NULL,
    `mauBenhPham` VARCHAR(100) NULL,
    `wbc` DECIMAL(6, 2) NULL,
    `neu` DECIMAL(5, 2) NULL,
    `lym` DECIMAL(5, 2) NULL,
    `mono` DECIMAL(5, 2) NULL,
    `eos` DECIMAL(5, 2) NULL,
    `baso` DECIMAL(5, 2) NULL,
    `rbc` DECIMAL(6, 2) NULL,
    `hgb` DECIMAL(5, 1) NULL,
    `hct` DECIMAL(5, 3) NULL,
    `mcv` DECIMAL(6, 2) NULL,
    `mch` DECIMAL(6, 2) NULL,
    `mchc` DECIMAL(6, 2) NULL,
    `rdw` DECIMAL(5, 2) NULL,
    `plt` DECIMAL(6, 1) NULL,
    `mpv` DECIMAL(5, 2) NULL,
    `pdw` DECIMAL(5, 2) NULL,
    `pct` DECIMAL(6, 4) NULL,
    `ghiChuChiSo` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `xn_cong_thuc_mau_labTestId_key`(`labTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xn_hoa_sinh_mau` (
    `id` VARCHAR(36) NOT NULL,
    `labTestId` VARCHAR(36) NOT NULL,
    `mayXetNghiem` VARCHAR(100) NULL,
    `mauBenhPham` VARCHAR(100) NULL,
    `ure` DECIMAL(5, 2) NULL,
    `glucose` DECIMAL(5, 2) NULL,
    `creatinin` DECIMAL(6, 2) NULL,
    `acidUric` DECIMAL(6, 2) NULL,
    `bilirubinTP` DECIMAL(5, 2) NULL,
    `bilirubinTT` DECIMAL(5, 2) NULL,
    `bilirubinGT` DECIMAL(5, 2) NULL,
    `proteinTP` DECIMAL(5, 2) NULL,
    `albumin` DECIMAL(5, 2) NULL,
    `globulin` DECIMAL(5, 2) NULL,
    `tyLeAG` DECIMAL(4, 2) NULL,
    `fibrinogen` DECIMAL(5, 2) NULL,
    `cholesterol` DECIMAL(5, 2) NULL,
    `triglycerid` DECIMAL(5, 2) NULL,
    `hdlCho` DECIMAL(5, 2) NULL,
    `ldlCho` DECIMAL(5, 2) NULL,
    `natri` DECIMAL(6, 2) NULL,
    `kali` DECIMAL(5, 2) NULL,
    `clorua` DECIMAL(6, 2) NULL,
    `calci` DECIMAL(5, 2) NULL,
    `calciIon` DECIMAL(5, 2) NULL,
    `phospho` DECIMAL(5, 2) NULL,
    `sat` DECIMAL(6, 2) NULL,
    `magie` DECIMAL(5, 2) NULL,
    `ast` DECIMAL(7, 2) NULL,
    `alt` DECIMAL(7, 2) NULL,
    `amylase` DECIMAL(8, 2) NULL,
    `ck` DECIMAL(7, 2) NULL,
    `ckMb` DECIMAL(7, 2) NULL,
    `ldh` DECIMAL(7, 2) NULL,
    `ggt` DECIMAL(7, 2) NULL,
    `cholinesterase` DECIMAL(9, 2) NULL,
    `phosphataseKiem` DECIMAL(8, 2) NULL,
    `phDongMach` DECIMAL(4, 3) NULL,
    `pco2` DECIMAL(5, 2) NULL,
    `po2DongMach` DECIMAL(6, 2) NULL,
    `hco3Chuan` DECIMAL(5, 2) NULL,
    `kiemDu` DECIMAL(5, 2) NULL,
    `ghiChuChiSo` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `xn_hoa_sinh_mau_labTestId_key`(`labTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xn_nuoc_tieu` (
    `id` VARCHAR(36) NOT NULL,
    `labTestId` VARCHAR(36) NOT NULL,
    `mayXetNghiem` VARCHAR(100) NULL,
    `phuongPhap` VARCHAR(100) NULL,
    `mauSac` VARCHAR(50) NULL,
    `doTrong` VARCHAR(20) NULL,
    `ph` DECIMAL(3, 1) NULL,
    `tyTrong` DECIMAL(5, 3) NULL,
    `glucose` VARCHAR(20) NULL,
    `protein` VARCHAR(20) NULL,
    `ketone` VARCHAR(20) NULL,
    `bilirubin` VARCHAR(20) NULL,
    `urobilinogen` VARCHAR(20) NULL,
    `blood` VARCHAR(20) NULL,
    `leukocyte` VARCHAR(20) NULL,
    `nitrite` VARCHAR(20) NULL,
    `hongCauViTruong` VARCHAR(100) NULL,
    `bachCauViTruong` VARCHAR(100) NULL,
    `teBaoBieuMo` VARCHAR(100) NULL,
    `viKhuan` VARCHAR(100) NULL,
    `truNi` VARCHAR(100) NULL,
    `tinhThe` VARCHAR(100) NULL,
    `moTaCanLang` VARCHAR(500) NULL,
    `duongChat` VARCHAR(20) NULL,
    `porphyrin` VARCHAR(20) NULL,
    `proteinBenceJones` VARCHAR(20) NULL,
    `nt24TheTich` DECIMAL(5, 2) NULL,
    `nt24Protein` DECIMAL(7, 4) NULL,
    `nt24Glucose` DECIMAL(7, 3) NULL,
    `nt24Ure` DECIMAL(7, 2) NULL,
    `nt24Creatinin` DECIMAL(7, 3) NULL,
    `nt24AcidUric` DECIMAL(7, 3) NULL,
    `nt24Amylase` DECIMAL(8, 2) NULL,
    `nt24Na` DECIMAL(7, 2) NULL,
    `nt24K` DECIMAL(7, 2) NULL,
    `phanHuyetSacTo` VARCHAR(20) NULL,
    `phanStercobilin` VARCHAR(20) NULL,
    `phanStercobilinogen` VARCHAR(20) NULL,
    `phanMauToanPhan` VARCHAR(20) NULL,
    `phanGhiChu` VARCHAR(500) NULL,
    `dntProtein` DECIMAL(6, 3) NULL,
    `dntGlucose` DECIMAL(5, 2) NULL,
    `dntClorua` DECIMAL(6, 2) NULL,
    `dntPandy` VARCHAR(20) NULL,
    `dntGhiChu` VARCHAR(500) NULL,
    `dichViHClTuDo` DECIMAL(5, 2) NULL,
    `dichViHClToanPhan` DECIMAL(5, 2) NULL,
    `dichViGhiChu` VARCHAR(500) NULL,
    `dcdRivalta` VARCHAR(20) NULL,
    `dcdProtein` DECIMAL(6, 2) NULL,
    `dcdGhiChu` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `xn_nuoc_tieu_labTestId_key`(`labTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xn_vi_sinh` (
    `id` VARCHAR(36) NOT NULL,
    `labTestId` VARCHAR(36) NOT NULL,
    `viTriLayMau` VARCHAR(255) NULL,
    `phuongPhapSoi` VARCHAR(100) NULL,
    `trucTiep` TEXT NULL,
    `soiNam` VARCHAR(20) NULL,
    `teBaoNamMen` VARCHAR(20) NULL,
    `baoTu` VARCHAR(20) NULL,
    `moTaHinhThaiNam` VARCHAR(500) NULL,
    `nuoiCayAiKhi` TEXT NULL,
    `nuoiCayKyKhi` TEXT NULL,
    `phanUngHT` TEXT NULL,
    `chungVkKsd` VARCHAR(500) NULL,
    `ksdPenicilline` VARCHAR(1) NULL,
    `ksdAmpicilline` VARCHAR(1) NULL,
    `ksdAmoAClavulanic` VARCHAR(1) NULL,
    `ksdAztreonam` VARCHAR(1) NULL,
    `ksdMezlocilline` VARCHAR(1) NULL,
    `ksdOxacillinePhe` VARCHAR(1) NULL,
    `ksdOxacillineTu` VARCHAR(1) NULL,
    `ksdCephalotine` VARCHAR(1) NULL,
    `ksdCefuroxime` VARCHAR(1) NULL,
    `ksdCeftazidime` VARCHAR(1) NULL,
    `ksdCefotaxime` VARCHAR(1) NULL,
    `ksdCeftriaxone` VARCHAR(1) NULL,
    `ksdCefoperazone` VARCHAR(1) NULL,
    `ksdCefepime` VARCHAR(1) NULL,
    `ksdVancomycin` VARCHAR(1) NULL,
    `ksdClindamycin` VARCHAR(1) NULL,
    `ksdChloramphenicol` VARCHAR(1) NULL,
    `ksdErythromycine` VARCHAR(1) NULL,
    `ksdTetracycline` VARCHAR(1) NULL,
    `ksdDoxycycline` VARCHAR(1) NULL,
    `ksdNalidixicAcid` VARCHAR(1) NULL,
    `ksdNofloxacine` VARCHAR(1) NULL,
    `ksdCiprofloxacine` VARCHAR(1) NULL,
    `ksdOfloxacine` VARCHAR(1) NULL,
    `ksdGentamycine` VARCHAR(1) NULL,
    `ksdTobramycine` VARCHAR(1) NULL,
    `ksdAmikacine` VARCHAR(1) NULL,
    `ksdNetromycine` VARCHAR(1) NULL,
    `ksdCoTrimoxazol` VARCHAR(1) NULL,
    `ksdNitroxoline` VARCHAR(1) NULL,
    `ksdKhacTenA` VARCHAR(100) NULL,
    `ksdKhacKqA` VARCHAR(1) NULL,
    `ksdKhacTenB` VARCHAR(100) NULL,
    `ksdKhacKqB` VARCHAR(1) NULL,
    `ksdKhacTenC` VARCHAR(100) NULL,
    `ksdKhacKqC` VARCHAR(1) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `xn_vi_sinh_labTestId_key`(`labTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xn_mo_benh_hoc` (
    `id` VARCHAR(36) NOT NULL,
    `labTestId` VARCHAR(36) NOT NULL,
    `phuongPhapSinhThiet` VARCHAR(20) NULL,
    `viTriSinhThiet` VARCHAR(255) NULL,
    `soManh` INTEGER NULL,
    `chanDoanLamSang` VARCHAR(1000) NULL,
    `tomTatLamSang` TEXT NULL,
    `quaTrinhDieuTri` TEXT NULL,
    `nhanXetDaiTheLayMau` TEXT NULL,
    `ketQuaSinhThietLanTruoc` TEXT NULL,
    `dungDichCoDinh` VARCHAR(100) NULL,
    `thoiGianCoDinh` DATETIME(3) NULL,
    `nguoiPhaBenhPham` VARCHAR(36) NULL,
    `ngayPha` DATE NULL,
    `phuongPhapNhuomHE` VARCHAR(100) NULL DEFAULT 'HE',
    `ngayLamTieuBan` DATE NULL,
    `nguoiLamTieuBan` VARCHAR(36) NULL,
    `daiThe` TEXT NULL,
    `viThe` TEXT NULL,
    `nhuomDacBiet` VARCHAR(500) NULL,
    `chanDoanMoHoc` VARCHAR(1000) NULL,
    `phuHopChanDoanLamSang` VARCHAR(30) NULL,
    `icd10MoHoc` VARCHAR(10) NULL,
    `trangThai` VARCHAR(30) NOT NULL DEFAULT 'cho_ket_qua',
    `bacSiGiaiPhauBenh` VARCHAR(36) NULL,
    `ngayTraKetQua` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `xn_mo_benh_hoc_labTestId_key`(`labTestId`),
    INDEX `xn_mo_benh_hoc_bacSiGiaiPhauBenh_idx`(`bacSiGiaiPhauBenh`),
    INDEX `xn_mo_benh_hoc_trangThai_idx`(`trangThai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(36) NOT NULL,
    `record_id` VARCHAR(36) NOT NULL,
    `status` ENUM('pending', 'paid', 'cancelled', 'write_off') NOT NULL DEFAULT 'pending',
    `health_insurance_benefit_level` ENUM('NO_COVERAGE', 'RATE_80', 'RATE_95', 'RATE_100') NOT NULL,
    `health_insurance_route_type` ENUM('right_route', 'referral', 'emergency', 'wrong_route') NULL,
    `health_insurance_benefit_rate_snapshot` VARCHAR(10) NULL,
    `health_insurance_rule_source` VARCHAR(255) NULL,
    `subtotal` DECIMAL(18, 2) NOT NULL,
    `health_insurance_base_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `health_insurance_discount_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(18, 2) NOT NULL,
    `advance_applied_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `amount_due` DECIMAL(18, 2) NOT NULL,
    `payment_method` ENUM('cash', 'momo') NULL,
    `receipt_number` VARCHAR(40) NULL,
    `paid_at` DATETIME(3) NULL,
    `momo_order_id` VARCHAR(80) NULL,
    `statement_status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `statement_number` VARCHAR(40) NULL,
    `statement_signed_at` DATETIME(3) NULL,
    `statement_signed_by` VARCHAR(36) NULL,
    `cancel_reason` VARCHAR(500) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `write_off_reason` VARCHAR(500) NULL,
    `write_off_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_receipt_number_key`(`receipt_number`),
    UNIQUE INDEX `invoices_momo_order_id_key`(`momo_order_id`),
    INDEX `index_invoice_record`(`record_id`),
    INDEX `index_invoice_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` VARCHAR(36) NOT NULL,
    `invoice_id` VARCHAR(36) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category` ENUM('consultation', 'lab', 'medicine', 'bed', 'procedure', 'other') NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL,
    `unit_price` DECIMAL(18, 2) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `covered_by_health_insurance` BOOLEAN NOT NULL DEFAULT false,
    `health_insurance_benefit_level` ENUM('NO_COVERAGE', 'RATE_80', 'RATE_95', 'RATE_100') NULL,
    `health_insurance_benefit_rate_snapshot` VARCHAR(10) NULL,
    `health_insurance_eligible_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `health_insurance_ceiling_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `health_insurance_fund_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `patient_co_pay_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `index_invoice_item_invoice`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance_claims` (
    `id` VARCHAR(36) NOT NULL,
    `invoice_id` VARCHAR(36) NOT NULL,
    `status` ENUM('draft', 'exported_xml', 'voided') NOT NULL DEFAULT 'draft',
    `void_reason` VARCHAR(100) NULL,
    `voided_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `health_insurance_claims_invoice_id_key`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_intents` (
    `id` VARCHAR(36) NOT NULL,
    `invoice_id` VARCHAR(36) NOT NULL,
    `momo_order_id` VARCHAR(80) NOT NULL,
    `request_id` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('pending', 'paid', 'expired', 'failed') NOT NULL DEFAULT 'pending',
    `pay_url` VARCHAR(1000) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `idempotency_key` VARCHAR(36) NOT NULL,
    `trans_id` VARCHAR(80) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_intents_momo_order_id_key`(`momo_order_id`),
    UNIQUE INDEX `payment_intents_idempotency_key_key`(`idempotency_key`),
    INDEX `index_payment_intent_invoice`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_ipn_logs` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(80) NULL,
    `trans_id` VARCHAR(80) NULL,
    `result_code` INTEGER NULL,
    `signature_valid` BOOLEAN NOT NULL DEFAULT false,
    `processing` VARCHAR(40) NOT NULL,
    `raw_payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `index_payment_ipn_order`(`order_id`),
    INDEX `index_payment_ipn_trans`(`trans_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `idempotency_requests` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(36) NOT NULL,
    `route` VARCHAR(120) NOT NULL,
    `request_hash` VARCHAR(64) NULL,
    `status_code` INTEGER NOT NULL,
    `response_json` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `idempotency_requests_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_advances` (
    `id` VARCHAR(36) NOT NULL,
    `record_id` VARCHAR(36) NOT NULL,
    `type` ENUM('deposit', 'refund') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `method` ENUM('cash', 'momo') NOT NULL,
    `reason` VARCHAR(500) NULL,
    `receipt_number` VARCHAR(40) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_advances_receipt_number_key`(`receipt_number`),
    INDEX `index_payment_advance_record`(`record_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_write_off_approvals` (
    `id` VARCHAR(36) NOT NULL,
    `invoice_id` VARCHAR(36) NOT NULL,
    `record_id` VARCHAR(36) NOT NULL,
    `approved_invoice_version` INTEGER NOT NULL,
    `approved_by_user_id` VARCHAR(36) NOT NULL,
    `write_off_reason` VARCHAR(500) NOT NULL,
    `approved_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `emergency_write_off_approvals_invoice_id_key`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill khoa/phòng legacy mà user identity đang tham chiếu trước khi gắn FK.
INSERT INTO `departments` (`id`, `code`, `name`, `type`, `isActive`, `createdAt`, `updatedAt`)
SELECT
    legacy.`departmentId`,
    UPPER(SUBSTRING(MD5(legacy.`departmentId`), 1, 20)),
    CONCAT('Legacy department ', legacy.`departmentId`),
    'clinical',
    true,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM (
    SELECT DISTINCT `departmentId`
    FROM `users`
    WHERE `departmentId` IS NOT NULL
      AND `departmentId` <> ''
) legacy
LEFT JOIN `departments` existing_department
    ON existing_department.`id` = legacy.`departmentId`
WHERE existing_department.`id` IS NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queue_tickets` ADD CONSTRAINT `queue_tickets_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_catalog` ADD CONSTRAINT `service_catalog_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `beds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_diagnosedBy_fkey` FOREIGN KEY (`diagnosedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_diagnosisSignedBy_fkey` FOREIGN KEY (`diagnosisSignedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_vitalConfirmedBy_fkey` FOREIGN KEY (`vitalConfirmedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_closedBy_fkey` FOREIGN KEY (`closedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_orders` ADD CONSTRAINT `service_orders_serviceCatalogId_fkey` FOREIGN KEY (`serviceCatalogId`) REFERENCES `service_catalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beds` ADD CONSTRAINT `beds_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beds` ADD CONSTRAINT `beds_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_releasedBy_fkey` FOREIGN KEY (`releasedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `beds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_orders` ADD CONSTRAINT `treatment_orders_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_orders` ADD CONSTRAINT `treatment_orders_orderedBy_fkey` FOREIGN KEY (`orderedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_orders` ADD CONSTRAINT `treatment_orders_executedBy_fkey` FOREIGN KEY (`executedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_orders` ADD CONSTRAINT `treatment_orders_cancelledBy_fkey` FOREIGN KEY (`cancelledBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discharge_summaries` ADD CONSTRAINT `discharge_summaries_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discharge_summaries` ADD CONSTRAINT `discharge_summaries_signedBy_fkey` FOREIGN KEY (`signedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_test_types` ADD CONSTRAINT `lab_test_types_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_reference_ranges` ADD CONSTRAINT `lab_reference_ranges_labTestTypeId_fkey` FOREIGN KEY (`labTestTypeId`) REFERENCES `lab_test_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_labTestTypeId_fkey` FOREIGN KEY (`labTestTypeId`) REFERENCES `lab_test_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_orderedBy_fkey` FOREIGN KEY (`orderedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_resultedBy_fkey` FOREIGN KEY (`resultedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_signedBy_fkey` FOREIGN KEY (`signedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicine_batches` ADD CONSTRAINT `medicine_batches_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_prescribedBy_fkey` FOREIGN KEY (`prescribedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_signedBy_fkey` FOREIGN KEY (`signedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_cancelledBy_fkey` FOREIGN KEY (`cancelledBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_dispensedBy_fkey` FOREIGN KEY (`dispensedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vital_sign_logs` ADD CONSTRAINT `vital_sign_logs_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_cong_thuc_mau` ADD CONSTRAINT `xn_cong_thuc_mau_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_hoa_sinh_mau` ADD CONSTRAINT `xn_hoa_sinh_mau_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_nuoc_tieu` ADD CONSTRAINT `xn_nuoc_tieu_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_vi_sinh` ADD CONSTRAINT `xn_vi_sinh_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_mo_benh_hoc` ADD CONSTRAINT `xn_mo_benh_hoc_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xn_mo_benh_hoc` ADD CONSTRAINT `xn_mo_benh_hoc_bacSiGiaiPhauBenh_fkey` FOREIGN KEY (`bacSiGiaiPhauBenh`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_record_id_fkey` FOREIGN KEY (`record_id`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_insurance_claims` ADD CONSTRAINT `health_insurance_claims_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_advances` ADD CONSTRAINT `payment_advances_record_id_fkey` FOREIGN KEY (`record_id`) REFERENCES `medical_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_write_off_approvals` ADD CONSTRAINT `emergency_write_off_approvals_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

