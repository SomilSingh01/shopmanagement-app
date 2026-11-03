/*
  Warnings:

  - Added the required column `userId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `dimensions` VARCHAR(191) NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('STANDARD', 'RAW_MATERIAL', 'FINISHED_GOOD') NOT NULL DEFAULT 'STANDARD',
    ADD COLUMN `unit` VARCHAR(191) NOT NULL DEFAULT 'pcs',
    ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `businessType` ENUM('B2B', 'B2C') NOT NULL DEFAULT 'B2C',
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `shopAddress` VARCHAR(191) NULL,
    ADD COLUMN `shopCategory` VARCHAR(191) NULL,
    ADD COLUMN `shopName` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `BOMItem` (
    `id` VARCHAR(191) NOT NULL,
    `finishedGoodId` VARCHAR(191) NOT NULL,
    `rawMaterialId` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `BOMItem_finishedGoodId_idx`(`finishedGoodId`),
    INDEX `BOMItem_rawMaterialId_idx`(`rawMaterialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManufacturingOrder` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `ManufacturingOrder_productId_idx`(`productId`),
    INDEX `ManufacturingOrder_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OTP` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OTP_email_code_idx`(`email`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Customer_name_idx` ON `Customer`(`name`);

-- CreateIndex
CREATE INDEX `Customer_phone_idx` ON `Customer`(`phone`);

-- CreateIndex
CREATE INDEX `Order_status_idx` ON `Order`(`status`);

-- CreateIndex
CREATE INDEX `Product_name_idx` ON `Product`(`name`);

-- CreateIndex
CREATE INDEX `Product_userId_idx` ON `Product`(`userId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BOMItem` ADD CONSTRAINT `BOMItem_finishedGoodId_fkey` FOREIGN KEY (`finishedGoodId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BOMItem` ADD CONSTRAINT `BOMItem_rawMaterialId_fkey` FOREIGN KEY (`rawMaterialId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BOMItem` ADD CONSTRAINT `BOMItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManufacturingOrder` ADD CONSTRAINT `ManufacturingOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManufacturingOrder` ADD CONSTRAINT `ManufacturingOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
