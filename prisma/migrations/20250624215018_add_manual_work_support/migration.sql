-- DropForeignKey
ALTER TABLE "act_works" DROP CONSTRAINT "act_works_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "estimate_works" DROP CONSTRAINT "estimate_works_workItemId_fkey";

-- AlterTable
ALTER TABLE "act_works" ADD COLUMN     "manualWorkName" TEXT,
ADD COLUMN     "manualWorkUnit" TEXT,
ALTER COLUMN "workItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "estimate_works" ADD COLUMN     "manualWorkName" TEXT,
ADD COLUMN     "manualWorkUnit" TEXT,
ALTER COLUMN "workItemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "estimate_works" ADD CONSTRAINT "estimate_works_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "act_works" ADD CONSTRAINT "act_works_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
