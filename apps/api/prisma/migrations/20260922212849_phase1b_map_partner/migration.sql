-- CreateEnum
CREATE TYPE "MapFeeStatus" AS ENUM ('pending', 'paid', 'overdue', 'stub');

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "mapVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CourtWeeklyAvailability" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtBlock" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFeeInvoice" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "gmvCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "status" "MapFeeStatus" NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "asaasChargeId" TEXT,
    "pixCopyPaste" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapFeeInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtWeeklyAvailability_courtId_idx" ON "CourtWeeklyAvailability"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "CourtWeeklyAvailability_courtId_dayOfWeek_key" ON "CourtWeeklyAvailability"("courtId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "CourtBlock_courtId_startsAt_endsAt_idx" ON "CourtBlock"("courtId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "MapFeeInvoice_status_dueAt_idx" ON "MapFeeInvoice"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "MapFeeInvoice_venueId_year_month_key" ON "MapFeeInvoice"("venueId", "year", "month");

-- CreateIndex
CREATE INDEX "Venue_mapVisible_active_idx" ON "Venue"("mapVisible", "active");

-- AddForeignKey
ALTER TABLE "CourtWeeklyAvailability" ADD CONSTRAINT "CourtWeeklyAvailability_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtBlock" ADD CONSTRAINT "CourtBlock_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFeeInvoice" ADD CONSTRAINT "MapFeeInvoice_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
