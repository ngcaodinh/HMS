-- Đồng bộ treatmentType với workflow: hồ sơ chỉ có hướng điều trị sau khi ký chẩn đoán.
UPDATE `medical_records`
SET `treatmentType` = NULL
WHERE `status` NOT IN ('diagnosed', 'closed')
  AND `treatmentType` IS NOT NULL;

ALTER TABLE `medical_records`
  MODIFY `treatmentType` ENUM('outpatient', 'inpatient') NULL;

-- Khôi phục các giá trị sinh hiệu có thể lấy an toàn từ snapshot trước khi siết NOT NULL.
UPDATE `vital_sign_logs` AS `log`
INNER JOIN `medical_records` AS `record` ON `record`.`id` = `log`.`recordId`
SET
  `log`.`pulse` = COALESCE(`log`.`pulse`, JSON_UNQUOTE(JSON_EXTRACT(`record`.`vitalSigns`, '$.pulse'))),
  `log`.`bloodPressureSystolic` = COALESCE(
    `log`.`bloodPressureSystolic`,
    JSON_UNQUOTE(JSON_EXTRACT(`record`.`vitalSigns`, '$.bloodPressureSystolic'))
  ),
  `log`.`bloodPressureDiastolic` = COALESCE(
    `log`.`bloodPressureDiastolic`,
    JSON_UNQUOTE(JSON_EXTRACT(`record`.`vitalSigns`, '$.bloodPressureDiastolic'))
  ),
  `log`.`spo2` = COALESCE(`log`.`spo2`, JSON_UNQUOTE(JSON_EXTRACT(`record`.`vitalSigns`, '$.spo2'))),
  `log`.`recordedBy` = COALESCE(`log`.`recordedBy`, `record`.`vitalConfirmedBy`)
WHERE `log`.`pulse` IS NULL
   OR `log`.`bloodPressureSystolic` IS NULL
   OR `log`.`bloodPressureDiastolic` IS NULL
   OR `log`.`spo2` IS NULL
   OR `log`.`recordedBy` IS NULL;

-- Nếu vẫn còn NULL, dừng migration để không tạo bản ghi sinh hiệu thiếu audit/dữ liệu.
-- Preflight đọc-only để chạy trước deployment:
-- SELECT COUNT(*) AS missing_vital_data
-- FROM `vital_sign_logs`
-- WHERE `pulse` IS NULL
--    OR `bloodPressureSystolic` IS NULL
--    OR `bloodPressureDiastolic` IS NULL
--    OR `spo2` IS NULL
--    OR `recordedBy` IS NULL;
-- ALTER TABLE bên dưới cố ý fail nếu kết quả preflight khác 0.
ALTER TABLE `vital_sign_logs`
  MODIFY `pulse` INTEGER NOT NULL,
  MODIFY `temperatureC` DECIMAL(3, 1) NULL,
  MODIFY `bloodPressureSystolic` INTEGER NOT NULL,
  MODIFY `bloodPressureDiastolic` INTEGER NOT NULL,
  MODIFY `spo2` INTEGER NOT NULL,
  MODIFY `recordedBy` VARCHAR(36) NOT NULL;
