-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('door', 'terminal');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'submitted', 'pending_response', 'responded', 'accepted', 'rejected', 'booked', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'IN_TRANSIT', 'MAINTENANCE', 'LOST');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('CONTAINER', 'VESSEL');

-- CreateEnum
CREATE TYPE "DraftType" AS ENUM ('BL', 'SWB');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('OPEN', 'CORRECTION_SENT', 'APPROVED', 'RELEASED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "vatNumber" TEXT,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "pickupType" "DeliveryType" NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "containerType" TEXT NOT NULL,
    "containerQuantity" INTEGER NOT NULL,
    "weightPerContainer" DECIMAL(10,2) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL,
    "commodity" TEXT NOT NULL,
    "dangerousGoods" BOOLEAN NOT NULL,
    "imoClass" TEXT,
    "unNumber" TEXT,
    "shipperOwned" BOOLEAN NOT NULL,
    "multipleTypes" BOOLEAN NOT NULL,
    "offer" JSONB,
    "services" JSONB,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "contactReference" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "originDepot" TEXT NOT NULL,
    "pickupType" "DeliveryType" NOT NULL,
    "scheduleDate" TIMESTAMP(3),
    "scheduleWeeks" INTEGER,
    "via1" TEXT,
    "via2" TEXT,
    "destinationDepot" TEXT NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "exportMoT" TEXT,
    "importMoT" TEXT,
    "optimizeReefer" BOOLEAN NOT NULL DEFAULT false,
    "bolCount" INTEGER,
    "exportFiling" BOOLEAN NOT NULL DEFAULT false,
    "filingBy" TEXT,
    "remarks" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingContainer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "shipperOwned" BOOLEAN NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL,
    "dangerousGoods" BOOLEAN NOT NULL,
    "imoClass" TEXT,
    "unNumber" TEXT,
    "releaseDate" TIMESTAMP(3),
    "releaseTime" TIMESTAMP(3),

    CONSTRAINT "BookingContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomsReference" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT NOT NULL,

    CONSTRAINT "CustomsReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "containerNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ContainerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentDepot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "container_event" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "portUnlocode" TEXT,
    "portName" TEXT,
    "description" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "container_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL,
    "imo" TEXT,
    "mmsi" TEXT,
    "name" TEXT NOT NULL,
    "carrierId" TEXT,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VesselSchedule" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "portOfCallId" TEXT NOT NULL,
    "voyageNumber" TEXT NOT NULL,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "status" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VesselSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemurrageAlert" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "alert_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DemurrageAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APISnapshot" (
    "id" TEXT NOT NULL,
    "type" "SnapshotType" NOT NULL,
    "reference" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APISnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Port" (
    "id" TEXT NOT NULL,
    "unlocode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Port_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerTypeSpec" (
    "type" TEXT NOT NULL,
    "lengthMm" INTEGER NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "maxStackWeightKg" INTEGER NOT NULL,
    "tareWeightKg" INTEGER NOT NULL,

    CONSTRAINT "ContainerTypeSpec_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scacCode" TEXT NOT NULL,
    "apiCredentials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSheet" (
    "id" TEXT NOT NULL,
    "originPortId" TEXT NOT NULL,
    "destinationPortId" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "baseRate" DECIMAL(12,2) NOT NULL,
    "surchargePct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surcharge" (
    "id" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "surchargeType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Surcharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT,
    "quotationId" TEXT,
    "invoiceId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdiMessage" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ackStatus" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "EdiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountBalance" (
    "userId" TEXT NOT NULL,
    "creditLimit" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "AccountBalance_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "bookingId" TEXT,

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "quotationId" TEXT,
    "hsCode" TEXT NOT NULL,
    "dutiesAmount" DECIMAL(12,2) NOT NULL,
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraft" (
    "documentNo" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "DraftType" NOT NULL DEFAULT 'BL',
    "status" "DraftStatus" NOT NULL DEFAULT 'OPEN',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "BLDraft_pkey" PRIMARY KEY ("documentNo")
);

-- CreateTable
CREATE TABLE "BLDraftVersion" (
    "id" TEXT NOT NULL,
    "draftNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "BLDraftVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraftComment" (
    "id" TEXT NOT NULL,
    "draftNo" TEXT NOT NULL,
    "commenterId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BLDraftComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimDate" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "monthName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimPort" (
    "id" TEXT NOT NULL,
    "unlocode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimPort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimContainerType" (
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimContainerType_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "DimCarrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scacCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimCarrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactContainerStatus" (
    "id" TEXT NOT NULL,
    "dateId" INTEGER NOT NULL,
    "containerType" TEXT NOT NULL,
    "status" "ContainerStatus" NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "FactContainerStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactTradeLaneRevenue" (
    "id" TEXT NOT NULL,
    "dateId" INTEGER NOT NULL,
    "originPortId" TEXT NOT NULL,
    "destPortId" TEXT NOT NULL,
    "containerType" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "FactTradeLaneRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactOnTimePerformance" (
    "id" TEXT NOT NULL,
    "dateId" INTEGER NOT NULL,
    "carrierId" TEXT NOT NULL,
    "onTimePct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "FactOnTimePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quotationId_key" ON "Booking"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "Container_containerNo_key" ON "Container"("containerNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_imo_key" ON "Vessel"("imo");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_mmsi_key" ON "Vessel"("mmsi");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Port_unlocode_key" ON "Port"("unlocode");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_scacCode_key" ON "Carrier"("scacCode");

-- CreateIndex
CREATE UNIQUE INDEX "BLDraft_documentId_key" ON "BLDraft"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "BLDraftVersion_documentId_key" ON "BLDraftVersion"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DimDate_date_key" ON "DimDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DimPort_unlocode_key" ON "DimPort"("unlocode");

-- CreateIndex
CREATE UNIQUE INDEX "DimCarrier_scacCode_key" ON "DimCarrier"("scacCode");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingContainer" ADD CONSTRAINT "BookingContainer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomsReference" ADD CONSTRAINT "CustomsReference_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Port"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselSchedule" ADD CONSTRAINT "VesselSchedule_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselSchedule" ADD CONSTRAINT "VesselSchedule_portOfCallId_fkey" FOREIGN KEY ("portOfCallId") REFERENCES "Port"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemurrageAlert" ADD CONSTRAINT "DemurrageAlert_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_originPortId_fkey" FOREIGN KEY ("originPortId") REFERENCES "Port"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSheet" ADD CONSTRAINT "RateSheet_destinationPortId_fkey" FOREIGN KEY ("destinationPortId") REFERENCES "Port"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountBalance" ADD CONSTRAINT "AccountBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftVersion" ADD CONSTRAINT "BLDraftVersion_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("documentNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftVersion" ADD CONSTRAINT "BLDraftVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftVersion" ADD CONSTRAINT "BLDraftVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftComment" ADD CONSTRAINT "BLDraftComment_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("documentNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftComment" ADD CONSTRAINT "BLDraftComment_commenterId_fkey" FOREIGN KEY ("commenterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactContainerStatus" ADD CONSTRAINT "FactContainerStatus_dateId_fkey" FOREIGN KEY ("dateId") REFERENCES "DimDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactContainerStatus" ADD CONSTRAINT "FactContainerStatus_containerType_fkey" FOREIGN KEY ("containerType") REFERENCES "DimContainerType"("type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactTradeLaneRevenue" ADD CONSTRAINT "FactTradeLaneRevenue_dateId_fkey" FOREIGN KEY ("dateId") REFERENCES "DimDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactTradeLaneRevenue" ADD CONSTRAINT "FactTradeLaneRevenue_originPortId_fkey" FOREIGN KEY ("originPortId") REFERENCES "DimPort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactTradeLaneRevenue" ADD CONSTRAINT "FactTradeLaneRevenue_destPortId_fkey" FOREIGN KEY ("destPortId") REFERENCES "DimPort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactTradeLaneRevenue" ADD CONSTRAINT "FactTradeLaneRevenue_containerType_fkey" FOREIGN KEY ("containerType") REFERENCES "DimContainerType"("type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactTradeLaneRevenue" ADD CONSTRAINT "FactTradeLaneRevenue_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "DimCarrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactOnTimePerformance" ADD CONSTRAINT "FactOnTimePerformance_dateId_fkey" FOREIGN KEY ("dateId") REFERENCES "DimDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactOnTimePerformance" ADD CONSTRAINT "FactOnTimePerformance_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "DimCarrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
