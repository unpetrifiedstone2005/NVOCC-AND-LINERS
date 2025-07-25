-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'CLIENT');

-- CreateEnum
CREATE TYPE "ContainerGroup" AS ENUM ('DRY_STANDARD', 'DRY_HC', 'REEFER', 'OPEN_TOP');

-- CreateEnum
CREATE TYPE "Leg" AS ENUM ('EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('door', 'terminal');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'submitted', 'pending_response', 'responded', 'accepted', 'rejected', 'booked', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb', 't');

-- CreateEnum
CREATE TYPE "VolumeUnit" AS ENUM ('m3', 'ft3', 'l');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'DAMAGED', 'IN_TRANSIT', 'MAINTENANCE', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SurchargeType" AS ENUM ('BASE_FREIGHT', 'BUNKER_ADJUSTMENT_FACTOR', 'CURRENCY_ADJUSTMENT_FACTOR', 'PEAK_SEASON_SURCHARGE', 'WAR_RISK_SURCHARGE', 'EMERGENCY_RISK_SURCHARGE', 'TERMINAL_HANDLING_CHARGE', 'SECURITY_ISPS_SURCHARGE', 'PORT_CONGESTION_SURCHARGE', 'DANGEROUS_GOODS_SURCHARGE', 'OVERWEIGHT_OUT_OF_GAUGE_CHARGE', 'REEFER_SURCHARGE', 'DECLARED_VALUE_SURCHARGE', 'DOCUMENTATION_ADMIN_FEE', 'SIGNATURE_SURCHARGE', 'ADDRESS_CORRECTION_SURCHARGE', 'RESIDENTIAL_DELIVERY_SURCHARGE', 'DELIVERY_AREA_SURCHARGE', 'SATURDAY_DELIVERY_SURCHARGE', 'ADDITIONAL_HANDLING_SURCHARGE');

-- CreateEnum
CREATE TYPE "SurchargeScope" AS ENUM ('FREIGHT', 'ORIGIN', 'DESTINATION', 'DOCUMENTAION');

