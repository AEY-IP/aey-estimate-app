/*
  Warnings:

  - Added the required column `updatedAt` to the `coefficients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coefficients" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
