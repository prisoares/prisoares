-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "paymentDueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_courtId_startsAt_endsAt_idx" ON "Booking"("courtId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_partnerId_status_idx" ON "Booking"("partnerId", "status");

-- CreateIndex
CREATE INDEX "Payment_asaasChargeId_idx" ON "Payment"("asaasChargeId");
