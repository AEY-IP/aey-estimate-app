-- DropColumn
ALTER TABLE "estimates" DROP COLUMN "status";

-- CreateTable
CREATE TABLE "deleted_estimates" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalWorksPrice" DOUBLE PRECISION NOT NULL,
    "totalMaterialsPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "coefficientsData" TEXT,
    "coefficientSettings" TEXT,
    "manualPrices" TEXT,
    "estimateData" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "originalCreatedBy" TEXT NOT NULL,
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "originalUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deleted_estimates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deleted_estimates" ADD CONSTRAINT "deleted_estimates_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 