ALTER TABLE `generate_records`
  ADD COLUMN `openid` VARCHAR(64) NULL,
  MODIFY `type` ENUM('watermark', 'title', 'copywriting') NOT NULL;

DROP INDEX `generate_records_user_id_type_created_at_idx` ON `generate_records`;

ALTER TABLE `generate_records`
  DROP COLUMN `user_id`;

CREATE INDEX `generate_records_openid_type_created_at_idx`
  ON `generate_records` (`openid`, `type`, `created_at`);

CREATE TABLE `favorites` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(64) NOT NULL,
  `type` ENUM('watermark', 'title', 'copywriting') NOT NULL,
  `ref_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `summary` TEXT NULL,
  `payload` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `favorites_openid_type_ref_id_key` (`openid`, `type`, `ref_id`),
  INDEX `favorites_openid_type_created_at_idx` (`openid`, `type`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
