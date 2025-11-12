-- Migration to add additional fields to Instruments table for asset register
-- Run this SQL script to update the Instruments table

ALTER TABLE "Instruments"
ADD COLUMN IF NOT EXISTS "Supplier" text,
ADD COLUMN IF NOT EXISTS "Manufacturer" text,
ADD COLUMN IF NOT EXISTS "InvoiceDate" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "InvoiceNumber" text,
ADD COLUMN IF NOT EXISTS "ProductDescription" text,
ADD COLUMN IF NOT EXISTS "ShortDescription" text,
ADD COLUMN IF NOT EXISTS "AreaOfUse" text,
ADD COLUMN IF NOT EXISTS "ProductCode" text,
ADD COLUMN IF NOT EXISTS "UnitPrice2016_2018" numeric(18, 2),
ADD COLUMN IF NOT EXISTS "UnitPrice2019" numeric(18, 2),
ADD COLUMN IF NOT EXISTS "UnitPrice2023" numeric(18, 2),
ADD COLUMN IF NOT EXISTS "InsuranceReplacementValue" numeric(18, 2),
ADD COLUMN IF NOT EXISTS "MaintenanceType" text,
ADD COLUMN IF NOT EXISTS "ServiceDueDate" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "UnitMeasurement" text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "IX_Instruments_SerialNumber" ON "Instruments" ("SerialNumber");
CREATE INDEX IF NOT EXISTS "IX_Instruments_AreaOfUse" ON "Instruments" ("AreaOfUse");
CREATE INDEX IF NOT EXISTS "IX_Instruments_ServiceDueDate" ON "Instruments" ("ServiceDueDate");


