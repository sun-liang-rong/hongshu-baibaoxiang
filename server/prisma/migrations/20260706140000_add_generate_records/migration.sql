CREATE TABLE `generate_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NULL,
  `type` ENUM('title', 'copywriting') NOT NULL,
  `topic` VARCHAR(191) NOT NULL,
  `input` JSON NOT NULL,
  `output` JSON NULL,
  `title` VARCHAR(191) NULL,
  `summary` VARCHAR(191) NULL,
  `status` ENUM('success', 'failed') NOT NULL DEFAULT 'success',
  `ai_provider` VARCHAR(191) NULL,
  `ai_model` VARCHAR(191) NULL,
  `prompt_version` VARCHAR(191) NULL,
  `error_message` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `generate_records_user_id_type_created_at_idx` (`user_id`, `type`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
