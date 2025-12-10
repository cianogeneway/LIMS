-- Quotations Table
CREATE TABLE IF NOT EXISTS "Quotations" (
  "Id" TEXT PRIMARY KEY,
  "QuotationNumber" TEXT NOT NULL UNIQUE,
  "ClientId" TEXT NOT NULL,
  "ClientName" TEXT NOT NULL,
  "ClientEmail" TEXT,
  "ClientAddress" TEXT,
  "QuotationDate" TIMESTAMP NOT NULL,
  "ValidUntil" TIMESTAMP NOT NULL,
  "Status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
  "SubTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "VatAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "TotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "Currency" TEXT NOT NULL DEFAULT 'ZAR',
  "Notes" TEXT,
  "TermsAndConditions" TEXT,
  "CreatedBy" TEXT NOT NULL,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Quotation Line Items Table
CREATE TABLE IF NOT EXISTS "QuotationItems" (
  "Id" TEXT PRIMARY KEY,
  "QuotationId" TEXT NOT NULL REFERENCES "Quotations"("Id") ON DELETE CASCADE,
  "Description" TEXT NOT NULL,
  "Quantity" INTEGER NOT NULL DEFAULT 1,
  "UnitPrice" DECIMAL(10,2) NOT NULL,
  "TotalPrice" DECIMAL(10,2) NOT NULL,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reference Ranges / Test Limits Table
CREATE TABLE IF NOT EXISTS "ReferenceRanges" (
  "Id" TEXT PRIMARY KEY,
  "TestName" TEXT NOT NULL,
  "TestCode" TEXT,
  "ParameterName" TEXT NOT NULL,
  "MinValue" DECIMAL(10,4),
  "MaxValue" DECIMAL(10,4),
  "Unit" TEXT,
  "AgeGroup" TEXT, -- e.g., "Adult", "Pediatric", "Infant"
  "Gender" TEXT, -- "Male", "Female", "All"
  "Interpretation" TEXT, -- Description of what values mean
  "CriticalLow" DECIMAL(10,4), -- Critical low threshold
  "CriticalHigh" DECIMAL(10,4), -- Critical high threshold
  "Category" TEXT, -- e.g., "Hematology", "Chemistry", "Immunology"
  "IsActive" BOOLEAN DEFAULT true,
  "CreatedBy" TEXT NOT NULL,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Report Templates Table
CREATE TABLE IF NOT EXISTS "ReportTemplates" (
  "Id" TEXT PRIMARY KEY,
  "TemplateName" TEXT NOT NULL UNIQUE,
  "TemplateType" TEXT NOT NULL, -- e.g., "Paternity", "Blood_Profiling", "Genomics", "MicroArray"
  "Description" TEXT,
  "HeaderContent" TEXT, -- HTML or markdown for report header
  "FooterContent" TEXT, -- HTML or markdown for report footer
  "BodyTemplate" TEXT, -- HTML template with placeholders
  "IncludeReferenceRanges" BOOLEAN DEFAULT true,
  "IncludeInterpretation" BOOLEAN DEFAULT true,
  "IncludeQCMetrics" BOOLEAN DEFAULT false,
  "IsDefault" BOOLEAN DEFAULT false,
  "IsActive" BOOLEAN DEFAULT true,
  "CreatedBy" TEXT NOT NULL,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_quotations_client" ON "Quotations"("ClientId");
CREATE INDEX IF NOT EXISTS "idx_quotations_status" ON "Quotations"("Status");
CREATE INDEX IF NOT EXISTS "idx_quotations_date" ON "Quotations"("QuotationDate");
CREATE INDEX IF NOT EXISTS "idx_quotation_items_quotation" ON "QuotationItems"("QuotationId");
CREATE INDEX IF NOT EXISTS "idx_reference_ranges_test" ON "ReferenceRanges"("TestName");
CREATE INDEX IF NOT EXISTS "idx_reference_ranges_category" ON "ReferenceRanges"("Category");
CREATE INDEX IF NOT EXISTS "idx_report_templates_type" ON "ReportTemplates"("TemplateType");
