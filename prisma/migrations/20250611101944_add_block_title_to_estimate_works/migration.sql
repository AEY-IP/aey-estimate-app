-- AlterTable
ALTER TABLE "estimate_works" ADD COLUMN     "blockTitle" TEXT;

-- CreateTable
CREATE TABLE "estimate_room_parameter_values" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimateId" TEXT,
    "roomId" TEXT,

    CONSTRAINT "estimate_room_parameter_values_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "estimate_room_parameter_values" ADD CONSTRAINT "estimate_room_parameter_values_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "room_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_room_parameter_values" ADD CONSTRAINT "estimate_room_parameter_values_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_room_parameter_values" ADD CONSTRAINT "estimate_room_parameter_values_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "estimate_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