-- CreateEnum
CREATE TYPE "DeliveryOrderRecipientType" AS ENUM ('TRUCKER', 'CONSIGNEE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryOrderStatus" AS ENUM ('PENDING', 'ISSUED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeclarationType" AS ENUM ('CUSTOMS', 'DG');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('CONTAINER', 'VESSEL');

-- CreateEnum
CREATE TYPE "DraftType" AS ENUM ('BL', 'SWB');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('OPEN', 'CORRECTION_SENT', 'APPROVED', 'RELEASED', 'EXCEEDS_CAPACITY', 'PRICE_CHANGE_PENDING');

-- CreateEnum
CREATE TYPE "CustomsReferenceType" AS ENUM ('INVOICE', 'PACKING_LIST');

-- CreateEnum
CREATE TYPE "LegType" AS ENUM ('ORIGIN_HAULAGE', 'OCEAN_LEG', 'DEST_HAULAGE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "countryCode" CHAR(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "vatNumber" TEXT,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetentionTerm" (
    "id" TEXT NOT NULL,
    "depotId" TEXT,
    "carrierId" TEXT,
    "freeDays" INTEGER NOT NULL,
    "ratePerDay" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "DetentionTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CROContainer" (
    "id" TEXT NOT NULL,
    "croId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "handedOverAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CROContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerReleaseOrder" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "releasedToType" TEXT NOT NULL,
    "releasedToId" TEXT NOT NULL,
    "depotUnlocode" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freeDays" INTEGER NOT NULL,
    "detentionTermId" TEXT,
    "ratePerDay" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerReleaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "startIsPort" BOOLEAN NOT NULL DEFAULT true,
    "endLocation" TEXT NOT NULL,
    "endIsPort" BOOLEAN NOT NULL DEFAULT true,
    "pickupType" "DeliveryType" NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "commodity" TEXT NOT NULL,
    "shipperOwned" BOOLEAN NOT NULL,
    "multipleTypes" BOOLEAN NOT NULL,
    "offer" JSONB,
    "status" "QuotationStatus" NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLine" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "glCode" TEXT,
    "costCenter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ratePerUnit" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationContainer" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "containerTypeIsoCode" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "weightPerContainer" DECIMAL(65,30) NOT NULL,
    "weightUnit" TEXT NOT NULL,

    CONSTRAINT "QuotationContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationContainerService" (
    "id" TEXT NOT NULL,
    "quotationContainerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "ratePerUnitSnapshot" DECIMAL(12,2) NOT NULL,
    "currencySnapshot" TEXT NOT NULL,

    CONSTRAINT "QuotationContainerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voyage" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "voyageNumber" TEXT,
    "departure" TIMESTAMP(3) NOT NULL,
    "arrival" TIMESTAMP(3),

    CONSTRAINT "Voyage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortCall" (
    "id" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "portCode" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "eta" TIMESTAMP(3),
    "etd" TIMESTAMP(3),
    "vesselName" TEXT,

    CONSTRAINT "PortCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRouting" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "pol" TEXT NOT NULL,
    "pod" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "importHaulage" "DeliveryType" NOT NULL,
    "commodity" TEXT NOT NULL,

    CONSTRAINT "QuotationRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "customerName" TEXT,
    "contactReference" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "startLocation" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3),
    "vgmCutOffAt" TIMESTAMP(3),
    "siCutOffAt" TIMESTAMP(3),
    "blCutOffAt" TIMESTAMP(3),
    "pickupOption" "DeliveryType" NOT NULL,
    "via1" TEXT,
    "via2" TEXT,
    "endLocation" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "deliveryOption" "DeliveryType" NOT NULL,
    "exportMOT" TEXT,
    "importMOT" TEXT,
    "optimizeReefer" BOOLEAN NOT NULL DEFAULT false,
    "selectedRoutingId" TEXT,
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
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "shipperOwned" BOOLEAN NOT NULL DEFAULT false,
    "releaseDate" TIMESTAMP(3),

    CONSTRAINT "BookingContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCargo" (
    "id" TEXT NOT NULL,
    "bookingContainerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "cargoWeight" DECIMAL(12,2) NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "dgDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomsReference" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "CustomsReferenceType" NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "containerNo" TEXT NOT NULL,
    "bicCode" TEXT,
    "containerTypeIsoCode" TEXT NOT NULL,
    "ownership" TEXT,
    "companyOrigin" TEXT,
    "manufacturer" TEXT,
    "customsApproval" TEXT,
    "description" TEXT,
    "status" "ContainerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentDepot" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cscPlateUrl" TEXT,
    "certificationExpiry" TIMESTAMP(3),
    "foodGrade" BOOLEAN,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VGMTransmission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "croContainerId" TEXT NOT NULL,
    "verifiedWeight" DOUBLE PRECISION NOT NULL,
    "providerSignature" TEXT NOT NULL,
    "shipperCompany" TEXT NOT NULL,
    "determinationDate" TIMESTAMP(3),
    "solasMethod" TEXT,
    "solasCertificate" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VGMTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiCargo" (
    "id" TEXT NOT NULL,
    "shippingInstructionContainerId" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grossWeight" DECIMAL(10,2),
    "netWeight" DECIMAL(10,2),
    "noOfPackages" INTEGER,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "unNumber" TEXT,
    "imoClass" TEXT,
    "packingGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "sealNumber" TEXT,

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
    "operationType" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VesselSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "ifsc" TEXT,
    "iban" TEXT,
    "swift" TEXT,
    "bankAddress" TEXT,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "leg" "Leg" NOT NULL,
    "description" TEXT,
    "bankAccountId" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "glCode" TEXT,
    "costCenter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ContainerType" (
    "isoCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lengthMm" INTEGER NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "maxStackWeightKg" INTEGER NOT NULL,
    "tareWeightKg" INTEGER NOT NULL,
    "maxGrossWeightKg" INTEGER NOT NULL,
    "group" "ContainerGroup" NOT NULL,
    "teuFactor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ContainerType_pkey" PRIMARY KEY ("isoCode")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "serviceId" TEXT NOT NULL,
    "pol" TEXT NOT NULL,
    "pod" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "group" "ContainerGroup" NOT NULL,
    "ratePerTeu" DECIMAL(12,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("serviceId","pol","pod","commodity","group","validFrom")
);

-- CreateTable
CREATE TABLE "SurchargeDef" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "SurchargeScope" NOT NULL,
    "portCode" TEXT,
    "serviceCode" TEXT,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "SurchargeDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurchargeRate" (
    "id" TEXT NOT NULL,
    "surchargeDefId" TEXT NOT NULL,
    "containerTypeIsoCode" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SurchargeRate_pkey" PRIMARY KEY ("id")
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
    "declarationId" TEXT,
    "shippingInstructionId" TEXT,
    "croId" TEXT,
    "deliveryOrderId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInstruction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "consignee" TEXT NOT NULL,
    "notifyParty" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "placeOfReceipt" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "finalDestination" TEXT,
    "specialRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SIVersion" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "data" JSONB NOT NULL,
    "note" TEXT,

    CONSTRAINT "SIVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingInstructionContainer" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "containerNumber" TEXT,
    "seals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marksAndNumbers" TEXT,
    "hsCode" TEXT,

    CONSTRAINT "ShippingInstructionContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingList" (
    "id" TEXT NOT NULL,
    "shippingInstructionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingListItem" (
    "id" TEXT NOT NULL,
    "packingListId" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "netWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "marksAndNumbers" TEXT,

    CONSTRAINT "PackingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EGM" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "blDraftVersionId" TEXT NOT NULL,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "portOfLoading" TEXT NOT NULL,
    "portOfDischarge" TEXT NOT NULL,
    "manifestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EGM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EGMContainer" (
    "id" TEXT NOT NULL,
    "egmId" TEXT NOT NULL,
    "containerNo" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "grossWeight" DECIMAL(12,2) NOT NULL,
    "netWeight" DECIMAL(12,2),
    "noOfPackages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EGMContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IGM" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "portOfLoading" TEXT NOT NULL,
    "portOfDischarge" TEXT NOT NULL,
    "manifestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IGM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArrivalNotice" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArrivalNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDeclaration" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_order" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "recipientType" "DeliveryOrderRecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "deliveryLocation" TEXT,
    "status" "DeliveryOrderStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemurrageTerm" (
    "id" TEXT NOT NULL,
    "portCode" TEXT,
    "freeDays" INTEGER NOT NULL,
    "ratePerDay" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "DemurrageTerm_pkey" PRIMARY KEY ("id")
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
    "shippingInstructionId" TEXT NOT NULL,
    "declarationType" "DeclarationType" NOT NULL,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'PENDING',
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(12,2),
    "currency" CHAR(3),
    "dutiesAmount" DECIMAL(12,2),
    "emergencyContact" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclarationLine" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "cargoId" TEXT,
    "unNumber" TEXT NOT NULL,
    "properShippingName" TEXT NOT NULL,
    "imoClass" TEXT NOT NULL,
    "packingGroup" TEXT NOT NULL,
    "flashPointC" DECIMAL(6,2),
    "flashPointF" DECIMAL(6,2),
    "packageType" TEXT NOT NULL,
    "numberOfPackages" INTEGER NOT NULL,
    "netWeight" DECIMAL(12,2) NOT NULL,
    "netWeightUnit" "WeightUnit" NOT NULL,
    "grossWeight" DECIMAL(12,2),
    "grossWeightUnit" "WeightUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclarationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraft" (
    "id" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "DraftType" NOT NULL DEFAULT 'BL',
    "status" "DraftStatus" NOT NULL DEFAULT 'OPEN',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "originDepot" TEXT,
    "destinationDepot" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "pickupType" "DeliveryType",
    "deliveryType" "DeliveryType",
    "scheduleDate" TIMESTAMP(3),
    "scheduleWeeks" INTEGER,
    "via1" TEXT,
    "via2" TEXT,
    "remarks" TEXT,
    "bolCount" INTEGER,
    "shipper" TEXT,
    "shippersReference" TEXT,
    "carriersReference" TEXT,
    "uniqueConsignmentRef" TEXT,
    "consignee" TEXT,
    "carrierName" TEXT,
    "notifyParty" TEXT,
    "additionalNotifyParty" TEXT,
    "preCarriageBy" TEXT,
    "vesselOrAircraft" TEXT,
    "voyageNo" TEXT,
    "placeOfReceipt" TEXT,
    "finalDestination" TEXT,
    "shippedOnBoardDate" TIMESTAMP(3),
    "marksAndNumbers" TEXT,
    "kindAndNoOfPackages" TEXT,
    "descriptionOfGoods" TEXT,
    "netWeightKg" DOUBLE PRECISION,
    "grossWeightKg" DOUBLE PRECISION,
    "measurementsM3" DOUBLE PRECISION,
    "totalThisPage" TEXT,
    "consignmentTotal" TEXT,
    "incoterms2020" TEXT,
    "payableAt" TEXT,
    "freightCharges" TEXT,
    "termsAndConditions" TEXT,
    "placeAndDateOfIssue" TEXT,
    "signatoryCompany" TEXT,
    "authorizedSignatory" TEXT,
    "signature" TEXT,
    "documentType" TEXT,
    "numberOfFreightedOriginalBLs" INTEGER,
    "numberOfFreightedCopies" INTEGER,
    "numberOfUnfreightedOriginalBLs" INTEGER,
    "numberOfUnfreightedCopies" INTEGER,
    "placeOfIssue" TEXT,
    "dateOfIssue" TIMESTAMP(3),
    "freightPayableAtDetails" TEXT,
    "freightTerms" TEXT,
    "currency" TEXT,
    "exchangeRate" DOUBLE PRECISION,
    "forwardingAgent" TEXT,
    "exportReference" TEXT,
    "notifyAddress" TEXT,
    "grossVolumeM3" DOUBLE PRECISION,
    "netVolumeM3" DOUBLE PRECISION,
    "outerPackingType" TEXT,
    "numberOfOuterPacking" INTEGER,
    "imoClass" TEXT,
    "unNumber" TEXT,
    "customsReference" TEXT,
    "sealNumbers" TEXT,
    "instructions" TEXT,
    "deliveryInstructions" TEXT,
    "remarksToCarrier" TEXT,
    "serviceContractNumber" TEXT,
    "bookingReference" TEXT,

    CONSTRAINT "BLDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraftContainer" (
    "id" TEXT NOT NULL,
    "bLDraftId" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "sealNumber" TEXT,
    "sizeType" TEXT,
    "kindOfPackages" TEXT,
    "noOfPackages" INTEGER,
    "descriptionOfGoods" TEXT,
    "grossWeight" DOUBLE PRECISION,
    "grossWeightUnit" "WeightUnit",
    "netWeight" DOUBLE PRECISION,
    "netWeightUnit" "WeightUnit",
    "grossVolume" DOUBLE PRECISION,
    "grossVolumeUnit" "VolumeUnit",
    "netVolume" DOUBLE PRECISION,
    "netVolumeUnit" "VolumeUnit",
    "measurementsM3" DOUBLE PRECISION,

    CONSTRAINT "BLDraftContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraftCargo" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "grossVolume" DOUBLE PRECISION,
    "noOfPackages" INTEGER,
    "netWeight" DOUBLE PRECISION,
    "netVolume" DOUBLE PRECISION,
    "marksAndNumbers" TEXT,
    "outerPacking" TEXT,
    "sealNo" TEXT,
    "sealNoOptional" TEXT,
    "customerLoadReference" TEXT,
    "isDangerous" BOOLEAN,
    "unNumber" TEXT,
    "imoClass" TEXT,
    "packingGroup" TEXT,

    CONSTRAINT "BLDraftCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BLDraftVersion" (
    "id" TEXT NOT NULL,
    "draftNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "snapshot" JSONB NOT NULL,

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
CREATE UNIQUE INDEX "ContainerReleaseOrder_bookingId_key" ON "ContainerReleaseOrder"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationContainerService_quotationContainerId_serviceId_key" ON "QuotationContainerService"("quotationContainerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSchedule_code_key" ON "ServiceSchedule"("code");

-- CreateIndex
CREATE INDEX "Voyage_serviceId_idx" ON "Voyage"("serviceId");

-- CreateIndex
CREATE INDEX "Voyage_departure_idx" ON "Voyage"("departure");

-- CreateIndex
CREATE INDEX "Voyage_arrival_idx" ON "Voyage"("arrival");

-- CreateIndex
CREATE INDEX "PortCall_portCode_idx" ON "PortCall"("portCode");

-- CreateIndex
CREATE INDEX "PortCall_voyageId_order_idx" ON "PortCall"("voyageId", "order");

-- CreateIndex
CREATE INDEX "PortCall_eta_idx" ON "PortCall"("eta");

-- CreateIndex
CREATE INDEX "PortCall_etd_idx" ON "PortCall"("etd");

-- CreateIndex
CREATE INDEX "QuotationRouting_quotationId_idx" ON "QuotationRouting"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationRouting_serviceId_idx" ON "QuotationRouting"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quotationId_key" ON "Booking"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "Container_containerNo_key" ON "Container"("containerNo");

-- CreateIndex
CREATE INDEX "VGMTransmission_bookingId_idx" ON "VGMTransmission"("bookingId");

-- CreateIndex
CREATE INDEX "VGMTransmission_croContainerId_idx" ON "VGMTransmission"("croContainerId");

-- CreateIndex
CREATE UNIQUE INDEX "VGMTransmission_bookingId_croContainerId_key" ON "VGMTransmission"("bookingId", "croContainerId");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_imo_key" ON "Vessel"("imo");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_mmsi_key" ON "Vessel"("mmsi");

-- CreateIndex
CREATE UNIQUE INDEX "VesselSchedule_vesselId_portOfCallId_voyageNumber_operation_key" ON "VesselSchedule"("vesselId", "portOfCallId", "voyageNumber", "operationType", "etd");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_leg_key" ON "Invoice"("bookingId", "leg");

-- CreateIndex
CREATE UNIQUE INDEX "Port_unlocode_key" ON "Port"("unlocode");

-- CreateIndex
CREATE INDEX "SurchargeDef_scope_portCode_idx" ON "SurchargeDef"("scope", "portCode");

-- CreateIndex
CREATE INDEX "SurchargeDef_scope_serviceCode_idx" ON "SurchargeDef"("scope", "serviceCode");

-- CreateIndex
CREATE INDEX "SurchargeRate_surchargeDefId_containerTypeIsoCode_idx" ON "SurchargeRate"("surchargeDefId", "containerTypeIsoCode");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInstruction_bookingId_key" ON "ShippingInstruction"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "EGM_bookingId_key" ON "EGM"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "EGM_blDraftVersionId_key" ON "EGM"("blDraftVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "IGM_bookingId_key" ON "IGM"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_order_bookingId_key" ON "delivery_order"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_shippingInstructionId_key" ON "Declaration"("shippingInstructionId");

-- CreateIndex
CREATE UNIQUE INDEX "BLDraft_documentId_key" ON "BLDraft"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DimDate_date_key" ON "DimDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DimPort_unlocode_key" ON "DimPort"("unlocode");

-- CreateIndex
CREATE UNIQUE INDEX "DimCarrier_scacCode_key" ON "DimCarrier"("scacCode");

-- AddForeignKey
ALTER TABLE "CROContainer" ADD CONSTRAINT "CROContainer_croId_fkey" FOREIGN KEY ("croId") REFERENCES "ContainerReleaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CROContainer" ADD CONSTRAINT "CROContainer_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerReleaseOrder" ADD CONSTRAINT "ContainerReleaseOrder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerReleaseOrder" ADD CONSTRAINT "ContainerReleaseOrder_detentionTermId_fkey" FOREIGN KEY ("detentionTermId") REFERENCES "DetentionTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainer" ADD CONSTRAINT "QuotationContainer_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainerService" ADD CONSTRAINT "QuotationContainerService_quotationContainerId_fkey" FOREIGN KEY ("quotationContainerId") REFERENCES "QuotationContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationContainerService" ADD CONSTRAINT "QuotationContainerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voyage" ADD CONSTRAINT "Voyage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortCall" ADD CONSTRAINT "PortCall_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRouting" ADD CONSTRAINT "QuotationRouting_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingContainer" ADD CONSTRAINT "BookingContainer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCargo" ADD CONSTRAINT "BookingCargo_bookingContainerId_fkey" FOREIGN KEY ("bookingContainerId") REFERENCES "BookingContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomsReference" ADD CONSTRAINT "CustomsReference_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VGMTransmission" ADD CONSTRAINT "VGMTransmission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VGMTransmission" ADD CONSTRAINT "VGMTransmission_croContainerId_fkey" FOREIGN KEY ("croContainerId") REFERENCES "CROContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiCargo" ADD CONSTRAINT "SiCargo_shippingInstructionContainerId_fkey" FOREIGN KEY ("shippingInstructionContainerId") REFERENCES "ShippingInstructionContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_event" ADD CONSTRAINT "container_event_portUnlocode_fkey" FOREIGN KEY ("portUnlocode") REFERENCES "Port"("unlocode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselSchedule" ADD CONSTRAINT "VesselSchedule_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VesselSchedule" ADD CONSTRAINT "VesselSchedule_portOfCallId_fkey" FOREIGN KEY ("portOfCallId") REFERENCES "Port"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemurrageAlert" ADD CONSTRAINT "DemurrageAlert_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurchargeRate" ADD CONSTRAINT "SurchargeRate_surchargeDefId_fkey" FOREIGN KEY ("surchargeDefId") REFERENCES "SurchargeDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurchargeRate" ADD CONSTRAINT "SurchargeRate_containerTypeIsoCode_fkey" FOREIGN KEY ("containerTypeIsoCode") REFERENCES "ContainerType"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_croId_fkey" FOREIGN KEY ("croId") REFERENCES "ContainerReleaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "delivery_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInstruction" ADD CONSTRAINT "ShippingInstruction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIVersion" ADD CONSTRAINT "SIVersion_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIVersion" ADD CONSTRAINT "SIVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingInstructionContainer" ADD CONSTRAINT "ShippingInstructionContainer_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingList" ADD CONSTRAINT "PackingList_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingListItem" ADD CONSTRAINT "PackingListItem_packingListId_fkey" FOREIGN KEY ("packingListId") REFERENCES "PackingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EGM" ADD CONSTRAINT "EGM_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EGM" ADD CONSTRAINT "EGM_blDraftVersionId_fkey" FOREIGN KEY ("blDraftVersionId") REFERENCES "BLDraftVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EGMContainer" ADD CONSTRAINT "EGMContainer_egmId_fkey" FOREIGN KEY ("egmId") REFERENCES "EGM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IGM" ADD CONSTRAINT "IGM_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrivalNotice" ADD CONSTRAINT "ArrivalNotice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDeclaration" ADD CONSTRAINT "ImportDeclaration_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order" ADD CONSTRAINT "delivery_order_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountBalance" ADD CONSTRAINT "AccountBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_shippingInstructionId_fkey" FOREIGN KEY ("shippingInstructionId") REFERENCES "ShippingInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationLine" ADD CONSTRAINT "DeclarationLine_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationLine" ADD CONSTRAINT "DeclarationLine_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "SiCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraft" ADD CONSTRAINT "BLDraft_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftContainer" ADD CONSTRAINT "BLDraftContainer_bLDraftId_fkey" FOREIGN KEY ("bLDraftId") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftCargo" ADD CONSTRAINT "BLDraftCargo_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "BLDraftContainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftVersion" ADD CONSTRAINT "BLDraftVersion_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BLDraftComment" ADD CONSTRAINT "BLDraftComment_draftNo_fkey" FOREIGN KEY ("draftNo") REFERENCES "BLDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
