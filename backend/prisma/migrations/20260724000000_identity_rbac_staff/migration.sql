CREATE TABLE `roles` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `isSystem` BOOLEAN NOT NULL DEFAULT true,
  `isPrivileged` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `roles_code_key`(`code`),
  CONSTRAINT `check_roles_code_format` CHECK (`code` REGEXP '^[a-z][a-z0-9_]{1,29}$')
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(10) NOT NULL,
  `dateOfBirth` DATE NOT NULL,
  `phoneNumber` VARCHAR(10) NOT NULL,
  `identityCardNumber` VARCHAR(12) NOT NULL,
  `departmentId` VARCHAR(36) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
  `authVersion` INTEGER NOT NULL DEFAULT 1,
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_username_key`(`username`),
  UNIQUE INDEX `users_identityCardNumber_key`(`identityCardNumber`),
  INDEX `users_isActive_idx`(`isActive`),
  INDEX `users_fullName_idx`(`fullName`),
  INDEX `users_departmentId_idx`(`departmentId`),
  CONSTRAINT `check_users_username_format` CHECK (`username` REGEXP '^[A-Za-z0-9._]{3,50}$'),
  CONSTRAINT `check_users_gender` CHECK (`gender` IN ('male', 'female')),
  CONSTRAINT `check_users_phone_format` CHECK (REGEXP_LIKE(`phoneNumber`, '^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$', 'c')),
  CONSTRAINT `check_users_identity_card_format` CHECK (`identityCardNumber` REGEXP '^[0-9]{12}$'),
  CONSTRAINT `check_users_auth_version` CHECK (`authVersion` > 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `roleCode` VARCHAR(30) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assignedBy` VARCHAR(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `permissions_userId_roleCode_key`(`userId`, `roleCode`),
  INDEX `permissions_roleCode_idx`(`roleCode`),
  CONSTRAINT `permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permissions_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `roles`(`code`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `roleCode` VARCHAR(30) NOT NULL,
  `actionCode` VARCHAR(80) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`roleCode`, `actionCode`),
  CONSTRAINT `role_permissions_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `roles`(`code`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rbac_policy_versions` (
  `revision` VARCHAR(40) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`revision`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
