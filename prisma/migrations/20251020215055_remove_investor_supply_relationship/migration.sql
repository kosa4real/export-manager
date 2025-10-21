/*
  Warnings:

  - You are about to drop the column `investorId` on the `supplies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."supplies" DROP CONSTRAINT "supplies_investorId_fkey";

-- DropIndex
DROP INDEX "public"."supplies_investorId_idx";

-- AlterTable
ALTER TABLE "supplies" DROP COLUMN "investorId";
